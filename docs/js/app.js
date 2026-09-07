import { store, boot, sha256hex } from "./store.js";
import { SPACE_HASH, firebaseConfig } from "./config.js";
import { h, daysUntil, today, toast } from "./util.js";

const TABS = {
  home: ()=>import("./tabs/home.js"),
  planner: ()=>import("./tabs/planner.js"),
  seating: ()=>import("./tabs/seating.js"),
  music: ()=>import("./tabs/music.js"),
  guests: ()=>import("./tabs/guests.js"),
  budget: ()=>import("./tabs/budget.js"),
  timeline: ()=>import("./tabs/timeline.js"),
  vendors: ()=>import("./tabs/vendors.js"),
  ceremony: ()=>import("./tabs/ceremony.js"),
};

const AUTH = "ally-alex-auth-v1";
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
  const n = daysUntil("2026-10-10");
  document.getElementById("countdown").textContent = n > 1 ? `${n} days` : n === 1 ? "Tomorrow!" : n === 0 ? "Today!" : "Married!";
}

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

/* ---------- boot ---------- */
const saved = loadAuth();
if (saved?.passcode && saved?.who) start(saved).catch(()=>showGate(saved));
else showGate(saved);

window.addEventListener("error", e=>{ console.error(e.error||e.message); });
