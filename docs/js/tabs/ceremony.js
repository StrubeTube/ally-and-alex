import { store } from "../store.js";
import { h, modal, confirmBox } from "../util.js";

let unsubs = [], root;
export function mount(v){ root = h("div",{class:"page"}); v.append(root); for (const c of ["roles","processional","flow","party"]) unsubs.push(store.subscribe(c, render)); }
export function unmount(){ unsubs.forEach(u=>u()); unsubs = []; }

function render(){
  const roles = store.get("roles"), proc = store.get("processional"), flow = store.get("flow"), party = store.get("party");
  const filled = roles.filter(r=>r.person && !/confirm/i.test(r.person)).length;
  root.innerHTML = "";
  root.append(
    h("div",{class:"page-head"}, h("h1",null,"Ceremony & Roles"), h("span",{class:"sub"},"4:30 PM · fully outdoors · who does what")),
    h("div",{class:"home-grid"},
      h("div",null,
        h("div",{class:"card"}, h("h2",null,"Processional & ceremony order", h("button",{class:"btn sm", onClick:()=>editStep("processional")}, "+ Step")),
          h("div",{class:"steps"}, proc.map((s,i)=>h("div",{class:"step", onClick:()=>editStep("processional", s)}, h("span",{class:"n"}, i+1), h("div",null, h("div",{class:"st"}, s.step), s.who ? h("div",{class:"sw"}, s.who) : null, s.music ? h("div",{class:"sw"}, "♪ ", s.music) : null), h("div",null))))),
        h("div",{class:"card"}, h("h2",null,"Reception flow", h("span",{class:"cnt"},"tap to keep / skip")),
          h("div",{class:"steps"}, flow.map((s,i)=>h("div",{class:"step"+(s.keep?"":" skip"), onClick:()=>editStep("flow", s)},
            h("button",{class:"chk "+(s.keep?"done":""), style:"width:22px;height:22px;border-radius:6px;border:1.5px solid var(--line-2);background:"+(s.keep?"var(--sage)":"#fff")+";color:#fff;padding:0", onClick:e=>{ e.stopPropagation(); store.update("flow", s.id, {keep:!s.keep}, !s.keep ? `kept “${s.step}” in the reception` : `skipped “${s.step}”`); }}, s.keep?"✓":""),
            h("div",null, h("div",{class:"st"}, s.step), s.who ? h("div",{class:"sw"}, s.who) : null), h("div",null))))),
      ),
      h("div",null,
        h("div",{class:"card"}, h("h2",null,"Who's holding what", h("span",{class:"cnt"}, `${filled}/${roles.length} assigned`)),
          h("div",{class:"steps"}, roles.map(r=>h("div",{class:"step", style:"grid-template-columns:1fr auto", onClick:()=>editRole(r)},
            h("div",null, h("div",{class:"st"}, r.role), r.notes ? h("div",{class:"sw"}, r.notes) : null),
            h("span",{class:"pill "+(r.person && !/confirm/i.test(r.person) ? "sage" : "rose")}, r.person || "unassigned")))),
          h("button",{class:"btn sm mt", onClick:()=>editRole()}, "+ Role")),
        h("div",{class:"card"}, h("h2",null,"Wedding party", h("button",{class:"btn sm", onClick:()=>editParty()}, "+ Person")),
          ["Ally","Alex"].map(side=>[h("div",{class:"cat", style:"margin:8px 0 4px"}, side+"'s side"),
            h("div",{class:"steps"}, party.filter(p=>p.side===side).map(p=>h("div",{class:"step", style:"grid-template-columns:1fr auto", onClick:()=>editParty(p)},
              h("div",null, h("div",{class:"st"}, p.name, p.pron ? h("span",{class:"faint"}, ` (${p.pron})`) : null), p.role ? h("div",{class:"sw"}, p.role) : null), h("div",null))))]),
          h("div",{class:"faint mt", style:"font-size:12px"},"Best guess from the head table. Fix roles and add pronunciations for the DJ's intros.")),
      ),
    ),
  );
}
async function editStep(coll, s){
  const isProc = coll==="processional";
  const r = await modal({ title: s ? "Edit step" : "New step",
    fields:[{name:"step", label:"Step"}, {name:"who", label:"Who"}, ...(isProc ? [{name:"music", label:"Music cue"}] : [])],
    values:s, submit:s?"Save":"Add", danger:s?"Delete":null,
    onDanger: async ()=>{ if (await confirmBox(`Delete “${s.step}”?`)) store.remove(coll, s.id); } });
  if (!r || !r.step.trim()) return;
  if (s) await store.update(coll, s.id, r, `updated “${r.step}”`); else await store.add(coll, {...r, keep:true, order:Date.now()}, `added “${r.step}” to the ${isProc?"ceremony order":"reception flow"}`);
}
async function editRole(x){
  const r = await modal({ title: x ? "Assign role" : "New role",
    fields:[{name:"role", label:"Role"}, {name:"person", label:"Person"}, {name:"notes", label:"Notes", type:"textarea"}],
    values:x, submit:"Save", danger:x?"Delete":null, onDanger:()=>store.remove("roles", x.id) });
  if (!r || !r.role.trim()) return;
  if (x) await store.update("roles", x.id, r, r.person ? `assigned “${r.role}” to ${r.person}` : `updated “${r.role}”`); else await store.add("roles", {...r, order:Date.now()}, `added role “${r.role}”`);
}
async function editParty(p){
  const r = await modal({ title: p ? "Edit" : "Add to wedding party",
    fields:[{name:"name", label:"Name"}, {name:"side", label:"Side", type:"select", options:["Ally","Alex"]}, {name:"role", label:"Role (maid of honor, groomsman…)"}, {name:"pron", label:"Pronunciation for the DJ"}],
    values:p, submit:"Save", danger:p?"Remove":null, onDanger:()=>store.remove("party", p.id) });
  if (!r || !r.name.trim()) return;
  if (p) await store.update("party", p.id, r); else await store.add("party", {...r, order:Date.now()}, `added ${r.name} to the wedding party`);
}
