import { store } from "../store.js";
import { h, today, addDays, mondayOf, parse, fmt, fmtLong, daysUntil, modal, confirmBox, toast } from "../util.js";
import { CATEGORIES } from "../../data/seed.js";

let unsub, root, filter = {owner:"all", showDone:true}, showSuggested = false;
let view = localStorage.getItem("ally-alex-planner-view") || "cal";
let selDay = null;   // mobile: which day is expanded under the calendar
const MILESTONES = {
  "2026-09-10": {t:"Planner meeting", cls:"gold"},
  "2026-09-15": {t:"Music due to strings + DJ", cls:"rose"},
  "2026-09-17": {t:"Bachelor trip", cls:"gold"},
  "2026-09-27": {t:"Chania hotel free-cancel ends", cls:"rose"},
  "2026-10-10": {t:"Wedding day", cls:"ink"},
  "2026-10-11": {t:"Honeymoon ✈", cls:"sage"},
};

export function mount(view){
  root = h("div",{class:"page"});
  view.append(root);
  showSuggested = location.hash.includes("/suggested");
  unsub = store.subscribe("tasks", render);
}
export function unmount(){ unsub?.(); }

/* Weeks: Monday-based, from the week of Sept 7 through wedding week, then "After". */
function weeks(){
  const out = [];
  const first = "2026-09-07";
  for (let m = first; m <= "2026-10-05"; m = addDays(m, 7)){
    const end = addDays(m, 6);
    out.push({start:m, end, title: m==="2026-10-05" ? "Wedding week" : `Week of ${fmt(m)}`, when:`${fmt(m)} – ${fmt(end)}`});
  }
  out.unshift({start:"0000-00-00", end:addDays(first,-1), title:"Before", when:"Earlier"});
  out.push({start:"2026-10-11", end:"9999-99-99", title:"After the wedding", when:"Oct 11 onward"});
  out.push({start:null, end:null, title:"No date yet", when:""});
  return out;
}

function render(){
  const all = store.get("tasks");
  const suggested = all.filter(t=>t.source==="suggested" && !t.accepted && !t.dismissed);
  let tasks = all.filter(t=>t.source!=="suggested" || t.accepted);
  if (filter.owner !== "all") tasks = tasks.filter(t=>t.owner===filter.owner || t.owner==="Both");
  if (!filter.showDone) tasks = tasks.filter(t=>t.status!=="done");
  const t0 = today(), thisMonday = mondayOf(t0);
  const openCount = all.filter(t=>(t.source!=="suggested"||t.accepted) && t.status!=="done").length;

  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Planner"), h("span",{class:"sub"}, `${openCount} open · ${daysUntil("2026-10-10")} days left`)),
    h("div",{class:"filters"},
      seg(["cal","list"], view, v=>{ view=v; localStorage.setItem("ally-alex-planner-view", v); render(); }, {cal:"📅 Calendar", list:"☰ List"}),
      seg(["all","Ally","Alex"], filter.owner, v=>{ filter.owner=v; render(); }, {all:"Everyone"}),
      h("button",{class:"btn sm "+(filter.showDone?"":"primary"), onClick:()=>{ filter.showDone=!filter.showDone; render(); }}, filter.showDone ? "Hide done" : "Show done"),
      h("span",{class:"grow"}),
      suggested.length ? h("button",{class:"btn sm "+(showSuggested?"primary":""), onClick:()=>{ showSuggested=!showSuggested; render(); }}, `💡 Suggested (${suggested.length})`) : null,
      h("button",{class:"btn sm rose", onClick:()=>editTask()}, "+ Task"),
    ),
  );
  if (showSuggested && suggested.length){
    root.append(h("div",{class:"card tray mb"},
      h("h2",null,"Suggested by Claude", h("span",{class:"cnt"}, `${suggested.length} to review`)),
      h("div",{class:"tasks"}, suggested.sort(byDue).map(t=>taskRow(t, true))),
    ));
  }
  if (view === "cal"){ root.append(calendar(tasks, t0)); return; }
  const ids = new Set(tasks.map(t=>t.id));
  const childrenOf = id => tasks.filter(t=>t.parent===id).sort(byDue);
  const tops = tasks.filter(t=>!t.parent || !ids.has(t.parent));
  for (const w of weeks()){
    const list = tops.filter(t=> w.start===null ? !t.due : (t.due && t.due>=w.start && t.due<=w.end)).sort(byDue);
    if (!list.length && (w.title==="Before" || w.title==="No date yet")) continue;
    const flat = list.flatMap(t=>[t, ...childrenOf(t.id)]);
    const done = flat.filter(t=>t.status==="done").length;
    const isNow = w.start===thisMonday;
    root.append(h("section",{class:"week"+(isNow?" now":"")},
      h("div",{class:"week-head"}, h("h2",null, w.title), h("span",{class:"when"}, w.when + (isNow?" · this week":"")), h("span",{class:"prog"}, flat.length ? `${done}/${flat.length}` : "")),
      list.length ? h("div",{class:"tasks"}, list.map(t=>[taskRow(t, false, childrenOf(t.id)), ...childrenOf(t.id).map(c=>taskRow(c, false, [], true))])) : h("div",{class:"empty"},"Nothing scheduled."),
    ));
  }
}
/* ---------- calendar view ---------- */
function calendar(tasks, t0){
  const first = "2026-09-07", last = "2026-10-11";
  const wrap = h("div",{class:"cal"});
  const byDay = {};
  for (const t of tasks) if (t.due) (byDay[t.due] ||= []).push(t);
  const undated = tasks.filter(t=>!t.due && t.status!=="done");
  const nextWeek = mondayOf(t0);
  // legend + undated
  wrap.append(h("div",{class:"cal-legend"},
    h("span",null, h("i",{class:"lg Ally"}), "Ally"), h("span",null, h("i",{class:"lg Alex"}), "Alex"), h("span",null, h("i",{class:"lg Both"}), "Both"),
    h("span",null, h("i",{class:"lg late"}), "overdue"), h("span",{class:"faint"},"· tap a task to edit, tap a date's + to add"),
    undated.length ? h("span",{class:"grow right"}, h("button",{class:"btn sm ghost", onClick:()=>{ view="list"; render(); }}, `${undated.length} undated → list`)) : null));
  wrap.append(h("div",{class:"cal-head"}, ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>h("div",null,d))));
  for (let m = first; m <= last; m = addDays(m, 7)){
    const weekTasks = []; for (let i=0;i<7;i++) weekTasks.push(...(byDay[addDays(m,i)]||[]));
    const open = weekTasks.filter(t=>t.status!=="done");
    const isNow = m === nextWeek;
    const row = h("div",{class:"cal-week"+(isNow?" now":"")});
    for (let i=0;i<7;i++){
      const d = addDays(m, i);
      const list = (byDay[d]||[]).sort((a,b)=>(a.status==="done")-(b.status==="done") || (a.order??0)-(b.order??0));
      const openN = list.filter(t=>t.status!=="done").length;
      const ms = MILESTONES[d];
      const isToday = d===t0, past = d < t0;
      const cell = h("div",{class:"cal-day"+(isToday?" today":"")+(past?" past":"")+(d===selDay?" sel":"")+(openN>=4?" heavy":""), onClick:e=>{ if (e.target.closest(".cchip,.btn")) return; selDay = selDay===d ? null : d; render(); }},
        h("div",{class:"cal-dn"}, h("b",null, parse(d).getDate()), i===0 || parse(d).getDate()===1 ? h("span",{class:"mon"}, fmt(d,{month:"short"})) : null,
          h("span",{class:"grow"}), openN ? h("span",{class:"cnt"}, openN) : null,
          h("button",{class:"btn sm ghost cal-add", title:"Add a task on this day", onClick:e=>{ e.stopPropagation(); editTask(null, {due:d}); }}, "+")),
        ms ? h("div",{class:"ms "+ms.cls}, ms.t) : null,
        h("div",{class:"cchips"}, list.map(t=>chip(t, t0))),
      );
      row.append(cell);
    }
    const lbl = h("div",{class:"cal-wk"}, h("b",null, m==="2026-10-05" ? "Wedding week" : "Week of "+fmt(m)),
      h("span",null, `${open.length} open`), h("span",{class:"split"}, ownerSplit(open)));
    wrap.append(h("div",{class:"cal-row"}, lbl, row));
    if (selDay && selDay>=m && selDay<=addDays(m,6)){
      const list = (byDay[selDay]||[]).sort((a,b)=>(a.status==="done")-(b.status==="done"));
      wrap.append(h("div",{class:"cal-detail"}, h("div",{class:"week-head"}, h("h2",null, fmtLong(selDay)), h("span",{class:"when"}, MILESTONES[selDay]?.t||""), h("span",{class:"grow"}), h("button",{class:"btn sm rose", onClick:()=>editTask(null,{due:selDay})}, "+ Task")),
        list.length ? h("div",{class:"tasks"}, list.map(t=>taskRow(t))) : h("div",{class:"empty"},"Nothing on this day.")));
    }
  }
  return wrap;
}
function ownerSplit(list){
  const c = {Ally:0, Alex:0, Both:0}; for (const t of list) c[t.owner] = (c[t.owner]||0)+1;
  return [c.Ally?`Ally ${c.Ally}`:null, c.Alex?`Alex ${c.Alex}`:null, c.Both?`Both ${c.Both}`:null].filter(Boolean).join(" · ");
}
function chip(t, t0){
  const late = t.due < t0 && t.status!=="done";
  return h("button",{class:"cchip "+t.owner+(t.status==="done"?" done":"")+(late?" late":"")+(t.status==="doing"?" doing":""), title:t.title, onClick:e=>{ e.stopPropagation(); editTask(t); }},
    t.status==="done" ? "✓ " : "", t.parent ? "↳ " : "", t.title);
}
function byDue(a,b){ return (a.due||"9999").localeCompare(b.due||"9999") || (a.order??0)-(b.order??0); }
function seg(opts, cur, on, labels={}){ return h("div",{class:"seg"}, opts.map(o=>h("button",{class:o===cur?"on":"", onClick:()=>on(o)}, labels[o]||o))); }

function taskRow(t, tray, kids=[], isChild=false){
  const t0 = today();
  const late = t.due && t.due < t0 && t.status!=="done";
  const next = {todo:"doing", doing:"done", done:"todo"};
  const chk = h("button",{class:"chk "+t.status, title: t.status, onClick:async e=>{
    e.stopPropagation();
    if (tray) return;
    const s = next[t.status]||"todo";
    await store.update("tasks", t.id, {status:s}, s==="done" ? `checked off “${t.title}”` : s==="doing" ? `started “${t.title}”` : `reopened “${t.title}”`);
  }}, t.status==="done"?"✓": t.status==="doing"?"…":"");
  const kidsDone = kids.filter(k=>k.status==="done").length;
  return h("div",{class:"task "+t.status+(late?" overdue":"")+(isChild?" child":""), onClick:()=>editTask(t)},
    chk,
    h("div",null,
      h("div",{class:"t-title"}, t.title),
      h("div",{class:"t-meta"}, h("span",{class:"cat"}, t.cat), t.due ? h("span",{class:"due"+(late?" late":"")}, late ? `${fmtLong(t.due)} · overdue` : fmtLong(t.due)) : h("span",{class:"faint"},"no date"), t.source==="suggested" && !tray ? h("span",{class:"pill gold"},"suggested") : null, kids.length ? h("span",{class:"pill"}, `${kidsDone}/${kids.length} sub-items`) : null),
      t.notes ? h("div",{class:"t-notes"}, t.notes) : null,
      tray ? h("div",{class:"tray-actions mt", onClick:e=>e.stopPropagation()},
        h("button",{class:"btn sm sage", onClick:()=>store.update("tasks", t.id, {accepted:true}, `accepted the suggestion “${t.title}”`)}, "Accept"),
        h("button",{class:"btn sm ghost", onClick:()=>store.update("tasks", t.id, {dismissed:true})}, "Dismiss"),
      ) : null,
    ),
    h("div",{class:"t-right"}, h("span",{class:"owner "+t.owner}, t.owner)),
  );
}

async function editTask(t, preset={}){
  const r = await modal({
    title: t ? "Edit task" : "New task",
    fields:[
      {name:"title", label:"Task", placeholder:"What needs to happen"},
      {name:"owner", label:"Owner", type:"select", options:["Ally","Alex","Both"], value: store.who},
      {name:"due", label:"Due", type:"date", value: preset.due || ""},
      {name:"cat", label:"Category", type:"select", options:CATEGORIES},
      {name:"status", label:"Status", type:"select", options:[{value:"todo",label:"To do"},{value:"doing",label:"In progress"},{value:"done",label:"Done"}]},
      {name:"parent", label:"Sub-item of", type:"select", options:[{value:"", label:"— none —"}, ...store.get("tasks").filter(x=>(x.source!=="suggested"||x.accepted) && !x.parent && x.id!==t?.id && x.status!=="done").sort(byDue).map(x=>({value:x.id, label:(x.due?fmt(x.due)+" · ":"")+x.title}))], value:""},
      {name:"notes", label:"Notes", type:"textarea"},
    ],
    values: t,
    submit: t ? "Save" : "Add",
    danger: t ? "Delete" : null,
    onDanger: async ()=>{ if (await confirmBox(`Delete “${t.title}”?`)) store.remove("tasks", t.id, `deleted “${t.title}”`); },
  });
  if (!r || !r.title.trim()) return;
  r.title = r.title.trim();
  if (t){
    const changed = Object.keys(r).filter(k=>(r[k]||"")!==(t[k]||""));
    if (!changed.length) return;
    await store.update("tasks", t.id, r, changed.includes("status") ? null : `edited “${r.title}”`);
    if (changed.includes("status") && r.status==="done") store.log(`checked off “${r.title}”`, "tasks");
  } else {
    await store.add("tasks", {...r, source:"ours", order: Date.now()}, `added “${r.title}”`);
    toast("Added");
  }
}
