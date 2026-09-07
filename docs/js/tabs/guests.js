/* Guest add/edit modal, used by the Seating tab (the Guests tab was retired). */
import { store } from "../store.js";
import { h, modal, confirmBox, toast } from "../util.js";
import { COLORS, GROUPS } from "../../data/seed.js";

export async function editGuest(g){
  const r = await modal({
    title: g ? "Edit guest" : "Add guest",
    fields:[
      {name:"name", label:"Name", placeholder:"Full name or how you call them"},
      {name:"short", label:"Short label (fits on the seat chip)", placeholder:"e.g. Chris W."},
      {name:"group", label:"Group", type:"select", options:GROUPS.map(x=>({value:x.id,label:x.title})), value:"friends"},
      {name:"color", label:"Color", type:"select", options:Object.entries(COLORS).map(([k,c])=>({value:k,label:c.label})), value:"black"},
    ],
    values:g, submit: g?"Save":"Add", danger: g?"Remove from guest list":null,
    onDanger: async ()=>{ if (await confirmBox(`Remove ${g.name} from the guest list?`)){ await store.remove("guests", g.id, `removed ${g.name} from the guest list`); for (const d of store.get("seats")) if ((d.guest||d.id)===g.id) await store.remove("seats", d.id); } },
  });
  if (!r || !r.name.trim()) return;
  r.name = r.name.trim(); r.short = (r.short||"").trim() || r.name.split(" ")[0];
  if (g) await store.update("guests", g.id, r, `edited guest ${r.name}`);
  else { await store.add("guests", {...r, order: 10000 + Date.now()%100000}, `added ${r.name} to the guest list`); toast("Added"); }
}
