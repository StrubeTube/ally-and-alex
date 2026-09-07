/* Honeymoon planner — Greece, Oct 11–23, 2026. Day-by-day itinerary with
   flights, stays, reservations, activities and per-stop idea buckets.
   Items live in trip/{id} = {date|null, stop, time, type, title, details, conf, cost, link, status}. */
import { store } from "../store.js";
import { h, fmt, parse, ymd, addDays, daysUntil, time12, money, modal, confirmBox, toast } from "../util.js";
import { STOPS, TRIP_START, TRIP_END } from "../../data/seed.js";

const TYPES = {
  flight:   {icon:"✈️", label:"Flight"},
  stay:     {icon:"🏨", label:"Stay"},
  transport:{icon:"🚕", label:"Transfer / ferry / car"},
  food:     {icon:"🍽️", label:"Restaurant"},
  activity: {icon:"🌅", label:"Activity / tour"},
  note:     {icon:"📝", label:"Note"},
};
const STATUS = {booked:{label:"Booked", cls:"sage"}, planned:{label:"Planned", cls:"gold"}, idea:{label:"Idea", cls:""}};

let unsub, root;
export function mount(v){ root = h("div",{class:"page hm"}); v.append(root); unsub = store.subscribe("trip", render); }
export function unmount(){ unsub?.(); }

function days(){
  const out = []; let n = 1;
  for (let d = TRIP_START; d <= TRIP_END; d = addDays(d,1)) out.push({date:d, n:n++, stop: stopFor(d)});
  return out;
}
function stopFor(date){ return STOPS.find(s=>date>=s.from && date<=s.to) || STOPS[STOPS.length-1]; }
function stopById(id){ return STOPS.find(s=>s.id===id); }
function eur(n){ return n ? "€"+Number(n).toLocaleString("en-US",{maximumFractionDigits:0}) : ""; }

function render(){
  const items = store.get("trip");
  const y = window.scrollY;
  const dl = days();
  const booked = items.filter(i=>i.status==="booked").length;
  const cost = items.reduce((a,i)=>a+(Number(i.cost)||0),0);
  const until = daysUntil(TRIP_START);
  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Honeymoon"), h("span",{class:"sub"}, `Greece · Oct 11 – 23 · ${until} days away`), h("span",{class:"grow"}),
      h("button",{class:"btn sm rose", onClick:()=>edit()}, "+ Add")),
    h("div",{class:"route"}, STOPS.map((s,i)=>[
      i ? h("span",{class:"route-arrow"},"→") : null,
      h("a",{class:"route-stop", href:"#honeymoon", style:`--c:${s.color}`, onClick:e=>{ e.preventDefault(); document.getElementById("day-"+s.from)?.scrollIntoView({behavior:"smooth", block:"start"}); }},
        h("span",{class:"route-ic"}, s.emoji), h("b",null,s.name), h("span",{class:"route-when"}, s.from===s.to ? fmt(s.from) : `${fmt(s.from)} – ${fmt(s.to)}`, s.nights ? ` · ${s.nights} night${s.nights>1?"s":""}` : "")),
    ])),
    h("div",{class:"kpis mt"},
      kpi(`${dl.length}`, "days", `${STOPS.reduce((a,s)=>a+(s.nights||0),0)} nights`),
      kpi(`${booked}`, "booked", `${items.filter(i=>i.status==="planned").length} planned · ${items.filter(i=>i.status==="idea").length} ideas`),
      kpi(eur(cost) || "€0", "logged spend", "sum of costs entered"),
    ),
  );
  for (const d of dl){
    const list = items.filter(i=>i.date===d.date).sort(byTime);
    const s = d.stop;
    const first = s.from===d.date;
    root.append(h("section",{class:"day", id:"day-"+d.date, style:`--c:${s.color}`},
      h("div",{class:"day-head"},
        h("div",{class:"day-date"}, h("b",null, fmt(d.date,{weekday:"long"})), h("span",null, fmt(d.date,{month:"long", day:"numeric"}))),
        h("span",{class:"day-n"}, `Day ${d.n}`),
        h("span",{class:"day-stop"}, s.emoji, " ", first && s.arrive ? s.arrive : s.name),
        h("span",{class:"grow"}),
        h("button",{class:"btn sm", onClick:()=>edit(null, {date:d.date, stop:s.id})}, "+ Add")),
      list.length ? h("div",{class:"items"}, list.map(itemRow)) : h("div",{class:"empty", style:"padding:8px; text-align:left"}, "Nothing planned yet."),
    ));
  }
  const ideas = items.filter(i=>!i.date);
  if (ideas.length || true){
    root.append(h("h2",{class:"hm-h2 mt"},"Ideas by stop"));
    for (const s of STOPS.filter(s=>s.nights)){
      const list = ideas.filter(i=>i.stop===s.id).sort((a,b)=>(a.order??0)-(b.order??0));
      root.append(h("div",{class:"card ideas", style:`--c:${s.color}`},
        h("h2",null, s.emoji+" "+s.name, h("button",{class:"btn sm", onClick:()=>edit(null, {stop:s.id, status:"idea"})}, "+ Idea")),
        list.length ? h("div",{class:"items"}, list.map(itemRow)) : h("div",{class:"empty", style:"padding:6px; text-align:left"}, "No ideas yet. Restaurants, beaches, boat days, wineries…")));
    }
  }
  window.scrollTo(0, y);
}
function byTime(a,b){ return (a.time||"99").localeCompare(b.time||"99") || (a.order??0)-(b.order??0); }
function kpi(n,l,s){ return h("div",{class:"kpi"}, h("div",{class:"l"},l), h("div",{class:"n"},n), h("div",{class:"s"},s)); }

function itemRow(i){
  const t = TYPES[i.type] || TYPES.note, st = STATUS[i.status] || STATUS.planned;
  return h("div",{class:"hm-item "+(i.status||""), onClick:()=>edit(i)},
    h("div",{class:"hm-ic"}, t.icon),
    h("div",{class:"hm-body"},
      h("div",{class:"hm-title"}, i.time ? h("span",{class:"hm-time"}, time12(i.time)) : null, i.title),
      i.details ? h("div",{class:"hm-details"}, i.details) : null,
      h("div",{class:"hm-meta"},
        h("span",{class:"pill "+st.cls}, st.label),
        i.conf ? h("span",{class:"pill"}, "# "+i.conf) : null,
        i.cost ? h("span",{class:"pill"}, eur(i.cost)) : null,
        i.link ? h("a",{href:i.link, target:"_blank", rel:"noopener", onClick:e=>e.stopPropagation()}, "link ↗") : null,
        !i.date && i.stop ? h("button",{class:"btn sm ghost", onClick:e=>{ e.stopPropagation(); schedule(i); }}, "Schedule") : null,
      )),
  );
}

async function schedule(i){
  const s = stopById(i.stop);
  const opts = days().filter(d=>!s || d.stop.id===s.id).map(d=>({value:d.date, label:`${fmt(d.date,{weekday:"short", month:"short", day:"numeric"})} · ${d.stop.name}`}));
  const r = await modal({ title:"Put it on a day", fields:[{name:"date", label:"Day", type:"select", options:opts}, {name:"time", label:"Time (optional)", type:"time"}], submit:"Schedule" });
  if (!r) return;
  await store.update("trip", i.id, {date:r.date, time:r.time||"", status: i.status==="idea" ? "planned" : i.status}, `scheduled “${i.title}” for ${fmt(r.date)}`);
}

async function edit(i, preset={}){
  const dayOpts = [{value:"", label:"Idea (no day yet)"}, ...days().map(d=>({value:d.date, label:`${fmt(d.date,{weekday:"short", month:"short", day:"numeric"})} · ${d.stop.name}`}))];
  const r = await modal({
    title: i ? "Edit" : "Add to the trip",
    fields:[
      {name:"title", label:"What", placeholder:"e.g. Dinner at Metaxy Mas"},
      {name:"type", label:"Type", type:"select", options:Object.entries(TYPES).map(([v,t])=>({value:v, label:t.icon+" "+t.label})), value: preset.type || "activity"},
      {name:"date", label:"Day", type:"select", options:dayOpts, value: preset.date || ""},
      {name:"time", label:"Time", type:"time"},
      {name:"stop", label:"Stop", type:"select", options:STOPS.map(s=>({value:s.id, label:s.emoji+" "+s.name})), value: preset.stop || (preset.date ? stopFor(preset.date).id : "jtr")},
      {name:"status", label:"Status", type:"select", options:Object.entries(STATUS).map(([v,s])=>({value:v, label:s.label})), value: preset.status || "planned"},
      {name:"details", label:"Details", type:"textarea", placeholder:"Address, what's included, who to ask for…"},
      {name:"conf", label:"Confirmation #"},
      {name:"cost", label:"Cost (€)", type:"number", inputmode:"decimal", step:"0.01"},
      {name:"link", label:"Link", type:"url", placeholder:"https://"},
    ],
    values: i, submit: i ? "Save" : "Add", danger: i ? "Delete" : null,
    onDanger: async ()=>{ if (await confirmBox(`Delete “${i.title}”?`)) store.remove("trip", i.id, `removed “${i.title}” from the honeymoon`); },
  });
  if (!r || !r.title.trim()) return;
  r.title = r.title.trim(); r.date = r.date || null; r.cost = Number(r.cost)||0;
  if (r.date) r.stop = stopFor(r.date).id;
  if (i) await store.update("trip", i.id, r, `updated “${r.title}” on the honeymoon`);
  else { await store.add("trip", {...r, order: Date.now()}, `added “${r.title}” to the honeymoon${r.date ? " on "+fmt(r.date) : " ideas"}`); toast("Added"); }
}
