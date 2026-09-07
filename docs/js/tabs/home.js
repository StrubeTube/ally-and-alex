import { store, seatMap, primaryChart } from "../store.js";
import { h, today, addDays, mondayOf, daysUntil, fmt, relDay, ago, money, WEDDING } from "../util.js";
import { MUSIC_SECTIONS } from "../../data/seed.js";

let unsubs = [], root;
export function mount(view){
  root = h("div",{class:"page"});
  view.append(root);
  const rerender = ()=>render();
  for (const c of ["tasks","payments","seats","charts","guests","songs","activity"]) unsubs.push(store.subscribe(c, rerender));
}
export function unmount(){ unsubs.forEach(u=>u()); unsubs = []; }

function render(){
  const tasks = store.get("tasks").filter(t=>t.source!=="suggested" || t.accepted);
  const t0 = today();
  const monday = mondayOf(t0), sunday = addDays(monday, 6);
  const open = tasks.filter(t=>t.status!=="done");
  const overdue = open.filter(t=>t.due && t.due < t0);
  const thisWeek = open.filter(t=>t.due && t.due >= t0 && t.due <= sunday);
  const mine = open.filter(t=>t.owner===store.who || t.owner==="Both");
  const done = tasks.filter(t=>t.status==="done").length;
  const pays = store.get("payments").filter(p=>!p.paid && p.amount);
  const soon = pays.filter(p=>p.amount>0 && p.due && daysUntil(p.due) <= 14).sort((a,b)=>a.due.localeCompare(b.due));
  const guests = store.get("guests"), seats = Object.keys(seatMap(primaryChart().id));
  const songs = store.get("songs").filter(s=>s.status==="pick");
  const anchors = MUSIC_SECTIONS.flatMap(s=>s.slots.filter(x=>!x.multi).map(x=>x.id));
  const anchorsDone = anchors.filter(a=>songs.some(s=>s.slot===a)).length;
  const act = store.get("activity").sort((a,b)=>b.at-a.at).slice(0,12);
  const suggested = store.get("tasks").filter(t=>t.source==="suggested" && !t.accepted && !t.dismissed).length;
  const days = daysUntil("2026-10-10");

  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null, greeting()), h("span",{class:"sub"}, `${days} days to go · ${fmt(t0,{weekday:"long", month:"long", day:"numeric"})}`)),
    h("div",{class:"kpis"},
      kpi(open.length, "open tasks", `${done} done · ${overdue.length} overdue`),
      kpi(mine.length, `for ${store.who}`, "or both of you"),
      kpi(`${seats.length}/${guests.length}`, "seated", `${guests.length-seats.length} to place · ${primaryChart().name}`),
      kpi(`${anchorsDone}/${anchors.length}`, "anchor songs", `${songs.length} picks total`),
      kpi(money(pays.reduce((a,p)=>a+p.amount,0)), "still to pay", `${soon.length} due in 14 days`),
    ),
    h("div",{class:"home-grid mt"},
      h("div",null,
        card("Overdue", overdue, "rose"),
        card("Due this week", thisWeek.sort((a,b)=>a.due.localeCompare(b.due))),
        suggested ? h("div",{class:"card tray"}, h("h2",null,"Suggested tasks"), h("div",null, `${suggested} ideas waiting in the Planner. `, h("a",{href:"#planner/suggested"}, "Review them →"))) : null,
      ),
      h("div",null,
        h("div",{class:"card"}, h("h2",null,"Payments due soon"),
          soon.length ? h("div",{class:"mini-list"}, soon.map(p=>h("div",{class:"mini"}, h("span",{class:"d"}, relDay(p.due)), h("span",null,p.vendor), h("span",{class:"a"}, money(p.amount))))) : h("div",{class:"empty"},"Nothing due in the next two weeks.")),
        h("div",{class:"card"}, h("h2",null,"Recent activity"),
          act.length ? h("div",{class:"act"}, act.map(a=>h("div",null, h("b",null,a.who), " ", a.text, h("span",{class:"when"}, ago(a.at))))) : h("div",{class:"empty"},"Nothing yet. Go check something off.")),
      ),
    ),
  );
}
function greeting(){
  const hr = new Date().getHours();
  const g = hr<12 ? "Good morning" : hr<17 ? "Good afternoon" : "Good evening";
  return `${g}, ${store.who}`;
}
function kpi(n, l, s){ return h("div",{class:"kpi"}, h("div",{class:"l"},l), h("div",{class:"n"},n), h("div",{class:"s"},s)); }
function card(title, list, tone){
  return h("div",{class:"card"}, h("h2",null, title, h("span",{class:"cnt"}, list.length)),
    list.length ? h("div",{class:"mini-list"}, list.slice(0,10).map(t=>h("div",{class:"mini"},
      h("span",{class:"d"+(tone==="rose"?" rose":"")}, relDay(t.due)),
      h("a",{href:"#planner", style:"color:inherit;text-decoration:none"}, t.title),
      h("span",{class:"owner "+t.owner, style:"margin-left:auto"}, t.owner)))) : h("div",{class:"empty"}, tone==="rose" ? "Nothing overdue. Nice." : "Nothing due this week."));
}
