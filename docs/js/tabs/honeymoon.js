/* Honeymoon planner — Greece, Oct 11–23, 2026. Day-by-day itinerary with
   flights, stays, reservations, activities and per-stop idea buckets.
   Items live in trip/{id} = {date|null, stop, time, type, title, details, conf, link, status}. */
import { store } from "../store.js";
import { h, fmt, parse, ymd, addDays, daysUntil, time12, money, modal, confirmBox, toast } from "../util.js";
import { STOPS, TRIP_START, TRIP_END } from "../../data/seed.js";

const TYPES = {
  flight:   {icon:"✈️", label:"Flight"},
  stay:     {icon:"🏨", label:"Stay"},
  transport:{icon:"🚕", label:"Transfer / ferry / car"},
  food:     {icon:"🍽️", label:"Restaurant"},
  activity: {icon:"🌅", label:"Activity / tour"},
  note:     {icon:"📝", label:"Note"},
};
const STATUS = {booked:{label:"Booked", cls:"sage"}, planned:{label:"Planned", cls:"gold"}, idea:{label:"Idea", cls:""}};

let unsubs = [], root;
let view = localStorage.getItem("ally-alex-hm-view") || "days";
export function mount(v){ root = h("div",{class:"page hm"}); v.append(root); unsubs.push(store.subscribe("trip", render), store.subscribe("hmblocks", render)); }
export function unmount(){ unsubs.forEach(u=>u()); unsubs = []; }

/* ---------- board view: 3 blocks per day ---------- */
const PERIODS = [{id:"m", label:"Morning", from:5, to:12}, {id:"a", label:"Afternoon", from:12, to:17}, {id:"e", label:"Evening", from:17, to:29}];
const BLOCK = {
  travel:{label:"Travel", icon:"✈️"},
  fun:{label:"Plans", icon:"🥂"},
  relax:{label:"Relax", icon:"🌴"},
};
function periodOf(time){ if (!time) return null; const hr = Number(time.split(":")[0]); return PERIODS.find(p=>hr>=p.from && hr<p.to)?.id || "e"; }
function autoBlock(list){
  const travel = list.filter(i=>i.type==="flight" || i.type==="transport");
  const fun = list.filter(i=>i.type==="food" || i.type==="activity");
  if (travel.length) return {type:"travel", items:travel};
  if (fun.length) return {type:"fun", items:fun};
  return {type:"relax", items:list.filter(i=>i.type==="stay")};
}
function flightLine(i){
  const m = i.details.match(/(\d{1,2}:\d{2}(?:\s?[AP]M)?)\s*(?:→|->)\s*(\d{1,2}:\d{2}(?:\s?[AP]M)?)/i);
  const t = i.time ? time12(i.time) : "";
  return m ? `${t || m[1]} → ${m[2]}` : t;
}
function board(items){
  const dl = days();
  const overrides = Object.fromEntries(store.get("hmblocks").map(b=>[b.id, b]));
  const wrap = h("div",{class:"board"});
  const legend = h("div",{class:"board-legend"},
    h("span",{class:"bl travel"}, "✈️ Travel: flights and transfers with times"),
    h("span",{class:"bl fun"}, "🥂 Plans: a dinner, tour or place we've booked"),
    h("span",{class:"bl relax"}, "🌴 Relax: nothing set, pool and wandering"),
    h("span",{class:"faint"}, "· tap a block to change it"));
  const scroller = h("div",{class:"board-scroll"});
  const cols = h("div",{class:"board-cols"});
  for (const d of dl){
    const dayItems = items.filter(i=>i.date===d.date);
    const col = h("div",{class:"bcol", style:`--c:${d.stop.color}`},
      h("div",{class:"bhead", title:"Hour by hour", onClick:()=>dayDetail(d)}, h("b",null, fmt(d.date,{weekday:"short"})), h("span",null, fmt(d.date,{month:"short", day:"numeric"})), h("i",null, d.stop.emoji+" "+d.stop.name), h("span",{class:"bhead-more"},"⏱ hours")));
    for (const per of PERIODS){
      const inPeriod = dayItems.filter(i=>periodOf(i.time)===per.id).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
      const ov = overrides[`${d.date}_${per.id}`];
      const auto = autoBlock(inPeriod);
      const type = ov?.type || auto.type;
      const label = ov?.label || "";
      const shown = type===auto.type ? auto.items : inPeriod;
      const el = h("div",{class:"blk "+type, onClick:()=>editBlock(d, per, type, label, inPeriod)},
        h("div",{class:"blk-per"}, per.label),
        h("div",{class:"blk-body"},
          label ? h("div",{class:"blk-lbl"}, label) : null,
          shown.length ? shown.map(i=>h("div",{class:"blk-item"}, h("b",null, i.type==="flight" ? flightLine(i) : (i.time ? time12(i.time) : "")), h("span",null, shortTitle(i)))) :
            (!label ? h("div",{class:"blk-def"}, BLOCK[type].icon+" "+BLOCK[type].label) : null)));
      col.append(el);
    }
    cols.append(col);
  }
  scroller.append(cols); wrap.append(legend, scroller);
  return wrap;
}
/* ---------- hour-by-hour day popup ---------- */
const DAY_START = 6, DAY_END = 25;   // 6 AM → 1 AM next day
const PX_PER_HOUR = 46;
function minutesOf(time){ if (!time) return null; const [hh,mm] = time.split(":").map(Number); return hh*60 + (mm||0); }
function parseDur(i){
  if (Number(i.dur) > 0) return Number(i.dur);
  const txt = (i.title+" "+i.details);
  const m = txt.match(/\((\d+)h(?:\s?(\d+)m)?\)|\((\d+)\s?min\)|(\d+)h\s?(\d+)m\b/);
  if (m){ if (m[1]) return Number(m[1])*60 + Number(m[2]||0); if (m[3]) return Number(m[3]); if (m[4]) return Number(m[4])*60 + Number(m[5]||0); }
  return {flight:60, transport:45, stay:30, food:90, activity:150, note:30}[i.type] || 60;
}
function endTimeText(i, startMin, dur){
  const end = startMin + dur; const nextDay = end >= 24*60;
  const hh = Math.floor((end % (24*60))/60), mm = end % 60;
  return time12(`${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`) + (nextDay ? " next day" : "");
}
function dayDetail(d){
  const items = store.get("trip").filter(i=>i.date===d.date);
  const overrides = Object.fromEntries(store.get("hmblocks").map(b=>[b.id, b]));
  const hours = DAY_END - DAY_START;
  const grid = h("div",{class:"hd-grid", style:`height:${hours*PX_PER_HOUR}px`});
  // period bands (block color, lighter) + labels
  for (const per of PERIODS){
    const inPeriod = items.filter(i=>periodOf(i.time)===per.id);
    const ov = overrides[`${d.date}_${per.id}`];
    const type = ov?.type || autoBlock(inPeriod).type;
    const from = Math.max(per.from, DAY_START), to = Math.min(per.to, DAY_END);
    if (to <= from) continue;
    grid.append(h("div",{class:"hd-band "+type, style:`top:${(from-DAY_START)*PX_PER_HOUR}px; height:${(to-from)*PX_PER_HOUR}px`},
      h("span",{class:"hd-band-lbl"}, per.label + (ov?.label ? " · "+ov.label : (type!=="relax" ? " · "+BLOCK[type].label : "")))));
  }
  // hour lines + labels
  for (let hr = DAY_START; hr <= DAY_END; hr++){
    const y = (hr-DAY_START)*PX_PER_HOUR;
    const lbl = hr===24 ? "12 AM" : hr > 24 ? `${hr-24} AM` : time12(`${String(hr).padStart(2,"0")}:00`).replace(":00","");
    grid.append(h("div",{class:"hd-line", style:`top:${y}px`}, h("span",null, lbl)));
  }
  // timed items, with simple lane packing for overlaps
  const timed = items.filter(i=>i.time).map(i=>{ const st = minutesOf(i.time); const dur = parseDur(i); return {i, st, en: st+dur, dur}; }).sort((a,b)=>a.st-b.st);
  const lanes = [];
  for (const t of timed){ let l = lanes.findIndex(end=>end <= t.st); if (l<0){ l = lanes.length; lanes.push(0); } lanes[l] = t.en; t.lane = l; }
  const nl = Math.max(1, lanes.length);
  for (const t of timed){
    const top = Math.max(0, (t.st/60 - DAY_START)*PX_PER_HOUR);
    const bottom = Math.min(hours*PX_PER_HOUR, (t.en/60 - DAY_START)*PX_PER_HOUR);
    const cls = t.i.type==="flight"||t.i.type==="transport" ? "travel" : (t.i.type==="food"||t.i.type==="activity") ? "fun" : "stay";
    const tt = TYPES[t.i.type] || TYPES.note;
    grid.append(h("div",{class:"hd-item "+cls, style:`top:${top}px; height:${Math.max(26, bottom-top)}px; left:calc(58px + ${t.lane}*(100% - 66px)/${nl}); width:calc((100% - 66px)/${nl} - 4px)`, onClick:()=>edit(t.i)},
      h("b",null, tt.icon+" ", shortTitle(t.i)),
      h("span",null, `${time12(t.i.time)} → ${endTimeText(t.i, t.st, t.dur)}`, t.i.type==="flight" ? ` · ${Math.floor(t.dur/60)}h${t.dur%60 ? " "+t.dur%60+"m" : ""}` : "")));
  }
  const untimed = items.filter(i=>!i.time);
  const box = h("div",{class:"box hd-box"},
    h("div",{class:"row"}, h("h3",null, `${fmt(d.date,{weekday:"long", month:"long", day:"numeric"})}`), h("span",{class:"faint"}, `Day ${d.n} · ${d.stop.emoji} ${d.stop.name}`), h("span",{class:"grow"}),
      h("button",{class:"btn sm rose", onClick:()=>{ close(); edit(null, {date:d.date, stop:d.stop.id}); }}, "+ Add"), h("button",{class:"icon-btn", onClick:()=>close()}, "✕")),
    h("div",{class:"hd-scroll"}, grid),
    untimed.length ? h("div",{class:"hd-untimed"}, h("span",{class:"cat"},"No time set: "), untimed.map(i=>h("button",{class:"btn sm ghost", onClick:()=>{ close(); edit(i); }}, (TYPES[i.type]||TYPES.note).icon+" "+shortTitle(i)))) : null,
    h("div",{class:"faint", style:"font-size:11px; margin-top:8px"}, "Flights use their real duration. Other items use the Duration field, or a default by type. Tinted bands are the Board's blocks."),
  );
  const wrap = h("div",{id:"modal", onClick:e=>{ if (e.target===wrap) close(); }}, box);
  function close(){ wrap.remove(); document.removeEventListener("keydown", esc); }
  function esc(e){ if (e.key==="Escape") close(); }
  document.addEventListener("keydown", esc);
  document.body.append(wrap);
  const sc = box.querySelector(".hd-scroll"); const first = timed[0]; if (first) sc.scrollTop = Math.max(0, (first.st/60 - DAY_START - 1)*PX_PER_HOUR);
}
function shortTitle(i){
  let t = i.title.replace(/·.*$/,"").trim();
  const m = i.title.match(/\b([A-Z]{1,2}\d{2,4})\b/);
  if (i.type==="flight"){ const parts = i.title.split("·").map(x=>x.trim()); const route = parts.find(x=>/→/.test(x)) || parts[0]; return (m && !route.includes(m[1]) ? m[1]+" " : "") + route; }
  return t.length > 34 ? t.slice(0,32)+"…" : t;
}
async function editBlock(d, per, type, label, inPeriod){
  const id = `${d.date}_${per.id}`;
  const r = await modal({ title: `${fmt(d.date,{weekday:"long", month:"short", day:"numeric"})} · ${per.label}`,
    fields:[
      {name:"type", label:"Block type", type:"select", options:Object.entries(BLOCK).map(([v,b])=>({value:v, label:b.icon+" "+b.label})), value:type},
      {name:"label", label:"Label (optional)", placeholder:"e.g. Drive to Charlotte · Pool day · Dinner in Oia", value:label},
    ],
    submit:"Save", danger: store.getOne("hmblocks", id) ? "Back to automatic" : null,
    onDanger: ()=>store.remove("hmblocks", id, `reset ${per.label.toLowerCase()} on ${fmt(d.date)} to automatic`) });
  if (!r) return;
  await store.set("hmblocks", id, {date:d.date, period:per.id, type:r.type, label:(r.label||"").trim()}, `set ${fmt(d.date)} ${per.label.toLowerCase()} to ${BLOCK[r.type].label}${r.label ? ": "+r.label.trim() : ""}`);
  if (inPeriod.length===0 && r.type==="fun" && r.label) toast("Tip: add the plan as an item in Days view too");
}

function days(){
  const out = []; let n = 1;
  for (let d = TRIP_START; d <= TRIP_END; d = addDays(d,1)) out.push({date:d, n:n++, stop: stopFor(d)});
  return out;
}
function stopFor(date){ return STOPS.find(s=>date>=s.from && date<=s.to) || STOPS[STOPS.length-1]; }
function stopById(id){ return STOPS.find(s=>s.id===id); }

function render(){
  const items = store.get("trip");
  const y = window.scrollY;
  const dl = days();
  const booked = items.filter(i=>i.status==="booked").length;
  const until = daysUntil(TRIP_START);
  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Honeymoon"), h("span",{class:"sub"}, `Greece · Oct 11 – 23 · ${until} days away`), h("span",{class:"grow"}),
      h("div",{class:"seg"}, [["days","☰ Days"],["board","▦ Board"]].map(([v,l])=>h("button",{class:v===view?"on":"", onClick:()=>{ view=v; localStorage.setItem("ally-alex-hm-view", v); render(); }}, l))),
      h("button",{class:"btn sm rose", onClick:()=>edit()}, "+ Add")),
    routeBar(),
  );
  if (view==="board"){ root.append(board(items)); window.scrollTo(0, y); return; }
  root.append(
    h("div",{class:"kpis mt"},
      kpi(`${dl.length}`, "days", `${STOPS.reduce((a,s)=>a+(s.nights||0),0)} nights`),
      kpi(`${booked}`, "booked", `${items.filter(i=>i.status==="planned").length} planned · ${items.filter(i=>i.status==="idea").length} ideas`),
    ),
  );
  for (const d of dl){
    const list = items.filter(i=>i.date===d.date).sort(byTime);
    const s = d.stop;
    const first = s.from===d.date;
    root.append(h("section",{class:"day", id:"day-"+d.date, style:`--c:${s.color}`},
      h("div",{class:"day-head"},
        h("div",{class:"day-date"}, h("b",null, fmt(d.date,{weekday:"long"})), h("span",null, fmt(d.date,{month:"long", day:"numeric"}))),
        h("span",{class:"day-n"}, `Day ${d.n}`),
        h("span",{class:"day-stop"}, s.emoji, " ", first && s.arrive ? s.arrive : s.name),
        h("span",{class:"grow"}),
        h("button",{class:"btn sm", onClick:()=>edit(null, {date:d.date, stop:s.id})}, "+ Add")),
      list.length ? h("div",{class:"items"}, list.map(itemRow)) : h("div",{class:"empty", style:"padding:8px; text-align:left"}, "Nothing planned yet."),
    ));
  }
  const ideas = items.filter(i=>!i.date);
  if (ideas.length || true){
    root.append(h("h2",{class:"hm-h2 mt"},"Ideas by stop"));
    for (const s of STOPS.filter(s=>s.nights)){
      const list = ideas.filter(i=>i.stop===s.id).sort((a,b)=>(a.order??0)-(b.order??0));
      root.append(h("div",{class:"card ideas", style:`--c:${s.color}`},
        h("h2",null, s.emoji+" "+s.name, h("button",{class:"btn sm", onClick:()=>edit(null, {stop:s.id, status:"idea"})}, "+ Idea")),
        list.length ? h("div",{class:"items"}, list.map(itemRow)) : h("div",{class:"empty", style:"padding:6px; text-align:left"}, "No ideas yet. Restaurants, beaches, boat days, wineries…")));
    }
  }
  window.scrollTo(0, y);
}
/* Proportional timeline: each stop's width = its share of the trip's days. */
function routeBar(){
  const total = dl_len();
  const bar = h("div",{class:"route"});
  for (const s of STOPS){
    const n = Math.round((parse(s.to) - parse(s.from))/864e5) + 1;
    const short = s.id.startsWith("ath") ? "Athens" : s.id==="jtr" ? "Santorini" : s.id==="chq" ? "Chania" : s.id==="fly-out" ? "Fly" : "Home";
    bar.append(h("a",{class:"route-stop", href:"#honeymoon", style:`--c:${s.color}; flex:${n} ${n} 0`, title:`${s.name} · ${n} day${n>1?"s":""}`,
      onClick:e=>{ e.preventDefault(); document.getElementById("day-"+s.from)?.scrollIntoView({behavior:"smooth", block:"start"}); }},
      h("span",{class:"route-ic"}, s.emoji),
      h("b",{class:"route-name"}, h("span",{class:"full"}, s.name), h("span",{class:"short"}, short)),
      h("span",{class:"route-when"}, n === 1 ? fmt(s.from) : `${fmt(s.from)} – ${fmt(s.to)}`),
      h("span",{class:"route-days"}, `${n}d`)));
  }
  const ticks = h("div",{class:"route-ticks"});
  for (const d of days()) ticks.append(h("span",{class:"tick", style:`--c:${d.stop.color}`, title:fmt(d.date)}, String(parse(d.date).getDate())));
  return h("div",{class:"route-wrap"}, bar, ticks);
}
function dl_len(){ return days().length; }
function byTime(a,b){ return (a.time||"99").localeCompare(b.time||"99") || (a.order??0)-(b.order??0); }
function kpi(n,l,s){ return h("div",{class:"kpi"}, h("div",{class:"l"},l), h("div",{class:"n"},n), h("div",{class:"s"},s)); }

function itemRow(i){
  const t = TYPES[i.type] || TYPES.note, st = STATUS[i.status] || STATUS.planned;
  return h("div",{class:"hm-item "+(i.status||""), onClick:()=>edit(i)},
    h("div",{class:"hm-ic"}, t.icon),
    h("div",{class:"hm-body"},
      h("div",{class:"hm-title"}, i.time ? h("span",{class:"hm-time"}, time12(i.time)) : null, i.title),
      i.details ? h("div",{class:"hm-details"}, i.details) : null,
      h("div",{class:"hm-meta"},
        h("span",{class:"pill "+st.cls}, st.label),
        i.conf ? h("span",{class:"pill"}, "# "+i.conf) : null,
        i.link ? h("a",{href:i.link, target:"_blank", rel:"noopener", onClick:e=>e.stopPropagation()}, "link ↗") : null,
        !i.date && i.stop ? h("button",{class:"btn sm ghost", onClick:e=>{ e.stopPropagation(); schedule(i); }}, "Schedule") : null,
      )),
  );
}

async function schedule(i){
  const s = stopById(i.stop);
  const opts = days().filter(d=>!s || d.stop.id===s.id).map(d=>({value:d.date, label:`${fmt(d.date,{weekday:"short", month:"short", day:"numeric"})} · ${d.stop.name}`}));
  const r = await modal({ title:"Put it on a day", fields:[{name:"date", label:"Day", type:"select", options:opts}, {name:"time", label:"Time (optional)", type:"time"}], submit:"Schedule" });
  if (!r) return;
  await store.update("trip", i.id, {date:r.date, time:r.time||"", status: i.status==="idea" ? "planned" : i.status}, `scheduled “${i.title}” for ${fmt(r.date)}`);
}

async function edit(i, preset={}){
  const dayOpts = [{value:"", label:"Idea (no day yet)"}, ...days().map(d=>({value:d.date, label:`${fmt(d.date,{weekday:"short", month:"short", day:"numeric"})} · ${d.stop.name}`}))];
  const r = await modal({
    title: i ? "Edit" : "Add to the trip",
    fields:[
      {name:"title", label:"What", placeholder:"e.g. Dinner at Metaxy Mas"},
      {name:"type", label:"Type", type:"select", options:Object.entries(TYPES).map(([v,t])=>({value:v, label:t.icon+" "+t.label})), value: preset.type || "activity"},
      {name:"date", label:"Day", type:"select", options:dayOpts, value: preset.date || ""},
      {name:"time", label:"Time", type:"time"},
      {name:"dur", label:"Duration (minutes, optional)", type:"number", inputmode:"numeric", placeholder:"e.g. 90"},
      {name:"stop", label:"Stop", type:"select", options:STOPS.map(s=>({value:s.id, label:s.emoji+" "+s.name})), value: preset.stop || (preset.date ? stopFor(preset.date).id : "jtr")},
      {name:"status", label:"Status", type:"select", options:Object.entries(STATUS).map(([v,s])=>({value:v, label:s.label})), value: preset.status || "planned"},
      {name:"details", label:"Details", type:"textarea", placeholder:"Address, what's included, who to ask for…"},
      {name:"conf", label:"Confirmation #"},
      {name:"link", label:"Link", type:"url", placeholder:"https://"},
    ],
    values: i, submit: i ? "Save" : "Add", danger: i ? "Delete" : null,
    onDanger: async ()=>{ if (await confirmBox(`Delete “${i.title}”?`)) store.remove("trip", i.id, `removed “${i.title}” from the honeymoon`); },
  });
  if (!r || !r.title.trim()) return;
  r.title = r.title.trim(); r.date = r.date || null; r.dur = Number(r.dur)||0;
  if (r.date) r.stop = stopFor(r.date).id;
  if (i) await store.update("trip", i.id, r, `updated “${r.title}” on the honeymoon`);
  else { await store.add("trip", {...r, order: Date.now()}, `added “${r.title}” to the honeymoon${r.date ? " on "+fmt(r.date) : " ideas"}`); toast("Added"); }
}
