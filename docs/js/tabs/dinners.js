/* Honeymoon → Dinners: pick where to eat each night of the trip, in three steps.
   nights/{date}  = {date, stop, vibe, time, conf, notes, chosen}
   dinners/{id}   = {night, stop, name, area, cuisine, walk, price, hours, tldr, chicken, tags, maps, site, menu, reserve, notes,
                     tier: "ally" (up to 4 from Ally's list) | "claude" (Claude's four) | "more" (bench), rank, shortlisted}
   Step 1: Alex shortlists 2 of Ally's and 2 of Claude's.  Step 2: Ally chooses from that final four.  Step 3: reserve.
   Choosing writes trip/dinner-{date} so it shows up in Days, Board and the hour view. */
import { store } from "../store.js";
import { h, fmt, addDays, time12, modal, confirmBox, toast } from "../util.js";
import { STOPS, TRIP_START, TRIP_END } from "../../data/seed.js";

const HOTEL = {ath1:"COCO-MAT", jtr:"Cavo Tagoo", chq:"Residenza Vranas", ath2:"Zeus Dolce"};
const PRICES = ["€","€€","€€€","€€€€"];
const TIERS = {ally:"Ally's list (up to 4)", claude:"Claude's four", more:"Bench (more options)"};
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
function stopOf(date){ return STOPS.find(x=>date>=x.from && date<=x.to); }
function shortStop(s){ return s.id.startsWith("ath") ? "Athens" : s.id==="jtr" ? "Santorini" : "Chania"; }
const byRank = (a,b)=>(a.rank??99)-(b.rank??99) || (a.order??0)-(b.order??0);

/* Split a night's options into the funnel. */
function funnel(date){
  const nd = nightDoc(date);
  const opts = store.get("dinners").filter(o=>o.night===date);
  const ally = opts.filter(o=>o.tier==="ally").sort(byRank);
  const claude = opts.filter(o=>o.tier==="claude").sort(byRank);
  const bench = opts.filter(o=>!o.tier || o.tier==="more").sort(byRank);
  const pickedAlly = ally.filter(o=>o.shortlisted), pickedClaude = claude.filter(o=>o.shortlisted);
  const needAlly = Math.min(2, ally.length), needClaude = Math.min(2, claude.length);
  const chosen = opts.find(o=>o.id===nd.chosen);
  const stage = chosen ? 3 : (pickedAlly.length >= needAlly && pickedClaude.length >= needClaude && (needAlly+needClaude) > 0 ? 2 : 1);
  const finalFour = [...pickedAlly, ...pickedClaude];
  return {nd, opts, ally, claude, bench, pickedAlly, pickedClaude, needAlly, needClaude, chosen, stage, finalFour};
}

export function view(){
  const list = nights();
  if (!sel || !list.some(n=>n.date===sel)) sel = (list.find(n=>funnel(n.date).stage < 3) || list[0]).date;
  const wrap = h("div",{class:"dinners"});

  // night strip
  const strip = h("div",{class:"nstrip"});
  for (const n of list){
    const f = funnel(n.date);
    const state = f.chosen ? "✓ "+f.chosen.name : !f.opts.length ? "nothing yet" : f.stage===1 ? "Alex to pick" : "Ally to pick";
    strip.append(h("button",{class:"ncard"+(n.date===sel?" on":"")+(f.chosen?" done":""), style:`--c:${n.stop.color}`, onClick:()=>{ sel = n.date; rerender(); }},
      h("span",{class:"n-dow"}, fmt(n.date,{weekday:"short"})),
      h("b",null, fmt(n.date,{month:"short", day:"numeric"})),
      h("span",{class:"n-stop"}, n.stop.emoji+" "+shortStop(n.stop)),
      h("span",{class:"n-state "+(f.chosen ? "ok" : f.opts.length ? (f.stage===1 ? "alex" : "ally") : "")}, state)));
  }
  wrap.append(strip);

  // selected night
  const n = list.find(x=>x.date===sel), s = n.stop, idx = list.findIndex(x=>x.date===sel);
  const f = funnel(sel), nd = f.nd;
  const head = h("div",{class:"card nhead", style:`--c:${s.color}`},
    h("div",{class:"row"},
      h("div",{class:"grow"},
        h("div",{class:"nh-title"}, h("b",null, fmt(sel,{weekday:"long", month:"long", day:"numeric"})), h("span",{class:"pill nh-stop"}, `${s.emoji} ${s.name} · night ${idx+1} of ${list.length}`)),
        h("div",{class:"nh-sub"}, f.chosen
          ? h("span",null, "Dinner: ", h("b",null, f.chosen.name), nd.time ? ` at ${time12(nd.time)}` : "", nd.conf ? ` · reserved #${nd.conf}` : " · not reserved yet")
          : null)),
      h("button",{class:"btn sm", onClick:()=>editNight(nd)}, "✎ Night"),
      h("button",{class:"btn sm rose", onClick:()=>editOption(null, {night:sel, stop:s.id})}, "+ Option")),
    f.opts.length ? steps(f) : null,
    nd.vibe ? h("div",{class:"nh-vibe"}, nd.vibe) : null,
    nd.notes ? h("div",{class:"nh-notes"}, nd.notes) : null,
  );
  wrap.append(head);

  if (!f.opts.length){
    wrap.append(h("div",{class:"empty"}, `No dinner options for this night yet. Ask Claude to research it ("dinner options for ${fmt(sel,{month:"long", day:"numeric"})}") or add one with + Option.`));
    return wrap;
  }

  if (f.stage === 3){
    wrap.append(section("Tonight", "Chosen. Reserve it, then add the confirmation with ✎ Night.", [card(f.chosen, f, s)]));
    const rest = f.finalFour.filter(o=>o.id!==f.chosen.id);
    if (rest.length) wrap.append(h("details",{class:"passed"}, h("summary",null, `The other ${rest.length} from the final four`), h("div",{class:"dgrid"}, rest.map(o=>card(o, f, s)))));
  } else if (f.stage === 2){
    wrap.append(section("Final four", "Two from Ally's list and two of Claude's, shortlisted by Alex. Ally taps Choose on the winner.", f.finalFour.map(o=>card(o, f, s))));
    const rest = [...f.ally, ...f.claude].filter(o=>!o.shortlisted);
    if (rest.length) wrap.append(h("details",{class:"passed"}, h("summary",null, `${rest.length} not shortlisted`), h("div",{class:"dgrid"}, rest.map(o=>card(o, f, s)))));
  } else {
    wrap.append(section("Ally's list", f.ally.length ? `Alex shortlists ${f.needAlly} · ${f.pickedAlly.length} of ${f.needAlly} picked` : "Nothing from Ally's Google Maps list fits this night.", f.ally.map(o=>card(o, f, s))));
    wrap.append(section("Claude's four", `Alex shortlists ${f.needClaude} · ${f.pickedClaude.length} of ${f.needClaude} picked`, f.claude.map(o=>card(o, f, s))));
  }
  if (f.bench.length) wrap.append(h("details",{class:"passed"}, h("summary",null, `Bench · ${f.bench.length} more option${f.bench.length>1?"s":""} (edit one to move it up)`), h("div",{class:"dgrid"}, f.bench.map(o=>card(o, f, s)))));
  return wrap;
}

function steps(f){
  const st = [["1","Alex shortlists 2 of Ally's + 2 of Claude's"],["2","Ally picks from the final four"],["3","Reserve it"]];
  return h("div",{class:"steps"}, st.map(([n,l],i)=>h("span",{class:"step"+(f.stage===i+1?" on":"")+(f.stage>i+1?" done":"")}, h("b",null, f.stage>i+1 ? "✓" : n), l)));
}
function section(title, sub, cards){
  return h("div",{class:"dsec"}, h("div",{class:"dsec-h"}, h("h3",null, title), sub ? h("span",{class:"faint"}, sub) : null),
    cards.length ? h("div",{class:"dgrid"}, cards) : h("div",{class:"empty", style:"padding:10px"}, "Nothing here yet."));
}

function card(o, f, s){
  const me = store.who, isChosen = o.id===f.nd.chosen;
  const links = [["maps","📍 Map"],["site","🌐 Website"],["menu","📖 Menu"],["reserve","📅 Reserve"]].filter(([k])=>o[k]);
  const tags = String(o.tags||"").split(",").map(t=>t.trim()).filter(Boolean).filter(t=>!/ally's list|claude's pick/i.test(t));
  const meta = [o.cuisine, o.area, o.walk ? `${o.walk} from ${HOTEL[o.stop]||"the hotel"}` : "", o.hours].filter(Boolean).join(" · ");
  const inFinal = f.finalFour.some(x=>x.id===o.id);
  let action = null;
  if (isChosen) action = h("button",{class:"btn sm ghost", onClick:()=>choose(o, f.nd, false)}, "Change");
  else if (f.stage===2 && inFinal) action = h("button",{class:"btn sm sage", disabled: me!=="Ally", title: me!=="Ally" ? "Ally's call" : "", onClick:()=>choose(o, f.nd, true)}, me==="Ally" ? "Choose ✓" : "Ally chooses");
  else if ((o.tier==="claude" || o.tier==="ally") && f.stage<3){
    const picked = o.tier==="ally" ? f.pickedAlly : f.pickedClaude;
    const full = picked.length>=2 && !o.shortlisted;
    action = h("button",{class:"btn sm "+(o.shortlisted ? "primary" : "ghost"), disabled: me!=="Alex" || full, title: me!=="Alex" ? "Alex's call" : full ? "Two already shortlisted" : "",
      onClick:()=>store.update("dinners", o.id, {shortlisted: !o.shortlisted}, `${o.shortlisted ? "dropped" : "shortlisted"} ${o.name} for ${fmt(o.night)}`)}, o.shortlisted ? "★ Shortlisted" : "☆ Shortlist");
  }
  return h("div",{class:"dcard tier-"+(o.tier||"more")+(isChosen?" chosen":"")+(o.shortlisted&&!isChosen?" short":""), style:`--c:${s.color}`},
    h("div",{class:"dc-top"},
      h("div",{class:"dc-name"}, o.site ? h("a",{href:o.site, target:"_blank", rel:"noopener"}, o.name) : o.name),
      o.price ? h("span",{class:"pill"}, o.price) : null,
      o.tier==="ally" ? h("span",{class:"pill ink"}, "Ally's list") : o.tier==="claude" ? h("span",{class:"pill gold"}, `Claude #${o.rank ?? "?"}`) : null,
      isChosen ? h("span",{class:"pill sage"}, "✓ Chosen") : null,
      h("span",{class:"grow"}),
      h("button",{class:"icon-btn", title:"Edit", onClick:()=>editOption(o)}, "✎")),
    meta ? h("div",{class:"dc-meta"}, meta) : null,
    tags.length ? h("div",{class:"dc-tags"}, tags.map(t=>h("span",{class:"tag"+(/view/i.test(t)?" view":"")+(/walk|min|door/i.test(t)?" walk":"")+(/plaka/i.test(t)?" plaka":"")}, t))) : null,
    o.tldr ? h("p",{class:"dc-tldr"}, o.tldr) : null,
    o.chicken ? h("div",{class:"dc-chicken"}, h("b",null,"🍗 For Ally: "), o.chicken) : null,
    o.notes ? h("div",{class:"dc-notes"}, o.notes) : null,
    links.length ? h("div",{class:"dc-links"}, links.map(([k,l])=>h("a",{class:"btn sm ghost", href:o[k], target:"_blank", rel:"noopener"}, l+" ↗"))) : null,
    action ? h("div",{class:"dc-foot"}, h("span",{class:"grow"}), action) : null,
  );
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
    await store.set("nights", date, {...nd, date, chosen:""}, `reopened the ${fmt(date)} dinner choice`);
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
      {name:"tier", label:"Where it sits", type:"select", options:Object.entries(TIERS).map(([v,l])=>({value:v, label:l})), value: preset.tier || "more"},
      {name:"rank", label:"Order within that group (1 = first)", type:"number", inputmode:"numeric", placeholder:"1"},
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
  r.name = r.name.trim(); r.stop = stopOf(r.night)?.id || preset.stop || ""; r.rank = Number(r.rank) || 99;
  if (o) await store.update("dinners", o.id, r, `updated ${r.name}`);
  else { await store.add("dinners", {...r, shortlisted:false, order: Date.now()}, `added ${r.name} as a dinner option for ${fmt(r.night)}`); toast("Added"); }
}
