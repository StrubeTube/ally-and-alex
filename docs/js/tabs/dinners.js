/* Honeymoon → Dinners: pick where to eat each night of the trip.
   nights/{date}  = {date, stop, vibe, time, conf, notes, chosen}
   dinners/{id}   = {night, stop, name, area, cuisine, walk, price, view, hours, tldr, chicken, tags, maps, site, menu, reserve, pick, status, voteAlly, voteAlex, notes, order}
   Choosing an option writes trip/dinner-{date} so it shows up in Days, Board and the hour view. */
import { store } from "../store.js";
import { h, fmt, addDays, time12, modal, confirmBox, toast } from "../util.js";
import { STOPS, TRIP_START, TRIP_END } from "../../data/seed.js";

const HOTEL = {ath1:"COCO-MAT", jtr:"Cavo Tagoo", chq:"Residenza Vranas", ath2:"Zeus Dolce"};
const VOTES = [["love","❤️","Love it"],["ok","👍","Happy to"],["no","👎","Pass"]];
const PRICES = ["€","€€","€€€","€€€€"];
let sel = null;
let rerender = ()=>{};
export function onRerender(fn){ rerender = fn; }

export function nights(){
  const out = [];
  for (let d = TRIP_START; d <= TRIP_END; d = addDays(d,1)){
    const s = STOPS.find(x=>d>=x.from && d<=x.to);
    if (!s || !s.nights) continue;
    out.push({date:d, stop:s});
  }
  return out;
}
function nightDoc(date){ return store.getOne("nights", date) || {date, vibe:"", time:"20:00", conf:"", notes:"", chosen:""}; }
function score(o){ const v = {love:2, ok:1, no:-2}; return (v[o.voteAlly]||0) + (v[o.voteAlex]||0); }
function stopOf(date){ return STOPS.find(x=>date>=x.from && date<=x.to); }
function shortStop(s){ return s.id.startsWith("ath") ? "Athens" : s.id==="jtr" ? "Santorini" : "Chania"; }

export function view(){
  const list = nights();
  const all = store.get("dinners");
  if (!sel || !list.some(n=>n.date===sel)) sel = (list.find(n=>!nightDoc(n.date).chosen) || list[0]).date;
  const wrap = h("div",{class:"dinners"});

  // night strip
  const strip = h("div",{class:"nstrip"});
  list.forEach((n)=>{
    const nd = nightDoc(n.date);
    const opts = all.filter(o=>o.night===n.date && o.status!=="passed");
    const chosen = opts.find(o=>o.id===nd.chosen);
    strip.append(h("button",{class:"ncard"+(n.date===sel?" on":"")+(chosen?" done":""), style:`--c:${n.stop.color}`, onClick:()=>{ sel = n.date; rerender(); }},
      h("span",{class:"n-dow"}, fmt(n.date,{weekday:"short"})),
      h("b",null, fmt(n.date,{month:"short", day:"numeric"})),
      h("span",{class:"n-stop"}, n.stop.emoji+" "+shortStop(n.stop)),
      h("span",{class:"n-state "+(chosen ? "ok" : opts.length ? "some" : "")}, chosen ? "✓ "+chosen.name : opts.length ? `${opts.length} option${opts.length>1?"s":""}` : "nothing yet")));
  });
  wrap.append(strip);

  // selected night
  const n = list.find(x=>x.date===sel), nd = nightDoc(sel), s = n.stop;
  const opts = all.filter(o=>o.night===sel);
  const chosen = opts.find(o=>o.id===nd.chosen);
  const idx = list.findIndex(x=>x.date===sel);
  const liveCount = opts.filter(o=>o.status!=="passed").length;
  const head = h("div",{class:"card nhead", style:`--c:${s.color}`},
    h("div",{class:"row"},
      h("div",{class:"grow"},
        h("div",{class:"nh-title"}, h("b",null, fmt(sel,{weekday:"long", month:"long", day:"numeric"})), h("span",{class:"pill nh-stop"}, `${s.emoji} ${s.name} · night ${idx+1} of ${list.length}`)),
        h("div",{class:"nh-sub"}, chosen
          ? h("span",null, "Dinner: ", h("b",null, chosen.name), nd.time ? ` at ${time12(nd.time)}` : "", nd.conf ? ` · reserved #${nd.conf}` : " · not reserved yet")
          : h("span",{class:"faint"}, liveCount ? "Nothing chosen yet. Vote, then tap Choose on the winner." : "No options yet."))),
      h("button",{class:"btn sm", onClick:()=>editNight(nd)}, "✎ Night"),
      h("button",{class:"btn sm rose", onClick:()=>editOption(null, {night:sel, stop:s.id})}, "+ Option")),
    nd.vibe ? h("div",{class:"nh-vibe"}, nd.vibe) : null,
    nd.notes ? h("div",{class:"nh-notes"}, nd.notes) : null,
  );
  wrap.append(head);

  const live = opts.filter(o=>o.status!=="passed").sort((a,b)=>(b.id===nd.chosen)-(a.id===nd.chosen) || (b.pick?1:0)-(a.pick?1:0) || score(b)-score(a) || (a.order??0)-(b.order??0));
  const passed = opts.filter(o=>o.status==="passed");
  if (!live.length && !passed.length){
    wrap.append(h("div",{class:"empty"}, `No dinner options for this night yet. Ask Claude to research it ("dinner options for ${fmt(sel,{month:"long", day:"numeric"})}") or add one with + Option.`));
  } else {
    wrap.append(h("div",{class:"dgrid"}, live.map(o=>card(o, nd, s))));
    if (passed.length) wrap.append(h("details",{class:"passed"}, h("summary",null, `${passed.length} passed on`), h("div",{class:"dgrid"}, passed.map(o=>card(o, nd, s)))));
  }
  return wrap;
}

function card(o, nd, s){
  const me = store.who, isChosen = o.id===nd.chosen;
  const links = [["maps","📍 Map"],["site","🌐 Website"],["menu","📖 Menu"],["reserve","📅 Reserve"]].filter(([k])=>o[k]);
  const tags = String(o.tags||"").split(",").map(t=>t.trim()).filter(Boolean);
  const meta = [o.cuisine, o.area, o.walk ? `${o.walk} from ${HOTEL[o.stop]||"the hotel"}` : "", o.hours].filter(Boolean).join(" · ");
  return h("div",{class:"dcard"+(isChosen?" chosen":"")+(o.status==="passed"?" passed":""), style:`--c:${s.color}`},
    h("div",{class:"dc-top"},
      h("div",{class:"dc-name"}, o.site ? h("a",{href:o.site, target:"_blank", rel:"noopener"}, o.name) : o.name),
      o.price ? h("span",{class:"pill"}, o.price) : null,
      o.pick ? h("span",{class:"pill gold"}, "Claude's pick") : null,
      isChosen ? h("span",{class:"pill sage"}, "✓ Chosen") : null,
      h("span",{class:"grow"}),
      h("button",{class:"icon-btn", title:"Edit", onClick:()=>editOption(o)}, "✎")),
    meta ? h("div",{class:"dc-meta"}, meta) : null,
    tags.length ? h("div",{class:"dc-tags"}, tags.map(t=>h("span",{class:"tag"+(/view/i.test(t)?" view":"")+(/walk|min|door/i.test(t)?" walk":"")+(/plaka/i.test(t)?" plaka":"")+(/ally/i.test(t)?" ally":"")}, t))) : null,
    o.tldr ? h("p",{class:"dc-tldr"}, o.tldr) : null,
    o.chicken ? h("div",{class:"dc-chicken"}, h("b",null,"🍗 For Ally: "), o.chicken) : null,
    o.notes ? h("div",{class:"dc-notes"}, o.notes) : null,
    links.length ? h("div",{class:"dc-links"}, links.map(([k,l])=>h("a",{class:"btn sm ghost", href:o[k], target:"_blank", rel:"noopener"}, l+" ↗"))) : null,
    h("div",{class:"dc-foot"},
      ["Ally","Alex"].map(p=>h("div",{class:"vote"+(p===me?" mine":"")},
        h("span",{class:"vwho"}, p),
        VOTES.map(([v,ic,t])=>h("button",{class:"vbtn"+(o["vote"+p]===v?" on "+v:""), title:t, disabled:p!==me, onClick:()=>vote(o, p, v)}, ic)))),
      h("span",{class:"grow"}),
      o.status==="passed" ? h("button",{class:"btn sm ghost", onClick:()=>store.update("dinners", o.id, {status:"option"}, `brought back ${o.name} for ${fmt(o.night)}`)}, "Bring back") :
      isChosen ? h("button",{class:"btn sm ghost", onClick:()=>choose(o, nd, false)}, "Unchoose") :
      [h("button",{class:"btn sm ghost", title:"Hide it", onClick:()=>store.update("dinners", o.id, {status:"passed"}, `passed on ${o.name} for ${fmt(o.night)}`)}, "Pass"),
       h("button",{class:"btn sm sage", onClick:()=>choose(o, nd, true)}, "Choose ✓")]),
  );
}

async function vote(o, who, v){
  const key = "vote"+who, next = o[key]===v ? "" : v;
  await store.update("dinners", o.id, {[key]: next}, next ? `${VOTES.find(x=>x[0]===next)[1]} ${o.name} for ${fmt(o.night)}` : null);
}
async function choose(o, nd, on){
  const date = o.night, tripId = "dinner-"+date;
  if (on){
    await store.set("nights", date, {...nd, date, stop:o.stop, chosen:o.id}, `chose ${o.name} for dinner on ${fmt(date)}`);
    await store.set("trip", tripId, {date, stop:o.stop, time: nd.time||"20:00", dur:120, type:"food", status: nd.conf ? "booked" : "planned", leg:"",
      title:`Dinner at ${o.name}`, details:[o.area, o.walk ? `${o.walk} from ${HOTEL[o.stop]||"the hotel"}` : "", o.tldr].filter(Boolean).join(" · "),
      conf: nd.conf||"", link: o.site||o.maps||"", order: 5000});
    toast(`${o.name} is on the itinerary`);
  } else {
    await store.set("nights", date, {...nd, date, chosen:""}, `unchose ${o.name} for ${fmt(date)}`);
    if (store.getOne("trip", tripId)) await store.remove("trip", tripId);
  }
}
async function editNight(nd){
  const r = await modal({ title:`${fmt(nd.date,{weekday:"long", month:"short", day:"numeric"})} · dinner`,
    fields:[
      {name:"vibe", label:"What matters tonight", type:"textarea", placeholder:"What is planned that day, what kind of night this should be, anything Ally or Alex wants…"},
      {name:"time", label:"Dinner time", type:"time"},
      {name:"conf", label:"Reservation # (once booked)"},
      {name:"notes", label:"Notes", type:"textarea"},
    ], values: nd, submit:"Save" });
  if (!r) return;
  await store.set("nights", nd.date, {...nd, ...r}, `updated the ${fmt(nd.date)} dinner plan`);
  const t = store.getOne("trip", "dinner-"+nd.date);
  if (t) await store.update("trip", t.id, {time: r.time||t.time, conf: r.conf||"", status: r.conf ? "booked" : "planned"});
}
async function editOption(o, preset={}){
  const nightOpts = nights().map(n=>({value:n.date, label:`${fmt(n.date,{weekday:"short", month:"short", day:"numeric"})} · ${n.stop.name}`}));
  const r = await modal({ title: o ? "Edit option" : "Add a dinner option",
    fields:[
      {name:"name", label:"Restaurant", placeholder:"e.g. Mani Mani"},
      {name:"night", label:"Night", type:"select", options:nightOpts, value: preset.night},
      {name:"cuisine", label:"Cuisine", placeholder:"Modern Greek · Taverna · Seafood"},
      {name:"area", label:"Area", placeholder:"Koukaki · Plaka · Oia"},
      {name:"walk", label:"Distance from the hotel", placeholder:"5 min walk · 15 min drive"},
      {name:"price", label:"Price", type:"select", options:["",...PRICES], value:"€€"},
      {name:"hours", label:"Hours that night", placeholder:"Mon 2–11 PM"},
      {name:"tags", label:"Tags (comma separated)", placeholder:"Acropolis view, Plaka, walkable"},
      {name:"tldr", label:"TL;DR", type:"textarea", placeholder:"Why it is on the list, in two or three lines"},
      {name:"chicken", label:"For Ally (chicken dish)", placeholder:"The dish and price"},
      {name:"maps", label:"Google Maps link", type:"url"},
      {name:"site", label:"Website", type:"url"},
      {name:"menu", label:"Menu link", type:"url"},
      {name:"reserve", label:"Reservation link", type:"url"},
      {name:"notes", label:"Notes", type:"textarea"},
    ], values: o, submit: o ? "Save" : "Add", danger: o ? "Delete" : null,
    onDanger: async ()=>{ if (await confirmBox(`Delete ${o.name}?`)) store.remove("dinners", o.id, `removed ${o.name} from ${fmt(o.night)} dinner options`); } });
  if (!r || !r.name.trim()) return;
  r.name = r.name.trim(); r.stop = stopOf(r.night)?.id || preset.stop || "";
  if (o) await store.update("dinners", o.id, r, `updated ${r.name}`);
  else { await store.add("dinners", {...r, status:"option", pick:false, voteAlly:"", voteAlex:"", order: Date.now()}, `added ${r.name} as a dinner option for ${fmt(r.night)}`); toast("Added"); }
}
