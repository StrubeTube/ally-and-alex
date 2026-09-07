/* Seating charts — several versions side by side. Guests come from the guests
   collection; charts/{id} holds a chart's name + table names; placements live in
   seats/{chartId}__{guestId} = {chart, guest, seat}. */
import { store, normSeat, chartsSorted } from "../store.js";
import { h, toast, modal, confirmBox } from "../util.js";
import { COLORS, GROUPS, TABLES, FLOOR } from "../../data/seed.js";

const W = FLOOR.w, H = FLOOR.h;
const SEATS = [];
for (const t of TABLES){
  const rad = t.angle*Math.PI/180, cos = Math.cos(rad), sin = Math.sin(rad);
  const off = t.h/2 + 30; let n = 0;
  for (const side of [-1,1]) for (let i=0;i<t.perSide;i++){
    const lx = -t.w/2 + t.w*(i+0.5)/t.perSide, ly = side*off;
    SEATS.push({key:`${t.id}-${n++}`, table:t.id, x:t.cx + lx*cos - ly*sin, y:t.cy + lx*sin + ly*cos});
  }
  if (t.ends) for (const ex of [-1,1]){ const lx = ex*(t.w/2+30); SEATS.push({key:`${t.id}-${n++}`, table:t.id, x:t.cx+lx*cos, y:t.cy+lx*sin}); }
  t.cap = n;
}
const SEAT_BY_KEY = Object.fromEntries(SEATS.map(s=>[s.key,s]));
const LS_CHART = "ally-alex-chart";

let unsubs = [], root, guests = [], byId = {}, seats = new Map(), charts = [], chartId = null;
let draggingId = null, selectedId = null, suppressClick = false, scale = 1;
let canvas, wrap, floor, groupsEl, tabsEl, bankChips = {}, floorChips = {}, tableEls = {};

const chart = ()=>charts.find(c=>c.id===chartId) || charts[0];
const tableNames = ()=>chart()?.names || {};
const seatId = (gid)=>`${chartId}__${gid}`;

export function mount(view){
  root = h("div",{id:"seatingPage"},
    h("div",{id:"chartTabs"}),
    h("div",{id:"seatingWrap"},
      h("div",{id:"floorWrap"},
        h("div",{id:"floor"}, h("div",{id:"canvasWrap"}, h("div",{id:"canvas"}))),
        h("div",{class:"seat-stats", id:"seatStats"}),
        h("div",{id:"zoomCtrls"}, h("button",{id:"zoomIn","aria-label":"Zoom in"},"＋"), h("button",{id:"zoomOut","aria-label":"Zoom out"},"−"), h("button",{id:"zoomFit","aria-label":"Fit", style:"font-size:15px"},"⤢")),
        h("div",{id:"placeBar"}, h("span",{class:"who", id:"placeWho"}), h("span",{class:"what"},"tap a seat · tap a person to swap"), h("button",{id:"unseatBtn"},"Back to list"), h("button",{id:"cancelBtn"},"✕")),
      ),
      h("aside",null,
        h("div",{class:"tools"}, h("input",{id:"seatSearch", type:"search", placeholder:"Find a guest…"})),
        h("div",{id:"seatGroups"}),
        h("div",{class:"hint"},"Tap a name, then tap a seat — or tap another person to swap. Drag works too. Double-click a table to rename it. Double-click a seated person to unseat them."),
      ),
    ),
  );
  view.append(root);
  tabsEl = root.querySelector("#chartTabs");
  canvas = root.querySelector("#canvas"); wrap = root.querySelector("#canvasWrap"); floor = root.querySelector("#floor"); groupsEl = root.querySelector("#seatGroups");
  const fromHash = location.hash.split("/")[1];
  chartId = fromHash || localStorage.getItem(LS_CHART) || "c1";
  buildFloor();
  wireControls();
  unsubs.push(
    store.subscribe("charts", ()=>{ charts = chartsSorted(); if (!charts.find(c=>c.id===chartId)) chartId = charts[0].id; renderTabs(); loadSeats(); render(); }),
    store.subscribe("guests", g=>{ guests = g; byId = Object.fromEntries(g.map(x=>[x.id,x])); buildBank(); render(); }),
    store.subscribe("seats", ()=>{ loadSeats(); render(); }),
  );
  sizeWrap(); window.addEventListener("resize", sizeWrap);
  const narrow = matchMedia("(max-width:760px)").matches;
  requestAnimationFrame(()=>{ sizeWrap(); applyScale(narrow ? Math.max(0.55, fitScale()) : Math.min(1, (floor.clientWidth-24)/W)); floor.scrollLeft = (W*scale - floor.clientWidth)/2; });
}
function sizeWrap(){ const w = root?.querySelector("#seatingWrap"); if (!w) return; w.style.height = Math.max(420, window.innerHeight - w.getBoundingClientRect().top) + "px"; }
export function unmount(){ unsubs.forEach(u=>u()); unsubs = []; window.removeEventListener("resize", sizeWrap); document.body.classList.remove("placing","placing-seated"); bankChips = {}; floorChips = {}; tableEls = {}; }

function loadSeats(){
  seats = new Map();
  for (const d of store.get("seats")){ const n = normSeat(d); if (n.chart===chartId && n.seat && SEAT_BY_KEY[n.seat]) seats.set(n.guest, n.seat); }
}
function switchChart(id){
  select(null); chartId = id; try{ localStorage.setItem(LS_CHART, id); }catch(e){}
  history.replaceState(null, "", "#seating/"+id);
  renderTabs(); loadSeats(); render();
}

/* ---------- chart tabs ---------- */
function renderTabs(){
  tabsEl.innerHTML = "";
  for (const c of charts){
    const n = store.get("seats").filter(d=>normSeat(d).chart===c.id && d.seat).length;
    tabsEl.append(h("button",{class:"ctab"+(c.id===chartId?" on":""), onClick:()=>switchChart(c.id)}, c.name, h("span",{class:"cnt"}, n)));
  }
  tabsEl.append(
    h("button",{class:"ctab add", onClick:newChart}, "+ New chart"),
    h("span",{class:"grow"}),
    h("button",{class:"btn sm ghost", onClick:chartMenu}, "⋯"),
  );
}
async function newChart(){
  const n = charts.length + 1;
  const r = await modal({ title:"New seating chart",
    fields:[
      {name:"name", label:"Name", value:`Seating Chart ${n}`},
      {name:"from", label:"Start from", type:"select", options:[{value:"", label:"Empty floor"}, ...charts.map(c=>({value:c.id, label:`Copy of ${c.name}`}))], value: chartId},
    ], submit:"Create" });
  if (!r || !r.name.trim()) return;
  const id = "c" + Date.now().toString(36);
  const src = charts.find(c=>c.id===r.from);
  await store.set("charts", id, {name:r.name.trim(), names: src ? {...(src.names||{})} : {}, order: Date.now()}, `created “${r.name.trim()}”` + (src ? ` from ${src.name}` : ""));
  charts = chartsSorted(); switchChart(id);
  if (src){
    const copies = store.get("seats").map(normSeat).filter(s=>s.chart===src.id && s.seat);
    await Promise.all(copies.map(s=>store.set("seats", `${id}__${s.guest}`, {chart:id, guest:s.guest, seat:s.seat})));
    toast(`Copied ${copies.length} seats from ${src.name}`);
  }
}
async function chartMenu(){
  const c = chart(); if (!c) return;
  const r = await modal({ title: c.name, fields:[{name:"name", label:"Rename"}], values:{name:c.name}, submit:"Save",
    danger: charts.length > 1 ? "Delete this chart" : null,
    onDanger: async ()=>{
      if (!(await confirmBox(`Delete “${c.name}” and its ${seats.size} placements?`))) return;
      for (const d of store.get("seats")) if (normSeat(d).chart===c.id) await store.remove("seats", d.id);
      await store.remove("charts", c.id, `deleted “${c.name}”`);
      charts = chartsSorted(); switchChart(charts[0].id);
    } });
  if (r && r.name.trim() && r.name.trim()!==c.name) await store.update("charts", c.id, {name:r.name.trim()}, `renamed “${c.name}” to “${r.name.trim()}”`);
}

/* ---------- writes ---------- */
function guestName(id){ return byId[id]?.name || id; }
function tableOf(seatKey){ const tid = SEAT_BY_KEY[seatKey]?.table; return tableNames()[tid] || TABLES.find(t=>t.id===tid)?.label || tid; }
const where = ()=> charts.length > 1 ? ` (${chart().name})` : "";
async function writeSeat(id, seatKey){
  if (!seatKey){ return clearSeat(id); }
  seats.set(id, seatKey); render();
  await store.set("seats", seatId(id), {chart:chartId, guest:id, seat:seatKey}, `seated ${guestName(id)} at ${tableOf(seatKey)}${where()}`);
}
async function clearSeat(id){ seats.delete(id); render(); await store.remove("seats", seatId(id), `unseated ${guestName(id)}${where()}`); }
async function swapOrTake(aId, bId){
  const pa = seats.get(aId), pb = seats.get(bId);
  if (!pb) return;
  if (pa){ seats.set(aId,pb); seats.set(bId,pa); render();
    await store.set("seats", seatId(aId), {chart:chartId, guest:aId, seat:pb}); await store.set("seats", seatId(bId), {chart:chartId, guest:bId, seat:pa}, `swapped ${guestName(aId)} and ${guestName(bId)}${where()}`); }
  else { seats.set(aId,pb); seats.delete(bId); render();
    await store.set("seats", seatId(aId), {chart:chartId, guest:aId, seat:pb}); await store.remove("seats", seatId(bId), `gave ${guestName(bId)}'s seat to ${guestName(aId)}${where()}`); }
}
async function writeTableName(tid, name){ const names = {...tableNames(), [tid]:name}; await store.update("charts", chartId, {names}, `renamed a table to “${name}”${where()}`); renderTableLabels(); }

/* ---------- selection ---------- */
function select(id){
  if (selectedId){ bankChips[selectedId]?.classList.remove("selected"); floorChips[selectedId]?.classList.remove("selected"); }
  selectedId = id;
  document.body.classList.toggle("placing", !!id);
  document.body.classList.toggle("placing-seated", !!id && seats.has(id));
  if (id){ root.querySelector("#placeWho").textContent = guestName(id); (seats.has(id) ? floorChips[id] : bankChips[id])?.classList.add("selected"); }
}

/* ---------- floor ---------- */
function buildFloor(){
  canvas.style.width = W+"px"; canvas.style.height = H+"px";
  for (const t of TABLES){
    const el = h("div",{class:"table", style:`left:${t.cx-t.w/2}px; top:${t.cy-t.h/2}px; width:${t.w}px; height:${t.h}px; transform:rotate(${t.angle}deg)`});
    const lab = h("div",{class:"tlabel"}); el.append(lab);
    if (t.sections) for (let i=1;i<t.sections;i++) el.append(h("div",{class:"divider", style:`left:${t.w*i/t.sections}px`}));
    el.addEventListener("dblclick", ()=>{ const cur = tableNames()[t.id]||t.label; const name = prompt("Table name:", cur); if (name && name.trim()) writeTableName(t.id, name.trim().slice(0,24)); });
    canvas.append(el); tableEls[t.id] = lab;
  }
  for (const s of SEATS) canvas.append(h("div",{class:"seat", style:`left:${s.x}px; top:${s.y}px`}));
  canvas.addEventListener("click", e=>{
    if (!selectedId || suppressClick) return;
    const id = selectedId; const p = canvasPoint(e); select(null);
    const snapped = snap(p.x, p.y, id, 90);
    if (snapped) writeSeat(id, snapped.key); else toast("Tap closer to an open seat");
  });
}
function sizeClass(name){ return name.length<=5 ? "sz-s" : name.length<=9 ? "sz-m" : "sz-l"; }
function makeChip(g){
  const col = COLORS[g.color]||COLORS.plain;
  return h("div",{class:"chip "+sizeClass(g.short||g.name), title:g.name, style:`background:${col.bg}; color:${col.fg}`}, g.short||g.name);
}
let groupCounts = [];
function buildBank(){
  groupsEl.innerHTML = ""; bankChips = {}; groupCounts = [];
  for (const gr of GROUPS){
    const list = guests.filter(g=>g.group===gr.id);
    if (!list.length) continue;
    const cnt = h("span",{class:"cnt"});
    const chips = h("div",{class:"chips"});
    for (const g of list){
      const c = makeChip(g);
      c.addEventListener("pointerdown", e=>startDrag(e, g.id, true));
      c.addEventListener("click", e=>{ e.stopPropagation(); if (suppressClick) return; select(selectedId===g.id ? null : g.id); });
      chips.append(c); bankChips[g.id] = c;
    }
    groupsEl.append(h("div",{class:"sgroup"}, h("h2",null, gr.title, cnt), chips));
    groupCounts.push({gr, cnt});
  }
  for (const id of Object.keys(floorChips)) if (!byId[id]){ floorChips[id].remove(); delete floorChips[id]; }
  applySearch();
}
function getFloorChip(g){
  let c = floorChips[g.id];
  if (!c){
    c = makeChip(g);
    c.addEventListener("pointerdown", e=>startDrag(e, g.id, false));
    c.addEventListener("click", e=>{
      e.stopPropagation(); if (suppressClick) return;
      if (selectedId && selectedId !== g.id){ const a = selectedId; select(null); swapOrTake(a, g.id); return; }
      select(selectedId===g.id ? null : g.id);
    });
    c.addEventListener("dblclick", e=>{ e.stopPropagation(); select(null); clearSeat(g.id); });
    canvas.append(c); floorChips[g.id] = c;
  }
  return c;
}
function renderTableLabels(){
  for (const t of TABLES){
    let n = 0; for (const s of seats.values()) if (s.startsWith(t.id+"-")) n++;
    const lab = tableEls[t.id]; if (!lab) continue;
    lab.innerHTML = ""; lab.append(tableNames()[t.id]||t.label, h("br"), h("span",{class:"tcount"}, `${n} / ${t.cap}`));
  }
}
function render(){
  for (const g of guests){
    const key = seats.get(g.id);
    if (key){
      bankChips[g.id]?.classList.add("seated-away");
      if (g.id !== draggingId){ const c = getFloorChip(g); const s = SEAT_BY_KEY[key]; c.style.left = s.x+"px"; c.style.top = s.y+"px"; }
    } else if (g.id !== draggingId){
      bankChips[g.id]?.classList.remove("seated-away");
      if (floorChips[g.id]){ floorChips[g.id].remove(); delete floorChips[g.id]; }
    }
  }
  for (const {gr,cnt} of groupCounts){ const list = guests.filter(g=>g.group===gr.id); cnt.textContent = `${list.filter(g=>seats.has(g.id)).length}/${list.length}`; }
  root.querySelector("#seatStats").innerHTML = `<b>${seats.size}</b>/${guests.length} seated · ${SEATS.length - seats.size} seats open`;
  renderTableLabels();
  for (const [i,c] of charts.entries()){ const b = tabsEl.children[i]; if (b?.querySelector(".cnt")) b.querySelector(".cnt").textContent = c.id===chartId ? seats.size : store.get("seats").filter(d=>normSeat(d).chart===c.id && d.seat).length; }
}

/* ---------- zoom ---------- */
function fitScale(){ return Math.max(0.2, Math.min((floor.clientWidth-24)/W, (floor.clientHeight-24)/H)); }
function applyScale(s){
  const cx = (floor.scrollLeft + floor.clientWidth/2)/scale, cy = (floor.scrollTop + floor.clientHeight/2)/scale;
  scale = s; canvas.style.transform = `scale(${scale})`; wrap.style.width = (W*scale)+"px"; wrap.style.height = (H*scale)+"px";
  floor.scrollLeft = cx*scale - floor.clientWidth/2; floor.scrollTop = cy*scale - floor.clientHeight/2;
}
function wireControls(){
  root.querySelector("#zoomIn").onclick = ()=>applyScale(Math.min(1.3, scale*1.3));
  root.querySelector("#zoomOut").onclick = ()=>applyScale(Math.max(fitScale(), scale/1.3));
  root.querySelector("#zoomFit").onclick = ()=>applyScale(fitScale());
  root.querySelector("#cancelBtn").onclick = ()=>select(null);
  root.querySelector("#unseatBtn").onclick = ()=>{ if (selectedId) clearSeat(selectedId); select(null); };
  root.querySelector("#seatSearch").addEventListener("input", applySearch);
}
function applySearch(){
  const q = (root.querySelector("#seatSearch")?.value||"").trim().toLowerCase();
  for (const g of guests) bankChips[g.id]?.classList.toggle("hidden-by-search", !!q && !g.name.toLowerCase().includes(q));
}

/* ---------- drag ---------- */
function canvasPoint(e){ const r = canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)/scale, y:(e.clientY-r.top)/scale}; }
function snap(x, y, selfId, radius){
  const taken = new Set(); for (const [gid,k] of seats) if (gid!==selfId) taken.add(k);
  let best = null, bd = radius||55;
  for (const s of SEATS){ if (taken.has(s.key)) continue; const d = Math.hypot(s.x-x, s.y-y); if (d<bd){ bd=d; best=s; } }
  return best;
}
function startDrag(e, id, fromBank){
  if (e.button !== undefined && e.button !== 0) return;
  const sx = e.clientX, sy = e.clientY; let active = false, chip = null;
  const cleanup = ()=>{ document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", cancel); };
  const move = ev=>{
    if (!active){ if (Math.hypot(ev.clientX-sx, ev.clientY-sy) < 5) return; active = true; draggingId = id; select(null); chip = getFloorChip(byId[id]); chip.classList.add("dragging"); if (fromBank) bankChips[id]?.classList.add("seated-away"); }
    ev.preventDefault(); const p = canvasPoint(ev); chip.style.left = p.x+"px"; chip.style.top = p.y+"px";
  };
  const up = ev=>{
    cleanup(); if (!active) return;
    suppressClick = true; setTimeout(()=>suppressClick=false, 150);
    draggingId = null; chip.classList.remove("dragging");
    const p = canvasPoint(ev);
    const inside = p.x>-10 && p.x<W+10 && p.y>-10 && p.y<H+10;
    const s = inside ? snap(p.x, p.y, id) : null;
    if (s) writeSeat(id, s.key); else if (seats.has(id) && !inside) clearSeat(id); else render();
  };
  const cancel = ()=>{ cleanup(); if (!active) return; draggingId = null; chip?.classList.remove("dragging"); render(); };
  document.addEventListener("pointermove", move, {passive:false}); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", cancel);
}
