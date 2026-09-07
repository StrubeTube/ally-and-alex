/* Small shared helpers: DOM, dates, modal, toast. */
export const WEDDING = new Date(2026, 9, 10);   // Oct 10, 2026 local

export function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  if (attrs) for (const [k,v] of Object.entries(attrs)){
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") el.innerHTML = v;
    else if (k in el && k !== "list" && typeof v !== "string") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat(Infinity)){ if (k == null || k === false) continue; el.append(k.nodeType ? k : document.createTextNode(String(k))); }
  return el;
}
export function esc(s){ return String(s ?? "").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* ---------- dates (all local, YYYY-MM-DD strings) ---------- */
export function today(){ return ymd(new Date()); }
export function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
export function parse(s){ if(!s) return null; const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
export function addDays(s, n){ const d = parse(s); d.setDate(d.getDate()+n); return ymd(d); }
export function fmt(s, opts){ const d = parse(s); if(!d) return ""; return d.toLocaleDateString("en-US", opts || {month:"short", day:"numeric"}); }
export function fmtLong(s){ return fmt(s, {weekday:"short", month:"short", day:"numeric"}); }
export function daysUntil(s){ const a = parse(today()), b = parse(s); return Math.round((b-a)/864e5); }
export function mondayOf(s){ const d = parse(s); const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow); return ymd(d); }
export function relDay(s){
  const n = daysUntil(s);
  if (n === 0) return "Today"; if (n === 1) return "Tomorrow"; if (n === -1) return "Yesterday";
  if (n < 0) return `${-n}d ago`; if (n < 7) return fmt(s, {weekday:"long"}); return fmt(s);
}
export function ago(ts){
  const s = Math.max(0, (Date.now()-ts)/1000);
  if (s < 60) return "just now"; if (s < 3600) return Math.floor(s/60)+"m ago"; if (s < 86400) return Math.floor(s/3600)+"h ago";
  const d = Math.floor(s/86400); return d === 1 ? "yesterday" : d < 7 ? d+"d ago" : new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
export function money(n){ const v = Number(n)||0; return (v<0?"−":"")+"$"+Math.abs(v).toLocaleString("en-US",{minimumFractionDigits: v%1?2:0, maximumFractionDigits:2}); }
export function time12(t){ if(!t) return ""; const [hh,mm] = t.split(":").map(Number); const ap = hh>=12?"PM":"AM"; return `${((hh+11)%12)+1}:${String(mm).padStart(2,"0")} ${ap}`; }

/* ---------- toast ---------- */
let toastT;
export function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(()=>el.hidden = true, 2200);
}

/* ---------- modal: fields -> values ---------- */
export function modal({title, fields, values, submit, danger, onDanger, cancel}){
  return new Promise(resolve=>{
    const form = h("form", {class:"modal-form"});
    const inputs = {};
    for (const f of fields || []){
      let inp;
      if (f.type === "select") inp = h("select", {class:"select", name:f.name}, f.options.map(o=>h("option",{value:o.value ?? o, selected:(values?.[f.name] ?? f.value) === (o.value ?? o)}, o.label ?? o)));
      else if (f.type === "textarea") inp = h("textarea", {class:"textarea", name:f.name, placeholder:f.placeholder||""});
      else inp = h("input", {class:"input", name:f.name, type:f.type||"text", placeholder:f.placeholder||"", inputmode:f.inputmode, step:f.step});
      if (f.type !== "select") inp.value = values?.[f.name] ?? f.value ?? "";
      inputs[f.name] = inp;
      form.append(h("div",{class:"field"}, h("label",null,f.label), inp));
    }
    const box = h("div",{class:"box"}, h("h3",null,title), form);
    const acts = h("div",{class:"modal-actions"});
    if (danger) acts.append(h("button",{type:"button", class:"btn danger ghost left", onClick:()=>{ close(); onDanger?.(); resolve(null); }}, danger));
    acts.append(h("button",{type:"button", class:"btn ghost", onClick:()=>{ close(); resolve(null); }}, cancel||"Cancel"));
    acts.append(h("button",{type:"submit", class:"btn primary", form:"__m"}, submit||"Save"));
    form.id = "__m"; box.append(acts);
    const wrap = h("div",{id:"modal", onClick:e=>{ if(e.target===wrap){ close(); resolve(null);} }}, box);
    function close(){ wrap.remove(); document.removeEventListener("keydown", esc); }
    function esc(e){ if(e.key==="Escape"){ close(); resolve(null);} }
    document.addEventListener("keydown", esc);
    form.addEventListener("submit", e=>{
      e.preventDefault();
      const out = {}; for (const [k,inp] of Object.entries(inputs)) out[k] = inp.value;
      close(); resolve(out);
    });
    document.body.append(wrap);
    const first = Object.values(inputs)[0]; if (first && !matchMedia("(max-width:600px)").matches) first.focus();
  });
}
export function confirmBox(msg){ return modal({title: msg, fields:[], submit:"Yes"}).then(r=>!!r); }
