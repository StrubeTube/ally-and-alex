import { store } from "../store.js";
import { h, money, fmt, today, daysUntil, modal, confirmBox } from "../util.js";

let unsub, root, view = "all";
export function mount(v){ root = h("div",{class:"page"}); v.append(root); unsub = store.subscribe("payments", render); }
export function unmount(){ unsub?.(); }

function render(){
  const all = store.get("payments");
  const t0 = today();
  const sum = (arr)=>arr.reduce((a,p)=>a+(Number(p.amount)||0),0);
  const parents = all.filter(p=>p.payer==="parents"), us = all.filter(p=>p.payer==="us");
  const rows = (view==="all" ? all : all.filter(p=>p.payer===view)).slice().sort((a,b)=>(a.paid-b.paid) || (a.due||"9999").localeCompare(b.due||"9999"));
  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Budget"), h("span",{class:"sub"},"Tap the box when a payment goes out.")),
    h("div",{class:"kpis"},
      kpi(money(sum(all.filter(p=>!p.paid))), "left to pay", `of ${money(sum(all))} total`),
      kpi(money(sum(us.filter(p=>!p.paid))), "you two, upcoming", `${money(sum(us.filter(p=>p.paid)))} paid so far`),
      kpi(money(sum(parents.filter(p=>!p.paid))), "parents, upcoming", `${money(sum(parents.filter(p=>p.paid)))} paid so far`),
      kpi(all.filter(p=>!p.paid && p.due && p.due < t0 && p.amount>0).length, "overdue", "check these first"),
    ),
    h("div",{class:"filters mt"},
      h("div",{class:"seg"}, [["all","Everything"],["us","Ally & Alex"],["parents","Parents"]].map(([v,l])=>h("button",{class:v===view?"on":"", onClick:()=>{ view=v; render(); }}, l))),
      h("span",{class:"grow"}), h("button",{class:"btn sm rose", onClick:()=>edit()}, "+ Payment"),
    ),
    h("div",{class:"card tbl-wrap"}, h("table",{class:"tbl"},
      h("thead",null, h("tr",null, h("th",null,""), h("th",null,"Vendor"), h("th",null,"Due"), h("th",null,"Who pays"), h("th",{class:"amt"},"Amount"))),
      h("tbody",null, rows.map(p=>{
        const late = !p.paid && p.due && p.due < t0 && p.amount>0;
        return h("tr",{class:p.paid?"paid":"", onClick:()=>edit(p)},
          h("td",null, h("button",{class:"paybox "+(p.paid?"on":""), onClick:async e=>{ e.stopPropagation(); await store.update("payments", p.id, {paid:!p.paid}, !p.paid ? `marked ${p.vendor} ${money(p.amount)} as paid` : `unmarked ${p.vendor} ${money(p.amount)}`); }}, p.paid?"✓":"")),
          h("td",{class:"v"}, h("div",null,p.vendor), p.note ? h("div",{class:"faint", style:"font-size:12px"}, p.note) : null),
          h("td",{class:late?"due late":"due"}, p.due ? (late ? fmt(p.due)+" · late" : daysUntil(p.due) <= 7 && !p.paid ? fmt(p.due)+" · soon" : fmt(p.due)) : "TBD"),
          h("td",null, h("span",{class:"pill "+(p.payer==="us"?"rose":"gold")}, p.payer==="us"?"Ally & Alex":"Parents")),
          h("td",{class:"amt"}, p.amount ? money(p.amount) : h("span",{class:"faint"},"TBD")));
      })),
    )),
  );
}
function kpi(n,l,s){ return h("div",{class:"kpi"}, h("div",{class:"l"},l), h("div",{class:"n"},n), h("div",{class:"s"},s)); }

async function edit(p){
  const r = await modal({
    title: p ? "Edit payment" : "New payment",
    fields:[
      {name:"vendor", label:"Vendor / item"},
      {name:"amount", label:"Amount", type:"number", step:"0.01", inputmode:"decimal"},
      {name:"due", label:"Due date", type:"date"},
      {name:"payer", label:"Who pays", type:"select", options:[{value:"us",label:"Ally & Alex"},{value:"parents",label:"Parents"}]},
      {name:"note", label:"Note"},
    ],
    values:p, submit:p?"Save":"Add", danger:p?"Delete":null,
    onDanger: async ()=>{ if (await confirmBox(`Delete ${p.vendor} ${money(p.amount)}?`)) store.remove("payments", p.id, `deleted payment ${p.vendor} ${money(p.amount)}`); },
  });
  if (!r || !r.vendor.trim()) return;
  r.amount = Number(r.amount)||0;
  if (p) await store.update("payments", p.id, r, `edited payment ${r.vendor}`);
  else await store.add("payments", {...r, paid:false, order: Date.now()}, `added payment ${r.vendor} ${money(r.amount)}`);
}
