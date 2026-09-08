/* Data layer. Two adapters with one API:
   - Firestore (shared, real-time) under spaces/{spaceId}/{collection}/{id}
   - Local (preview mode) in localStorage, used when config.js has no apiKey
   Every write goes through here so the activity feed stays consistent. */
import { firebaseConfig } from "./config.js";
import * as SEED from "../data/seed.js";

export const COLLECTIONS = ["tasks","guests","seats","charts","songs","payments","vendors","timeline","hmu","roles","processional","flow","party","trip","hmblocks","settings","activity"];

let adapter = null;
const listeners = {};       // collection -> Set(cb)
const cache = {};           // collection -> Map(id -> doc)
for (const c of COLLECTIONS){ listeners[c] = new Set(); cache[c] = new Map(); }

export const store = {
  mode: "local", who: "", ready: false, spaceId: "",
  onStatus: ()=>{},
  get(c){ return [...cache[c].values()].sort(byOrder); },
  getOne(c, id){ return cache[c].get(id); },
  subscribe(c, cb){
    listeners[c].add(cb);
    adapter.ensure(c);
    cb(this.get(c));
    return ()=>listeners[c].delete(cb);
  },
  async set(c, id, data, log){ await adapter.set(c, id, {...data, updatedAt: Date.now(), updatedBy: this.who}); if (log) this.log(log, c); },
  async update(c, id, patch, log){ await adapter.update(c, id, {...patch, updatedAt: Date.now(), updatedBy: this.who}); if (log) this.log(log, c); },
  async remove(c, id, log){ await adapter.remove(c, id); if (log) this.log(log, c); },
  async add(c, data, log){ const id = uid(); await this.set(c, id, {...data, createdAt: Date.now(), createdBy: this.who}, log); return id; },
  async log(text, tab){ await adapter.set("activity", uid(), {who: this.who, text, tab: tab||"", at: Date.now()}); },
};

function byOrder(a,b){ return (a.order??0)-(b.order??0) || String(a.id).localeCompare(String(b.id)); }
export function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function emit(c){ const arr = store.get(c); for (const cb of listeners[c]) { try{ cb(arr); }catch(e){ console.error(e); } } }

/* ---------------- seed ---------------- */
function seedDocs(){
  const docs = [];
  const push = (c, arr)=>{ for (const d of arr) docs.push([c, d.id, d]); };
  push("guests", SEED.GUESTS);
  push("tasks", [...SEED.TASKS, ...SEED.SUGGESTED]);
  push("payments", SEED.PAYMENTS);
  push("vendors", SEED.VENDORS);
  push("timeline", SEED.TIMELINE);
  push("roles", SEED.ROLES);
  push("processional", SEED.PROCESSIONAL);
  push("flow", SEED.EVENT_FLOW);
  push("party", SEED.PARTY);
  push("songs", SEED.MUSIC_SEED);
  push("trip", SEED.TRIP_SEED);
  docs.push(["charts", "c1", {id:"c1", name:"Seating Chart 1", names:{}, order:0}]);
  for (const [gid, seat] of Object.entries(SEED.SEATS_SEED)) docs.push(["seats", "c1__"+gid, {id:"c1__"+gid, chart:"c1", guest:gid, seat}]);
  docs.push(["settings", "meta", {id:"meta", seedVersion: SEED.SEED_VERSION, seededAt: Date.now()}]);
  return docs;
}

/* ---------------- local adapter ---------------- */
const LS = "ally-alex-local-v1";
const localAdapter = {
  name:"local",
  async init(){
    let data = {};
    try{ data = JSON.parse(localStorage.getItem(LS)) || {}; }catch(e){}
    if (!data.settings || !data.settings.meta){
      data = {};
      for (const [c, id, d] of seedDocs()){ (data[c] ||= {})[id] = d; }
      persist(data);
    }
    for (const c of COLLECTIONS){ cache[c] = new Map(Object.entries(data[c]||{})); }
    store.onStatus("local");
  },
  ensure(){},
  async set(c, id, d){ cache[c].set(id, {...d, id}); save(); emit(c); },
  async update(c, id, patch){ const cur = cache[c].get(id)||{id}; cache[c].set(id, {...cur, ...patch, id}); save(); emit(c); },
  async remove(c, id){ cache[c].delete(id); save(); emit(c); },
};
function save(){ const data = {}; for (const c of COLLECTIONS) data[c] = Object.fromEntries(cache[c]); persist(data); }
function persist(data){ try{ localStorage.setItem(LS, JSON.stringify(data)); }catch(e){} }

/* ---------------- firestore adapter ---------------- */
const V = "10.14.1";
const fsAdapter = {
  name:"firebase", db:null, fs:null, subs:{},
  async init(){
    const [{initializeApp}, auth, fs] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
    ]);
    this.fs = fs;
    const app = initializeApp(firebaseConfig);
    const a = auth.getAuth(app);
    await auth.signInAnonymously(a);
    this.db = fs.initializeFirestore(app, {localCache: fs.persistentLocalCache({tabManager: fs.persistentMultipleTabManager()})});
    // seed once
    const metaRef = fs.doc(this.db, "spaces", store.spaceId, "settings", "meta");
    const meta = await fs.getDoc(metaRef);
    if (!meta.exists()){
      const docs = seedDocs();
      for (let i=0; i<docs.length; i+=400){
        const b = fs.writeBatch(this.db);
        for (const [c, id, d] of docs.slice(i, i+400)) b.set(fs.doc(this.db, "spaces", store.spaceId, c, id), d);
        await b.commit();
      }
    }
    // preload the collections everything depends on
    await Promise.all(["tasks","guests","seats","charts","trip","settings"].map(c=>this.ensure(c, true)));
    await this.migrate();
    store.onStatus("ok");
  },
  /* One-time upgrades of data seeded by an older version of the site. */
  async migrate(){
    const fs = this.fs;
    // v2: multiple seating charts. Legacy seats/{guestId} -> seats/c1__{guestId} + charts/c1
    if (!cache.charts.size){
      const names = cache.settings.get("tables")?.names || {};
      const b = fs.writeBatch(this.db);
      b.set(this.ref("charts","c1"), {name:"Seating Chart 1", names, order:0});
      for (const d of [...cache.seats.values()]){
        if (d.chart) continue;
        b.set(this.ref("seats","c1__"+d.id), {chart:"c1", guest:d.id, seat:d.seat});
        b.delete(this.ref("seats", d.id));
      }
      await b.commit();
    }
    // v3: honeymoon planner. Seed the trip collection if it has never been written.
    if (!cache.trip.size && !cache.settings.get("meta")?.tripSeeded){
      const b = fs.writeBatch(this.db);
      for (const d of SEED.TRIP_SEED) b.set(this.ref("trip", d.id), d);
      b.set(this.ref("settings","meta"), {tripSeeded: Date.now()}, {merge:true});
      await b.commit();
    }
  },
  ensure(c, wait){
    if (this.subs[c]) return this.subs[c].first;
    const fs = this.fs;
    let q = fs.collection(this.db, "spaces", store.spaceId, c);
    if (c === "activity") q = fs.query(q, fs.orderBy("at","desc"), fs.limit(60));
    let resolve; const first = new Promise(r=>resolve=r);
    const unsub = fs.onSnapshot(q, snap=>{
      cache[c] = new Map(snap.docs.map(d=>[d.id, {...d.data(), id:d.id}]));
      emit(c); resolve();
      store.onStatus(snap.metadata.fromCache ? "cache" : "ok");
    }, err=>{ console.error(c, err); store.onStatus("err"); resolve(); });
    this.subs[c] = {unsub, first};
    return wait ? first : undefined;
  },
  ref(c, id){ return this.fs.doc(this.db, "spaces", store.spaceId, c, id); },
  async set(c, id, d){ cache[c].set(id, {...d, id}); emit(c); await this.fs.setDoc(this.ref(c,id), d); },
  async update(c, id, patch){ const cur = cache[c].get(id)||{id}; cache[c].set(id, {...cur, ...patch, id}); emit(c); await this.fs.setDoc(this.ref(c,id), patch, {merge:true}); },
  async remove(c, id){ cache[c].delete(id); emit(c); await this.fs.deleteDoc(this.ref(c,id)); },
};

/* ---------------- seating helpers ---------------- */
/* Legacy seat docs (before multiple charts) were seats/{guestId} with no chart field. */
export function normSeat(d){ return {chart: d.chart || "c1", guest: d.guest || d.id, seat: d.seat}; }
export function chartsSorted(){ const c = store.get("charts"); return c.length ? c : [{id:"c1", name:"Seating Chart 1", names:{}, order:0}]; }
export function primaryChart(){ return chartsSorted()[0]; }
export function seatMap(chartId){ const m = {}; for (const d of store.get("seats")){ const n = normSeat(d); if (n.chart===chartId && n.seat) m[n.guest] = n.seat; } return m; }

/* ---------------- boot ---------------- */
export async function sha256hex(s){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function boot({passcode, who}){
  store.who = who;
  store.spaceId = (await sha256hex("ally-alex:"+passcode.trim().toLowerCase())).slice(0,20);
  const configured = !!firebaseConfig.apiKey;
  adapter = configured ? fsAdapter : localAdapter;
  store.mode = adapter.name;
  await adapter.init();
  store.ready = true;
}
