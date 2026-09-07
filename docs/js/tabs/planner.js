import { store } from "../store.js";
import { h, today, addDays, mondayOf, fmt, fmtLong, daysUntil, modal, confirmBox, toast } from "../util.js";
import { CATEGORIES } from "../../data/seed.js";

let unsub, root, filter = {owner:"all", showDone:true}, showSuggested = false;

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

async function editTask(t){
  const r = await modal({
    title: t ? "Edit task" : "New task",
    fields:[
      {name:"title", label:"Task", placeholder:"What needs to happen"},
      {name:"owner", label:"Owner", type:"select", options:["Ally","Alex","Both"], value: store.who},
      {name:"due", label:"Due", type:"date"},
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
