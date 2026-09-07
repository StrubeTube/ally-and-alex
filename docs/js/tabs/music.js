/* Music: strings sections pick from the repertoire; DJ sections search Apple's
   public song catalog (no login) for artwork + 30-second previews. */
import { store } from "../store.js";
import { h, modal, toast, confirmBox } from "../util.js";
import { MUSIC_SECTIONS } from "../../data/seed.js";

let unsub, root, repertoire = [], openPicker = null, audio = null, playingBtn = null;

export async function mount(view){
  root = h("div",{class:"page"}); view.append(root);
  if (!repertoire.length){ try{ repertoire = await (await fetch("data/repertoire.json")).json(); }catch(e){ repertoire = []; } }
  unsub = store.subscribe("songs", render);
}
export function unmount(){ unsub?.(); stopAudio(); }

function render(){
  const songs = store.get("songs");
  const picks = songs.filter(s=>s.status==="pick").length;
  const y = window.scrollY;
  root.innerHTML = "";
  root.append(h("div",{class:"page-head"}, h("h1",null,"Music"), h("span",{class:"sub"}, `${picks} picks · strings due Sept 15 · DJ lists due Sept 29`)));
  for (const sec of MUSIC_SECTIONS){
    const secEl = h("section",{class:"msec"},
      h("div",{class:"msec-head"}, h("h2",null,sec.title), h("span",{class:"by"}, [sec.by, sec.time].filter(Boolean).join(" · "))),
    );
    for (const slot of sec.slots){
      const list = songs.filter(s=>s.slot===slot.id).sort((a,b)=>(a.status==="pick"?0:1)-(b.status==="pick"?0:1) || (a.order??0)-(b.order??0));
      const pickList = list.filter(s=>s.status==="pick"), sugg = list.filter(s=>s.status==="suggested");
      const slotEl = h("div",{class:"slot"},
        h("div",{class:"slot-head"}, h("span",{class:"lbl"}, slot.label), h("span",{class:"sub"}, slot.multi ? `${pickList.length} picked` : (pickList.length ? "✓ chosen" : "not chosen yet")), h("span",{class:"grow"}),
          h("button",{class:"btn sm", onClick:()=>{ openPicker = openPicker===slot.id ? null : slot.id; render(); }}, openPicker===slot.id ? "Close" : "+ Add")),
        pickList.length ? h("div",{class:"songs"}, pickList.map(s=>songRow(s, slot))) : null,
        sugg.length ? [h("div",{class:"suggest-note"}, slot.multi ? "Ideas — tap ✓ to keep, ✕ to drop" : "Ideas — tap ✓ to choose"), h("div",{class:"songs"}, sugg.map(s=>songRow(s, slot)))] : null,
        !list.length && openPicker!==slot.id ? h("div",{class:"empty", style:"padding:8px"},"Nothing here yet.") : null,
        openPicker===slot.id ? picker(sec, slot) : null,
      );
      secEl.append(slotEl);
    }
    root.append(secEl);
  }
  window.scrollTo(0, y);
}

function songRow(s, slot){
  const art = s.art ? h("img",{class:"art", src:s.art, alt:""}) : h("div",{class:"art"}, s.source==="repertoire" ? "🎻" : "🎵");
  const artEl = s.preview ? playBtn(s.preview, s.art) : art;
  return h("div",{class:"song "+s.status},
    artEl,
    h("div",null, h("div",{class:"ti"}, s.title, s.status==="pick" && s.addedBy ? h("span",{class:"by"}, s.addedBy) : null), h("div",{class:"ar"}, s.artist)),
    h("div",{class:"acts"},
      s.status!=="pick" ? h("button",{class:"icon-btn", title:"Choose", onClick:async ()=>{
        if (!slot.multi){ for (const o of store.get("songs").filter(x=>x.slot===slot.id && x.status==="pick")) await store.update("songs", o.id, {status:"suggested"}); }
        await store.update("songs", s.id, {status:"pick", addedBy: store.who}, `picked “${s.title}” for ${slot.label}`);
      }}, "✓") : null,
      s.status==="pick" && !slot.multi ? h("button",{class:"icon-btn", title:"Back to ideas", onClick:()=>store.update("songs", s.id, {status:"suggested"}, `un-picked “${s.title}” for ${slot.label}`)}, "↩") : null,
      h("button",{class:"icon-btn", title:"Remove", onClick:()=>store.remove("songs", s.id, s.status==="pick" ? `removed “${s.title}” from ${slot.label}` : null)}, "✕"),
    ),
  );
}

function playBtn(url, art){
  const b = h("button",{class:"play", title:"30-second preview"}, art ? h("img",{src:art, alt:""}) : null, h("span",null,"▶"));
  b.onclick = ()=>{
    if (playingBtn === b){ stopAudio(); return; }
    stopAudio(); audio = new Audio(url); audio.play().catch(()=>{}); playingBtn = b; b.classList.add("playing"); b.querySelector("span").textContent = "■";
    audio.onended = stopAudio;
  };
  return b;
}
function stopAudio(){ if (audio){ audio.pause(); audio = null; } if (playingBtn){ playingBtn.classList.remove("playing"); playingBtn.querySelector("span").textContent = "▶"; playingBtn = null; } }

/* ---------- pickers ---------- */
function picker(sec, slot){
  const results = h("div",{class:"picker-results"});
  const input = h("input",{class:"input", placeholder: sec.source==="repertoire" ? "Search the strings repertoire…" : "Search any song or artist…", autocomplete:"off"});
  const box = h("div",{class:"picker"}, input, results);
  let timer;
  const add = async (song)=>{
    const dup = store.get("songs").find(x=>x.slot===slot.id && x.title.toLowerCase()===song.title.toLowerCase());
    if (dup){ if (dup.status!=="pick") await store.update("songs", dup.id, {status:"pick", addedBy:store.who}, `picked “${song.title}” for ${slot.label}`); else toast("Already on the list"); return; }
    if (!slot.multi){ for (const o of store.get("songs").filter(x=>x.slot===slot.id && x.status==="pick")) await store.update("songs", o.id, {status:"suggested"}); }
    await store.add("songs", {...song, slot:slot.id, status:"pick", addedBy:store.who, order: Date.now()}, `added “${song.title}” to ${slot.label}`);
    toast("Added"); input.value = ""; results.innerHTML = "";
  };
  const run = async ()=>{
    const q = input.value.trim().toLowerCase(); results.innerHTML = "";
    if (!q) return;
    if (sec.source==="repertoire"){
      const hits = repertoire.filter(r=>r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q)).slice(0,40);
      if (!hits.length) results.append(h("div",{class:"empty"},"Not in the repertoire — ask Charlotte String if they can learn it."), h("button",{class:"btn sm", onClick:()=>add({title:input.value.trim(), artist:"(not in repertoire — ask)", source:"manual"})}, "Add anyway"));
      for (const r of hits) results.append(h("button",{class:"pres", onClick:()=>add({title:r.title, artist:r.artist, source:"repertoire"})}, h("div",{class:"art"},"🎻"), h("div",null, h("div",{class:"ti"},r.title), h("div",{class:"ar"},r.artist)), h("span",{class:"pill"}, r.genre)));
    } else {
      results.append(h("div",{class:"empty"},"Searching…"));
      try{
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=12&country=US`);
        const data = await res.json(); results.innerHTML = "";
        if (!data.results?.length) results.append(h("div",{class:"empty"},"No matches."));
        for (const r of data.results){
          const song = {title:r.trackName, artist:r.artistName, art:(r.artworkUrl100||"").replace("100x100","200x200"), preview:r.previewUrl||"", source:"catalog"};
          results.append(h("div",{class:"pres", style:"cursor:default"}, song.preview ? playBtn(song.preview, song.art) : h("img",{class:"art", src:song.art}),
            h("div",null, h("div",{class:"ti"},song.title), h("div",{class:"ar"},song.artist)),
            h("button",{class:"btn sm sage", onClick:()=>add(song)}, "Add")));
        }
      }catch(e){ results.innerHTML = ""; results.append(h("div",{class:"empty"},"Search didn't load. "), h("button",{class:"btn sm", onClick:()=>add({title:input.value.trim(), artist:"", source:"manual"})}, "Add as typed")); }
    }
  };
  input.addEventListener("input", ()=>{ clearTimeout(timer); timer = setTimeout(run, sec.source==="repertoire" ? 80 : 350); });
  input.addEventListener("keydown", e=>{ if (e.key==="Enter"){ e.preventDefault(); run(); } });
  setTimeout(()=>input.focus(), 0);
  return box;
}
