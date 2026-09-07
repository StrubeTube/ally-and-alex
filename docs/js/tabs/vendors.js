import { store } from "../store.js";
import { h, money, modal, confirmBox } from "../util.js";

let unsubs = [], root;
export function mount(v){ root = h("div",{class:"page"}); v.append(root); unsubs.push(store.subscribe("vendors", render), store.subscribe("payments", render)); }
export function unmount(){ unsubs.forEach(u=>u()); unsubs = []; }

function render(){
  const vendors = store.get("vendors");
  const pays = store.get("payments");
  const confirmed = vendors.filter(v=>v.confirmed).length;
  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Vendors"), h("span",{class:"sub"}, `${confirmed}/${vendors.length} confirmed for wedding week`), h("span",{class:"grow"}), h("button",{class:"btn sm rose", onClick:()=>edit()}, "+ Vendor")),
    h("div",{class:"vendors"}, vendors.map(v=>{
      const owed = pays.filter(p=>!p.paid && p.vendor.toLowerCase().startsWith(v.name.toLowerCase().split(" ")[0]) && p.amount>0).reduce((a,p)=>a+p.amount,0);
      return h("div",{class:"card vendor", onClick:()=>edit(v)},
        h("div",{class:"row"}, h("div",{class:"grow"}, h("div",{class:"nm"}, v.name), h("div",{class:"role"}, v.role)),
          h("button",{class:"btn sm "+(v.confirmed?"sage":""), onClick:e=>{ e.stopPropagation(); store.update("vendors", v.id, {confirmed:!v.confirmed}, !v.confirmed ? `confirmed ${v.name}` : `un-confirmed ${v.name}`); }}, v.confirmed ? "✓ Confirmed" : "Confirm")),
        h("div",{class:"kv"},
          v.contact ? [h("b",null,"Contact"), h("span",null,v.contact)] : null,
          v.arrival ? [h("b",null,"Arrives"), h("span",null,v.arrival)] : null,
          owed ? [h("b",null,"Balance"), h("span",null,money(owed)+" still to pay")] : null),
        v.notes ? h("div",{class:"notes"}, v.notes) : null);
    })),
  );
}
async function edit(v){
  const r = await modal({ title: v ? "Edit vendor" : "New vendor",
    fields:[{name:"name", label:"Name"}, {name:"role", label:"What they do"}, {name:"contact", label:"Contact (name · phone · email)"}, {name:"arrival", label:"Arrival time / window"}, {name:"notes", label:"Notes", type:"textarea"}],
    values:v, submit:v?"Save":"Add", danger:v?"Delete":null,
    onDanger: async ()=>{ if (await confirmBox(`Delete ${v.name}?`)) store.remove("vendors", v.id, `removed vendor ${v.name}`); } });
  if (!r || !r.name.trim()) return;
  if (v) await store.update("vendors", v.id, r, `updated ${r.name}`); else await store.add("vendors", {...r, confirmed:false, order:Date.now()}, `added vendor ${r.name}`);
}
