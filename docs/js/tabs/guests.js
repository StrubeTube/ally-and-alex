import { store } from "../store.js";
import { h, modal, confirmBox, toast } from "../util.js";
import { COLORS, GROUPS, TABLES } from "../../data/seed.js";

let unsubs = [], root, q = "";
export function mount(view){
  root = h("div",{class:"page"}); view.append(root);
  unsubs.push(store.subscribe("guests", render), store.subscribe("seats", render), store.subscribe("settings", render));
}
export function unmount(){ unsubs.forEach(u=>u()); unsubs = []; }

function seatLabel(seat){
  if (!seat) return "";
  const tid = seat.split("-").slice(0,-1).join("-");
  const names = store.getOne("settings","tables")?.names || {};
  const t = TABLES.find(x=>x.id===tid);
  return names[tid] || t?.label || tid;
}

function render(){
  const guests = store.get("guests");
  const seats = Object.fromEntries(store.get("seats").map(s=>[s.id, s.seat]));
  const seated = guests.filter(g=>seats[g.id]).length;
  const cap = TABLES.reduce((a,t)=>a + t.perSide*2 + (t.ends?2:0), 0);
  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Guests"), h("span",{class:"sub"}, `${guests.length} people · ${seated} seated · ${cap} seats on the floor`)),
    h("div",{class:"filters"},
      h("input",{class:"input", style:"max-width:260px", placeholder:"Find a guest…", value:q, onInput:e=>{ q=e.target.value; render(); }}),
      h("span",{class:"grow"}),
      h("button",{class:"btn sm rose", onClick:()=>editGuest()}, "+ Guest"),
    ),
    h("div",{class:"card mb"}, h("h2",null,"Color key"), h("div",{class:"legend"}, Object.entries(COLORS).map(([k,c])=>h("span",null, h("i",{class:"dot", style:`background:${c.bg}`}), c.label)))),
    h("div",{class:"guest-groups"}, GROUPS.map(gr=>{
      const list = guests.filter(g=>g.group===gr.id && (!q || g.name.toLowerCase().includes(q.toLowerCase())));
      if (!list.length) return null;
      return h("div",{class:"card"}, h("h2",null, gr.title, h("span",{class:"cnt"}, `${list.filter(g=>seats[g.id]).length}/${list.length} seated`)),
        list.map(g=>h("div",{class:"guest-row", onClick:()=>editGuest(g)},
          h("i",{class:"dot", style:`background:${(COLORS[g.color]||COLORS.plain).bg}`}),
          h("span",{class:"nm"}, g.name),
          h("span",{class:"seatlbl"}, seatLabel(seats[g.id]) || "unseated"))));
    })),
  );
}

async function editGuest(g){
  const r = await modal({
    title: g ? "Edit guest" : "Add guest",
    fields:[
      {name:"name", label:"Name", placeholder:"Full name or how you call them"},
      {name:"short", label:"Short label (fits on the seat chip)", placeholder:"e.g. Chris W."},
      {name:"group", label:"Group", type:"select", options:GROUPS.map(x=>({value:x.id,label:x.title})), value:"friends"},
      {name:"color", label:"Color", type:"select", options:Object.entries(COLORS).map(([k,c])=>({value:k,label:c.label})), value:"black"},
    ],
    values:g, submit: g?"Save":"Add", danger: g?"Remove":null,
    onDanger: async ()=>{ if (await confirmBox(`Remove ${g.name} from the guest list?`)){ await store.remove("guests", g.id, `removed ${g.name} from the guest list`); await store.remove("seats", g.id); } },
  });
  if (!r || !r.name.trim()) return;
  r.name = r.name.trim(); r.short = (r.short||"").trim() || r.name.split(" ")[0];
  if (g) await store.update("guests", g.id, r, `edited guest ${r.name}`);
  else { await store.add("guests", {...r, order: 10000 + Date.now()%100000}, `added ${r.name} to the guest list`); toast("Added"); }
}
