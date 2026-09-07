import { store } from "../store.js";
import { h, time12, modal, confirmBox } from "../util.js";

let unsubs = [], root;
export function mount(v){ root = h("div",{class:"page"}); v.append(root); unsubs.push(store.subscribe("timeline", render), store.subscribe("hmu", render)); }
export function unmount(){ unsubs.forEach(u=>u()); unsubs = []; }

function render(){
  const rows = store.get("timeline").slice().sort((a,b)=>a.time.localeCompare(b.time) || (a.order??0)-(b.order??0));
  const hmu = store.get("hmu").slice().sort((a,b)=>a.time.localeCompare(b.time));
  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Wedding Day"), h("span",{class:"sub"},"Saturday, October 10 · sunset ≈ 6:55 PM"), h("span",{class:"grow"}),
      h("button",{class:"btn sm", onClick:()=>window.print()}, "Print"), h("button",{class:"btn sm rose", onClick:()=>edit()}, "+ Item")),
    h("div",{class:"card"}, h("h2",null,"Timeline"),
      h("div",{class:"tline"}, rows.map(r=>h("div",{class:"tl-row", onClick:()=>edit(r)},
        h("div",{class:"tm"}, time12(r.time)),
        h("div",null, h("div",{class:"tt"}, r.title), r.who ? h("div",{class:"tw"}, r.who) : null, r.note ? h("div",{class:"tn"}, r.note) : null),
        h("div",null))))),
    h("div",{class:"card"}, h("h2",null,"Hair & makeup schedule", h("button",{class:"btn sm", onClick:()=>editHmu()}, "+ Slot")),
      hmu.length ? h("div",{class:"tline"}, hmu.map(r=>h("div",{class:"tl-row", onClick:()=>editHmu(r)}, h("div",{class:"tm"}, time12(r.time)), h("div",null, h("div",{class:"tt"}, r.person), h("div",{class:"tw"}, r.kind))))) : h("div",{class:"empty"},"Add who gets hair and makeup when. Bridesmaids arrive 8:30, Ally in the dress by 1:15.")),
  );
}
async function edit(r){
  const v = await modal({ title: r ? "Edit item" : "New item",
    fields:[{name:"time", label:"Time", type:"time"}, {name:"title", label:"What"}, {name:"who", label:"Who"}, {name:"note", label:"Note", type:"textarea"}],
    values:r, submit:r?"Save":"Add", danger:r?"Delete":null,
    onDanger: async ()=>{ if (await confirmBox(`Delete “${r.title}”?`)) store.remove("timeline", r.id, `removed “${r.title}” from the timeline`); } });
  if (!v || !v.title.trim() || !v.time) return;
  if (r) await store.update("timeline", r.id, v, `updated the timeline: ${time12(v.time)} ${v.title}`);
  else await store.add("timeline", {...v, order: Date.now()}, `added to the timeline: ${time12(v.time)} ${v.title}`);
}
async function editHmu(r){
  const v = await modal({ title: r ? "Edit slot" : "New slot",
    fields:[{name:"time", label:"Time", type:"time"}, {name:"person", label:"Who"}, {name:"kind", label:"Hair / Makeup", type:"select", options:["Hair","Makeup","Hair + Makeup"]}],
    values:r, submit:r?"Save":"Add", danger:r?"Delete":null, onDanger:()=>store.remove("hmu", r.id) });
  if (!v || !v.person.trim() || !v.time) return;
  if (r) await store.update("hmu", r.id, v); else await store.add("hmu", v, `added ${v.person} to the HMU schedule at ${time12(v.time)}`);
}
