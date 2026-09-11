import { store, boot, sha256hex } from "./store.js";
import { SPACE_HASH, firebaseConfig } from "./config.js";
import { h, daysUntil, today, toast, parse, ymd } from "./util.js";
import { BACHELOR_DATE, WEDDING_DATE } from "../data/seed.js";

const TABS = {
  home: ()=>import("./tabs/home.js"),
  planner: ()=>import("./tabs/planner.js"),
  seating: ()=>import("./tabs/seating.js"),
  music: ()=>import("./tabs/music.js"),
  budget: ()=>import("./tabs/budget.js"),
  timeline: ()=>import("./tabs/timeline.js"),
  vendors: ()=>import("./tabs/vendors.js"),
  ceremony: ()=>import("./tabs/ceremony.js"),
  honeymoon: ()=>import("./tabs/honeymoon.js"),
};

const AUTH = "ally-alex-auth-v1";
const BUILD = "20260911.0841";   // stamped by scripts/bump.py

/* ---------- self-update ----------
   GitHub Pages caches every file for 10 minutes and phones have no hard refresh.
   Poll version.json (never cached); when it changes, refetch our own files past the
   HTTP cache and reload. Waits if a form is open so nobody loses an edit. */
const FILES = ["index.html","css/app.css","js/app.js","js/store.js","js/util.js","js/config.js","data/seed.js",
  ...Object.keys({home:1,planner:1,seating:1,music:1,guests:1,budget:1,timeline:1,vendors:1,ceremony:1,honeymoon:1}).map(t=>`js/tabs/${t}.js`)];
let updatePending = false;
async function checkForUpdate(){
  try{
    const r = await fetch(`version.json?_=${Date.now()}`, {cache:"no-store"});
    const {v} = await r.json();
    if (!v || v === BUILD || updatePending) return;
    updatePending = true;
    await Promise.all(FILES.map(f=>fetch(f, {cache:"reload"}).catch(()=>{})));
    applyUpdate();
  }catch(e){}
}
function applyUpdate(){
  if (document.getElementById("modal")){ setTimeout(applyUpdate, 3000); return; }   // someone is mid-edit
  toast("Updating to the latest version…");
  setTimeout(()=>location.reload(), 600);
}
setTimeout(checkForUpdate, 4000);
setInterval(checkForUpdate, 3*60*1000);
document.addEventListener("visibilitychange", ()=>{ if (document.visibilityState==="visible") checkForUpdate(); });
const gate = document.getElementById("gate");
const shell = document.getElementById("shell");

/* ---------- gate ---------- */
function loadAuth(){ try{ return JSON.parse(localStorage.getItem(AUTH)) || null; }catch(e){ return null; } }
function saveAuth(a){ try{ localStorage.setItem(AUTH, JSON.stringify(a)); }catch(e){} }

async function showGate(prefill){
  gate.hidden = false; shell.hidden = true;
  const form = document.getElementById("gateForm");
  const pass = document.getElementById("passcode");
  const go = form.querySelector(".gate-go");
  const err = document.getElementById("gateErr");
  let who = prefill?.who || "";
  if (prefill?.passcode) pass.value = prefill.passcode;
  const btns = [...form.querySelectorAll(".who-btn")];
  const sync = ()=>{ btns.forEach(b=>b.classList.toggle("on", b.dataset.who===who)); go.disabled = !(who && pass.value.trim()); };
  btns.forEach(b=>b.onclick = ()=>{ who = b.dataset.who; sync(); });
  pass.oninput = sync; sync();
  form.onsubmit = async e=>{
    e.preventDefault(); err.hidden = true; go.disabled = true; go.textContent = "Opening…";
    const passcode = pass.value.trim();
    const hash = await sha256hex("ally-alex:"+passcode.toLowerCase());
    if (SPACE_HASH && !SPACE_HASH.startsWith("__") && hash !== SPACE_HASH){
      err.textContent = "That's not the passcode. Ask Alex."; err.hidden = false;
      go.disabled = false; go.textContent = "Open the planner"; return;
    }
    saveAuth({passcode, who});
    await start({passcode, who});
  };
}

/* ---------- start ---------- */
async function start(auth){
  const status = document.getElementById("syncStatus");
  store.onStatus = s=>{
    status.className = "status " + (s==="ok"?"ok": s==="local"?"local": s==="err"?"err":"");
    status.title = s==="ok" ? "Synced" : s==="local" ? "Preview mode — this device only" : s==="cache" ? "Offline — will sync" : s==="err" ? "Sync error" : "Connecting";
  };
  try{ await boot(auth); }
  catch(e){
    console.error(e);
    await showGate(auth);
    const msg = /configuration-not-found/.test(e.message||"") ? "Firebase says sign-in isn't set up yet (Authentication → Sign-in method → Anonymous)." : "Couldn't connect: " + (e.message||e);
    document.getElementById("gateErr").textContent = msg; document.getElementById("gateErr").hidden = false;
    const go = document.querySelector(".gate-go"); go.disabled = false; go.textContent = "Try again";
    return;
  }
  gate.hidden = true; shell.hidden = false;
  document.getElementById("whoChip").textContent = store.who;
  document.getElementById("whoChip").onclick = ()=>{ localStorage.removeItem(AUTH); location.reload(); };
  const banner = document.getElementById("banner");
  if (store.mode === "local"){ banner.hidden = false; banner.textContent = "Preview mode: the shared database isn't connected yet, so changes stay on this device."; }
  renderCountdown();
  window.addEventListener("hashchange", route);
  route();
}

function renderCountdown(){
  const el = document.getElementById("countdown"); el.innerHTML = "";
  const w = daysUntil(WEDDING_DATE), b = daysUntil(BACHELOR_DATE);
  const days = n => n > 1 ? [`${n} days`, `${n}d`] : n === 1 ? ["Tomorrow!","1d"] : n === 0 ? ["Today!","today"] : ["Married!","💒"];
  el.append(pill("rose", "💍", ...days(w), "to the wedding"));
  if (b >= 0) el.append(pill("gold", "🎉", ...days(b), "to the bachelor trip"));
  const wk = weekendsLeft();
  if (w > 0) el.append(pill("sage", "📅", `${wk} weekend${wk===1?"":"s"}`, `${wk} wknd`, "before the wedding weekend"));
}
/* Saturdays from today (inclusive) up to but not including the wedding Saturday. */
function weekendsLeft(){
  let n = 0; const d = parse(today()), end = parse(WEDDING_DATE);
  for (; d < end; d.setDate(d.getDate()+1)) if (d.getDay() === 6) n++;
  return n;
}
function pill(tone, icon, big, short, small){ return h("span",{class:"cd "+tone, title:`${big} ${small}`}, h("span",{class:"ic"},icon), h("b",{class:"full"},big), h("b",{class:"short"},short), h("span",{class:"lbl"}," "+small)); }

/* ---------- router ---------- */
let current = null, currentMod = null;
async function route(){
  const tab = (location.hash.replace("#","").split("/")[0]) || "home";
  const name = TABS[tab] ? tab : "home";
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("on", a.dataset.tab===name));
  if (current === name) return;
  if (currentMod?.unmount) { try{ currentMod.unmount(); }catch(e){} }
  current = name;
  const view = document.getElementById("view");
  view.innerHTML = "";
  const mod = await TABS[name]();
  currentMod = mod;
  if (current !== name) return;
  mod.mount(view);
  window.scrollTo(0,0);
  const nav = document.querySelector("#nav a.on"); nav?.scrollIntoView({inline:"center", block:"nearest"});
}

/* ---------- theme ---------- */
function applyTheme(t){ document.documentElement.setAttribute("data-theme", t); const b = document.getElementById("themeBtn"); if (b) b.textContent = t==="dark" ? "☀️" : "🌙"; }
applyTheme(document.documentElement.getAttribute("data-theme") || "light");
document.getElementById("themeBtn").onclick = ()=>{
  const t = document.documentElement.getAttribute("data-theme")==="dark" ? "light" : "dark";
  try{ localStorage.setItem("ally-alex-theme", t); }catch(e){}
  applyTheme(t);
};

/* ---------- boot ---------- */
const saved = loadAuth();
if (saved?.passcode && saved?.who) start(saved).catch(()=>showGate(saved));
else showGate(saved);

window.addEventListener("error", e=>{ console.error(e.error||e.message); });
