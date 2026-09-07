/* Seed data for Ally & Alex — written into the shared database the first time
   the site is opened. Everything here came from the couple's spreadsheets
   (Wedding Planning.xlsx, WEDDING MASTER CHECKLIST.xlsx) and the venue sketch. */

export const SEED_VERSION = 1;
export const WEDDING_DATE = "2026-10-10";

/* ---------------- guests ---------------- */
export const COLORS = {
  couple:  {bg:"#9c7a21", fg:"#fff", label:"The couple"},
  grey:    {bg:"#82888f", fg:"#fff", label:"Immediate family"},
  orange:  {bg:"#e0801f", fg:"#fff", label:"Ally · aunts, uncles, cousins"},
  cyan:    {bg:"#21aec2", fg:"#fff", label:"Ally · Grandpa's side"},
  magenta: {bg:"#c433ae", fg:"#fff", label:"Family friends"},
  yellow:  {bg:"#e6c412", fg:"#3b3305", label:"Alex · Grandma's side"},
  green:   {bg:"#43a24b", fg:"#fff", label:"Alex · aunts, uncles, cousins"},
  teal:    {bg:"#177e95", fg:"#fff", label:"Alex · Cherry & David"},
  plain:   {bg:"#b9b2a6", fg:"#2a2723", label:"Added later / tentative"},
  black:   {bg:"#26292c", fg:"#fff", label:"Friends"},
};
function g(id, name, group, color, short){ return {id, name, group, color, short: short || name}; }
export const GUESTS = [
  g("ally","Ally","couple","couple"), g("alex","Alex","couple","couple"),

  g("a-mom","Mom (Ally)","ally","grey","Mom"), g("a-dad","Dad (Ally)","ally","grey","Dad"),
  g("matt","Matt","ally","grey"), g("salomey","Salomey","ally","grey"),
  g("aunt-mary","Aunt Mary","ally","orange"), g("uncle-joe","Uncle Joe","ally","orange"),
  g("aunt-karen","Aunt Karen","ally","orange"), g("joe-tiano","Joe Tiano","ally","orange"),
  g("amanda","Amanda","ally","orange"), g("adam-a","Adam (Ally side)","ally","orange","Adam"),
  g("tori","Tori","ally","orange"), g("tori-2","Tori 2","ally","orange"),
  g("grandpa","Grandpa","ally","cyan"), g("aunt-sarah","Aunt Sarah","ally","cyan"),
  g("gerardo","Gerardo","ally","cyan"), g("peter","Peter","ally","cyan"),
  g("peters-gf","Peter's GF","ally","cyan","Peter GF"),
  g("glenn","Glenn","ally","magenta"), g("marlo","Marlo","ally","magenta"),
  g("uschi","Uschi","ally","magenta"), g("martin","Martin","ally","magenta"),
  g("ricky","Ricky","ally","plain"), g("tricia","Tricia","ally","plain"),
  g("dee-a","Dee (Ally side)","ally","plain","Dee"), g("sherri","Sherri","ally","plain"),

  g("x-mom","Mom (Alex)","alex","grey","Mom"), g("x-dad","Dad (Alex)","alex","grey","Dad"),
  g("ellie","Ellie","alex","grey"), g("faye","Faye","alex","grey"),
  g("aunt-missy","Aunt Missy","alex","yellow"), g("uncle-john","Uncle John","alex","yellow"),
  g("grandma","Grandma","alex","yellow"), g("valentina","Valentina","alex","yellow"),
  g("kyle","Kyle","alex","yellow"), g("alinna","Alinna","alex","yellow"),
  g("nancy","Nancy","alex","yellow"), g("bob","Bob","alex","yellow"),
  g("aunt-betsy","Aunt Betsy","alex","green"), g("uncle-dennis","Uncle Dennis","alex","green"),
  g("uncle-dale","Uncle Dale","alex","green"), g("aunt-emmie","Aunt Emmie","alex","green"),
  g("sharon","Sharon","alex","green"), g("lillie","Lillie","alex","green"),
  g("frank","Frank","alex","green"), g("eleanor","Eleanor","alex","green"),
  g("sam","Sam","alex","green"), g("dee","Dee","alex","green"),
  g("skeet","Skeet","alex","green"), g("elizabeth","Elizabeth","alex","green"),
  g("cherry","Cherry","alex","teal"), g("david","David","alex","teal"),
  g("koren","Koren","alex","magenta"), g("steve","Steve","alex","magenta"),
  g("otis","Otis","alex","magenta"), g("penny","Penny","alex","magenta"),
  g("penny-2","Penny (2)","alex","magenta","Penny 2"), g("sadie","Sadie","alex","magenta"),
  g("ruby","Ruby","alex","magenta"), g("adam-x","Adam (Alex side)","alex","magenta","Adam"),
  g("will","Will","alex","magenta"),
  g("diana","Diana","alex","plain"), g("diana-plus","Diana's plus one","alex","plain","Diana +1"),
  g("daniel","Daniel","alex","plain"),

  g("mg","MG","friends","black"), g("emily","Emily","friends","black"), g("evan","Evan","friends","black"),
  g("katie","Katie","friends","black"), g("ted","Ted","friends","black"), g("delaney","Delaney","friends","black"),
  g("kevin","Kevin","friends","black"), g("cassidy","Cassidy","friends","black"),
  g("chris-whitworth","Chris Whitworth","friends","black","Chris W."),
  g("emily-johnson","Emily Johnson","friends","black","Emily J."),
  g("ty","Ty","friends","black"), g("jake","Jake","friends","black"), g("tommy","Tommy","friends","black"),
  g("caroline","Caroline","friends","black"), g("rachel","Rachel","friends","black"),
  g("michael","Michael","friends","black"), g("madi","Madi","friends","black"), g("fred","Fred","friends","black"),
  g("shaila","Shaila","friends","black"), g("chris-duzan","Chris Duzan","friends","black","Chris D."),
  g("jess","Jess","friends","black"), g("chris-cleland","Chris Cleland","friends","black","Chris C."),
  g("lindsey","Lindsey","friends","black"), g("patrick","Patrick","friends","black"),
  g("joy","Joy","friends","black"), g("joys-bf","Joy's BF","friends","black","Joy's BF"),
  g("nick-t","Nick T","friends","black"), g("chantal","Chantal","friends","black"),
  g("nick-phillips","Nick Phillips","friends","black","Nick P."),
  g("nick-gf","Nick's GF","friends","black","Nick GF"),
  g("evans-mom","Evan's Mom","friends","black","Evan Mom"),
  g("evans-dad","Evan's Dad","friends","black","Evan Dad"),
  g("blake-johnson","Blake Johnson","friends","plain","Blake"),
  g("chris-taylor","Chris Taylor","friends","plain","Chris T."),
  g("riley","Riley","friends","plain"), g("jack","Jack","friends","plain"),
  g("tommy-floegel","Tommy Floegel","friends","plain","Tommy F."),
  g("tommy-gf","Tommy F's GF","friends","plain","Tommy GF"),
].map((x,i)=>({...x, order:i}));

export const GROUPS = [
  {id:"couple", title:"The Couple"},
  {id:"ally", title:"Ally's Family"},
  {id:"alex", title:"Alex's Family"},
  {id:"friends", title:"Friends"},
];

/* ---------------- floor plan (venue sketch) ---------------- */
export const FLOOR = {w:1240, h:1040};
export const TABLES = [
  {id:"t1", label:"Table 1", cx:364, cy:270, w:240, h:88, angle:-52, perSide:4, ends:true},
  {id:"t2", label:"Table 2", cx:620, cy:270, w:240, h:88, angle:-52, perSide:4, ends:true},
  {id:"t3", label:"Table 3", cx:876, cy:270, w:240, h:88, angle:-52, perSide:4, ends:true},
  {id:"head", label:"Head Table", cx:620, cy:545, w:660, h:80, angle:0, perSide:12, sections:3},
  {id:"t4", label:"Table 4", cx:236, cy:860, w:240, h:88, angle:-52, perSide:4, ends:true},
  {id:"t5", label:"Table 5", cx:492, cy:860, w:240, h:88, angle:-52, perSide:4, ends:true},
  {id:"t6", label:"Table 6", cx:748, cy:860, w:240, h:88, angle:-52, perSide:4, ends:true},
  {id:"t7", label:"Table 7", cx:1004, cy:860, w:240, h:88, angle:-52, perSide:4, ends:true},
];

/* Seats carried over from the Sept 5 seating chart artifact. */
export const SEATS_SEED = {
  ally:"head-6", alex:"head-5", evan:"head-17", emily:"head-18", mg:"head-19", katie:"head-7",
  ted:"head-8", ty:"head-21", jake:"head-20", tommy:"head-4", caroline:"head-3", kevin:"head-16",
  delaney:"head-15", matt:"head-0", salomey:"head-1", ellie:"head-2", faye:"head-14",
  "emily-johnson":"head-22",
};

/* ---------------- tasks (WEDDING MASTER CHECKLIST) ---------------- */
function t(cat, title, owner, due, status, notes){
  return {cat, title, owner, due: due || null, status: status || "todo", notes: notes || "", source:"ours"};
}
export const TASKS = [
  t("ATTIRE","Ally dress fitting","Ally","2026-09-03","done","Wear actual shoes; check hem and bustle."),
  t("LOGISTICS","Finalize guest count and reception layout","Both","2026-09-06","doing","Includes adults/children, unused seats, high chairs, and final table assignments."),
  t("LOGISTICS","Finalize seating chart","Both","2026-09-06","doing","Use the Seating tab."),
  t("ATTIRE","Alex take suit to be fitted","Alex","2026-09-07"),
  t("VENDORS","Send final/updated guest count to venue and caterer","Ally","2026-09-07","todo","Include dietary restrictions and vendor meals if requested."),
  t("VENDORS","Meet with florist","Ally","2026-09-08","doing"),
  t("VENDORS","Confirm final floral order and placement plan","Ally","2026-09-08","doing","Bouquets, boutonnieres, ceremony/reception florals, bud vases, palette, florist setup time, post-wedding flowers."),
  t("VENDORS","Create and send photographer shot list","Ally","2026-09-08","todo","Include family formals with names, must-have people, details/decor, first look, and getting-ready locations."),
  t("LOGISTICS","Finalize ceremony structure and processional/recessional order","Both","2026-09-08","todo","Include who walks with whom, ring holder, reserved seating, and 4:30 PM start. Use the Ceremony tab."),
  t("DECOR","Inventory all decor and note anything missing","Both","2026-09-08","doing","Signs/stands, frames, guest book, card box, ceremony decor."),
  t("DECOR","Ally get cocktail table linens from Danielle","Ally","2026-09-09"),
  t("LOGISTICS","Finalize reception event flow","Both","2026-09-10","doing","Entrances, first dance, parent dances, toasts, cake/dessert, open dancing, last dance/sendoff, skipped traditions."),
  t("VENDORS","Wedding venue walkthrough with Planner","Ally","2026-09-10"),
  t("VENDORS","Confirm complete bar setup responsibilities","Ally","2026-09-10","todo","Confirm ice, glassware/cups, bartender needs, mixers/garnishes, and who transports alcohol."),
  t("VENDORS","Follow up on ABC permit and save/print approval","Ally","2026-09-10"),
  t("DECOR","Create final decor placement/setup plan","Ally","2026-09-10","todo","Map decor, candles, florals, and table numbers to farm tables, rounds, ceremony, bar, and welcome areas."),
  t("VENDORS","Call with caterer and confirm final catering details","Ally","2026-09-11","todo","Dietary restrictions, kids/vendor meals, cocktail hour, dinner, dessert, water/coffee, leftovers."),
  t("LOGISTICS","Build and approve master wedding-day timeline","Both","2026-09-13","doing","Cover HMU, getting dressed, first look, portraits, ceremony, cocktail hour, reception events, vendor arrivals/departures, and breakdown. Use the Timeline tab."),
  t("LOGISTICS","Obtain and organize NC marriage license","Both","2026-09-14","doing","Confirm required IDs, signing requirements, safe storage, and who returns/files it."),
  t("DECOR","Order bubbles for send off","Alex","2026-09-14"),
  t("DECOR","Finalize, proofread, print, and cut all wedding paper goods","Ally","2026-09-14","todo","Place cards, table numbers, bar sign, welcome sign, reserved signs, menus/guest-book/card signs if using."),
  t("VENDORS","Finalize ceremony music with string musicians","Both","2026-09-15","todo","Processional, bride entrance, recessional, and cocktail-hour selections. Use the Music tab."),
  t("VENDORS","Send timeline to key vendors and resolve conflicts","Ally","2026-09-15","todo","Photographer, DJ, venue/coordinator, HMU, catering, florist, transportation."),
  t("VENDORS","Send Strings music preferences","Both","2026-09-15"),
  t("VENDORS","Send DJ music preferences","Both","2026-09-15","todo","Must-play, do-not-play, special dances, entrances, and last dance."),
  t("LOGISTICS","Practice first dance","Both","2026-09-16"),
  t("LOGISTICS","Finalize and purchase remaining beer, wine, liquor, mixers, and garnishes","Both","2026-09-17","todo","Include Italicus Spritz ingredients, mixers, and garnishes."),
  t("LOGISTICS","Finalize vows and officiant ceremony details","Both","2026-09-20","todo","Include script review and marriage-license responsibilities."),
  t("LOGISTICS","Send Emily vows to review","Both","2026-09-20"),
  t("LOGISTICS","Plan catering orders for bridesmaids/groomsmen while getting ready","Both","2026-09-20"),
  t("LOGISTICS","Send final wedding-weekend timeline and logistics to family","Both","2026-09-20","todo","Arrival times, addresses, rehearsal/welcome party, family photo call times."),
  t("PACKING","Sort and organize place cards/table numbers for setup","Ally","2026-09-21","todo","Sort by table; label for setup."),
  t("PACKING","Pack and label ceremony, reception decor, bar, bride, and emergency-kit bins","Both","2026-09-21","todo","Group items by setup area instead of individual item type."),
  t("LOGISTICS","Confirm shuttle and wedding-day transportation plan","Ally","2026-09-23","todo","Pickup/drop-off locations and times, guest instructions, wedding party, couple transportation."),
  t("ATTIRE","Ally final hair appointment","Ally","2026-09-25"),
  t("ATTIRE","Practice bustle and record instructions for helpers","Ally","2026-09-26","todo","Assign 1–2 helpers."),
  t("ATTIRE","Finalize all bridal attire and accessories","Ally","2026-09-26","todo","Veil, jewelry, shoes, backup shoes, undergarments/shapewear, hair accessories, getting-ready outfit, perfume."),
  t("ATTIRE","Complete Alex's final fitting and full outfit check","Alex","2026-09-26","todo","Suit/tux, shirt, shoes, socks, belt/suspenders, tie, cufflinks, pocket square, undergarments."),
  t("LOGISTICS","Pick up, check, and clean wedding rings","Both","2026-09-26","todo","Decide who carries the rings on wedding day."),
  t("LOGISTICS","Prepare vendor tip/payment envelopes and assign distributor","Ally","2026-09-26","todo","Withdraw cash if needed and label envelopes."),
  t("ATTIRE","Book/confirm Alex's grooming appointments","Alex","2026-09-27"),
  t("PACKING","Pack wedding-night and honeymoon bags","Both","2026-09-27","todo","Include toiletries, chargers, medications, travel documents, and day-after essentials."),
  t("LOGISTICS","Review and pay remaining vendor balances","Both","2026-09-29","todo","Use the Budget tab."),
  t("PACKING","Pack all wedding-day personal essentials","Both","2026-10-02","todo","Attire, getting-ready clothes, rings, vows, license, emergency kit."),
  t("LOGISTICS","Assign all wedding-day handoff responsibilities","Both","2026-10-03","todo","Decor delivery/setup, place cards, license, rings, bride phone/purse, bustle, tips, gifts/cards, leftover alcohol, florals, breakdown, belongings. Use the Ceremony tab."),
  t("LOGISTICS","Review outdoor weather/rain plan with venue","Both","2026-10-05","todo","Wedding is fully outdoors; confirm decision timing and backup logistics."),
  t("LOGISTICS","Do one final wedding-week vendor confirmation","Ally","2026-10-07","todo","Reconfirm arrival times, guest count, table layout, transportation, photography, DJ, florist, catering, strings."),
  t("ATTIRE","Complete wedding-week beauty appointments and prep","Ally","2026-10-08","todo","Nails, pedicure, brows, spray tan if doing, hair-wash timing, shaving/waxing."),
  t("LOGISTICS","Give labeled bins/materials to coordinator or setup person","Both","2026-10-09"),
  t("LOGISTICS","Do final rings/license/vows check","Both","2026-10-09"),
  t("ATTIRE","Steam/prepare wedding attire and veil","Both","2026-10-09"),
  t("LOGISTICS","Confirm rings, vows, and marriage license are with designated people","Both","2026-10-09"),
  t("ATTIRE","Ally final dress fitting","Ally",null),
  t("LOGISTICS","Confirm marriage license is returned/filed","Both","2026-10-13"),
  t("LOGISTICS","Collect cards, gifts, belongings, leftover alcohol, decor, and desired florals","Both","2026-10-11"),
  t("LOGISTICS","Pay any final invoices and leave vendor reviews","Both","2026-10-20"),
  t("LOGISTICS","Send thank-you notes","Both","2026-11-15"),
].map((x,i)=>({...x, id:"task-"+String(i+1).padStart(2,"0"), order:i}));

/* Things the checklist doesn't cover yet. These land in the Suggested tray. */
function s(cat, title, owner, due, notes){ return {cat, title, owner, due: due || null, status:"todo", notes: notes||"", source:"suggested"}; }
export const SUGGESTED = [
  s("LOGISTICS","Book the Register of Deeds trip for the marriage license","Both","2026-09-12","NC licenses are good for 60 days, both of you must appear in person with photo ID and SSN. Mecklenburg County Register of Deeds, 720 E 4th St. Do it before Sept 25 so it's safely inside the window."),
  s("LOGISTICS","Confirm welcome party / rehearsal: date, place, headcount, who's invited","Both","2026-09-12","The budget sheet has a 'decor for welcome party' line but no details anywhere else."),
  s("LOGISTICS","Check sunset time against the photo timeline","Both","2026-09-13","Sunset in Charlotte on Oct 10 is about 6:55 PM. Cocktail hour 5:00–6:15 is your golden-hour window; make sure the photographer's plan uses it."),
  s("VENDORS","Send vendor meal count to caterer","Ally","2026-09-11","Photographer, DJ, string duo, coordinator. Most contracts require a hot meal."),
  s("VENDORS","Confirm kids: count, high chairs, kids' meals","Both","2026-09-10","Feeds the final headcount."),
  s("VENDORS","Confirm ceremony chair count and reserved-row signs","Ally","2026-09-10","How many chairs the venue sets, how many rows reserved for family."),
  s("VENDORS","Order the cake / dessert","Ally","2026-09-12","Cake is on the non-vendor payments list with no vendor or amount yet. Private cake cutting is at 8:00 PM."),
  s("LOGISTICS","Buy Ally's wedding ring","Alex","2026-09-15","On the non-vendor list. Rings get picked up and cleaned Sept 26."),
  s("LOGISTICS","Book pet care for Billy and Bruce (wedding weekend + honeymoon)","Both","2026-09-14","Budgeted at $3,000."),
  s("LOGISTICS","Honeymoon check: flights/hotel confirmed, passports valid, bank travel notice","Both","2026-09-25",""),
  s("VENDORS","Confirm getting-ready room at the Grand Bohemian","Ally","2026-09-15","Bridesmaids arrive 8:30 AM. Confirm check-in time, room size for HMU, and food delivery access."),
  s("VENDORS","Send DJ the do-not-play list, name pronunciations, and intro order","Both","2026-09-15","Use the Music tab's Do Not Play section and the Ceremony tab's wedding party list."),
  s("VENDORS","Confirm string duo setup: spot, shade, power, arrival time","Ally","2026-09-20","Outdoor ceremony at 4:30; strings usually need shade and a flat surface."),
  s("DECOR","Buy welcome party decor","Ally","2026-09-20","Line item on the non-vendor payments list."),
  s("DECOR","Set up a shared photo album + QR sign for guests","Alex","2026-09-18","Google Photos shared album or similar; print a small sign for the bar and the welcome table."),
  s("LOGISTICS","Decide tip amounts per vendor","Both","2026-09-24","Feeds the envelope task on Sept 26. Budgeted at $1,000."),
  s("LOGISTICS","Wedding party gifts + gifts for each other","Both","2026-09-27",""),
  s("LOGISTICS","Write the reception thank-you speech","Alex","2026-09-27","Speeches kick off at 7:00 PM."),
  s("LOGISTICS","Finalize toast order and speaker names, send to DJ","Both","2026-09-29","Who speaks, in what order, roughly how long."),
  s("MUSIC","Hand final playlists to the DJ","Both","2026-09-29","Export from the Music tab: dinner, early dancing, late dancing, do-not-play."),
  s("LOGISTICS","Cold-weather plan for an outdoor October evening","Both","2026-10-05","Heaters, pashminas, or nothing? Average low in Charlotte on Oct 10 is about 52°F. Bar closes at 10:00 PM outdoors."),
  s("LOGISTICS","Assemble the emergency kit","Ally","2026-10-02","Safety pins, fashion tape, stain pen, sewing kit, pain reliever, band-aids, blotting papers, lint roller, phone chargers."),
  s("LOGISTICS","Print vows on cards","Both","2026-10-05","Phones look bad in photos."),
  s("LOGISTICS","Assign someone to film the send-off and first look on a phone","Alex","2026-10-09","Photographer leaves at 8:15 PM; send-off is at 10:30."),
  s("LOGISTICS","Day-after plan: brunch, gift opening, who returns rentals","Both","2026-09-28",""),
  s("LOGISTICS","Name change paperwork (if changing): SSA, DMV, passport, bank","Ally","2026-11-01","Needs a certified copy of the marriage certificate from the Register of Deeds."),
].map((x,i)=>({...x, id:"sug-"+String(i+1).padStart(2,"0"), order:1000+i}));

export const CATEGORIES = ["LOGISTICS","VENDORS","ATTIRE","DECOR","PACKING","MUSIC"];

/* ---------------- budget (Payment Schedule / Total costs) ---------------- */
function p(vendor, amount, due, payer, paid, note){ return {vendor, amount, due: due||null, payer, paid: !!paid, note: note||""}; }
export const PAYMENTS = [
  p("McGill Rose Garden",1985,"2025-09-26","parents",true,"Deposit"),
  p("McGill Rose Garden",4760,"2026-04-10","parents",true,"Payment 2"),
  p("McGill Rose Garden",4755,"2026-09-10","parents",false,"Final payment"),
  p("QC Catering",1500,"2025-10-30","parents",true,"Deposit"),
  p("QC Catering",3500,"2026-06-10","parents",true,"Payment 2"),
  p("QC Catering",3300,"2026-09-10","parents",false,"Final — amount changes with guest count"),
  p("Nectar Florals",1009,"2026-09-10","parents",false,"Full amount"),
  p("Bar (beer & wine)",1800,null,"parents",false,"Date TBD"),
  p("Hannah Wagner Photography",1200,"2025-09-30","parents",true,"Deposit"),
  p("Hannah Wagner Photography",2400,"2026-08-01","us",false,"Final — check whether this went out"),
  p("Mixology DJ",723.5,"2026-01-15","parents",true,"Deposit"),
  p("Mixology DJ",723.5,"2026-09-26","us",false,"Final"),
  p("Makeup Artist",50,"2025-12-20","us",true,"Deposit"),
  p("Makeup Artist",780,"2026-08-09","us",false,"Final — check whether this went out"),
  p("Charlotte String",595,"2026-02-10","us",true,"Deposit"),
  p("Charlotte String",595,"2026-09-25","us",false,"Final"),
  p("Hair Stylist",780,"2026-10-10","us",false,"Day of"),
  p("Transportation — Charlotte LUX",236,"2026-05-05","us",true,"Deposit"),
  p("Transportation — Charlotte LUX",236,"2026-10-10","us",false,"Day of"),
  p("Vendor tips",1000,"2026-10-11","us",false,"Cash envelopes"),
  p("Beauty repayments from the girls",-620,null,"us",false,"Money coming back to you"),
  p("Ally's wedding ring",0,null,"us",false,"Amount TBD"),
  p("Cake",0,null,"us",false,"Amount TBD"),
  p("Welcome party decor",0,null,"us",false,"Amount TBD"),
].map((x,i)=>({...x, id:"pay-"+String(i+1).padStart(2,"0"), order:i}));

/* ---------------- vendors ---------------- */
function v(name, role, contact, arrival, notes){ return {name, role, contact: contact||"", arrival: arrival||"", notes: notes||"", confirmed:false}; }
export const VENDORS = [
  v("McGill Rose Garden","Venue · coordination · tent · tables & chairs","", "", "Charlotte, NC. Fully outdoor. Exclusive food & drink vendors. Walkthrough with planner Sept 10."),
  v("QC Catering","Catering","", "", "Plated dinner. Final count + dietary + vendor meals due Sept 7–11. Late-night food at 9:00 PM."),
  v("Mixology DJ","DJ · reception","", "", "Dinner, speeches, dances, open floor through 10:00 PM bar close."),
  v("Charlotte String","String duo · ceremony + cocktail hour","", "", "Repertoire loaded in the Music tab. Selections due Sept 15."),
  v("Hannah Wagner Photography","Photographer","", "2:00 PM", "Arrives at McGill 2:00 PM, leaves 8:15 PM. Shot list due Sept 8."),
  v("Nectar Florals","Florals","", "", "Meeting Sept 8. Confirm setup time and post-wedding flowers."),
  v("Makeup Artist","Hair & makeup","", "8:45 AM", "At the Grand Bohemian. HMU schedule lives in the Timeline tab."),
  v("Hair Stylist","Hair","", "8:45 AM", "Ally's final hair appointment Sept 25."),
  v("Charlotte LUX","Transportation","", "1:15 PM", "Men to McGill 1:15 PM, ladies 1:45 PM. Confirm plan Sept 23."),
  v("Bar","Beer & wine · ABC permit","", "", "You supply liquor and Italicus Spritz ingredients. Confirm ice, glassware, bartender, who transports."),
  v("Grand Bohemian","Getting-ready hotel","", "8:30 AM", "Bridesmaids arrive 8:30 AM."),
  v("Emily","Officiant (?)","", "", "Vows to Emily for review by Sept 20. Confirm she's the officiant."),
].map((x,i)=>({...x, id:"ven-"+String(i+1).padStart(2,"0"), order:i}));

/* ---------------- day-of timeline ---------------- */
function tl(time, title, who, note){ return {time, title, who: who||"", note: note||""}; }
export const TIMELINE = [
  tl("08:30","Bridesmaids arrive at Grand Bohemian","Ally + girls"),
  tl("08:45","Hair & makeup starts","Ally + girls","Refer to HMU schedule below."),
  tl("13:15","Ally gets into dress","Ally"),
  tl("13:15","Men head to McGill via transportation","Alex + guys","Charlotte LUX"),
  tl("13:30","A few pictures in the dress at the hotel","Ally"),
  tl("13:45","Ladies head to McGill via transportation","Ally + girls","Charlotte LUX"),
  tl("14:00","Photographer arrives at McGill","Hannah"),
  tl("14:30","First look & couple photos","Ally + Alex"),
  tl("15:00","Wedding party & family photos","Everyone in photos"),
  tl("16:00","Guests begin to arrive","", "Strings prelude playing."),
  tl("16:30","Ceremony","Everyone"),
  tl("17:00","Cocktail hour","", "Strings play. Golden hour — sunset ≈ 6:55 PM."),
  tl("18:15","Dinner begins","", "DJ dinner playlist."),
  tl("19:00","Speeches kick off"),
  tl("19:30","First dances","Couple · Alex & Carrie · Ally & Dad"),
  tl("19:45","Dance floor opens"),
  tl("20:00","Private cake cutting","Ally + Alex"),
  tl("20:15","Photographer leaves","Hannah"),
  tl("21:00","Late night food"),
  tl("22:00","Bar closes"),
  tl("22:30","Send off","Everyone","Bubbles."),
].map((x,i)=>({...x, id:"tl-"+String(i+1).padStart(2,"0"), order:i}));

export const HMU_SLOTS = [];  // hair/makeup schedule, filled in on the site

/* ---------------- ceremony & roles ---------------- */
export const ROLES = [
  {role:"Officiant", person:"Emily (confirm)", notes:"Vows to review by Sept 20."},
  {role:"Holds the rings", person:"", notes:"Decide when rings are picked up Sept 26."},
  {role:"Holds the marriage license", person:"", notes:"Signed after the ceremony; who returns it to the Register of Deeds?"},
  {role:"Hands out vendor tips", person:"", notes:"Envelopes prepared Sept 26."},
  {role:"Bustle helpers (1–2)", person:"", notes:"Practice + record instructions Sept 26."},
  {role:"Ally's phone & purse", person:"", notes:""},
  {role:"Emergency kit keeper", person:"", notes:""},
  {role:"Collects cards & gifts", person:"", notes:"Card box → safe place → home."},
  {role:"Leftover alcohol & decor breakdown", person:"", notes:""},
  {role:"Films the send-off", person:"", notes:"Photographer leaves at 8:15 PM."},
  {role:"Rain / cold call with venue", person:"", notes:"Decision timing agreed Oct 5."},
].map((x,i)=>({...x, id:"role-"+String(i+1).padStart(2,"0"), order:i}));

export const PROCESSIONAL = [
  {step:"Officiant + Alex take their places", who:"", music:""},
  {step:"Grandparents seated", who:"", music:""},
  {step:"Parents of the groom", who:"", music:""},
  {step:"Mother of the bride", who:"", music:""},
  {step:"Wedding party", who:"", music:""},
  {step:"Ring holder", who:"", music:""},
  {step:"Ally + Dad", who:"", music:"Bride's entrance"},
  {step:"Ceremony (readings, vows, rings, kiss)", who:"", music:""},
  {step:"Recessional — Ally + Alex, then wedding party", who:"", music:"Recessional"},
].map((x,i)=>({...x, id:"proc-"+String(i+1).padStart(2,"0"), order:i}));

export const EVENT_FLOW = [
  {step:"Grand entrance", who:"Wedding party, then Ally + Alex", keep:true},
  {step:"Welcome / blessing", who:"", keep:true},
  {step:"Dinner", who:"", keep:true},
  {step:"Toasts", who:"", keep:true},
  {step:"First dance", who:"Ally + Alex", keep:true},
  {step:"Alex + Carrie dance", who:"", keep:true},
  {step:"Ally + Dad dance", who:"", keep:true},
  {step:"Dance floor opens", who:"", keep:true},
  {step:"Private cake cutting", who:"Ally + Alex", keep:true},
  {step:"Bouquet toss", who:"", keep:false},
  {step:"Garter", who:"", keep:false},
  {step:"Anniversary dance", who:"", keep:false},
  {step:"Last dance", who:"Everyone", keep:true},
  {step:"Send off with bubbles", who:"Everyone", keep:true},
].map((x,i)=>({...x, id:"flow-"+String(i+1).padStart(2,"0"), order:i}));

/* Wedding party — best guess from who is at the head table. Edit freely. */
export const PARTY = [
  {side:"Ally", name:"Emily", role:"", pron:""},
  {side:"Ally", name:"MG", role:"", pron:""},
  {side:"Ally", name:"Katie", role:"", pron:""},
  {side:"Ally", name:"Caroline", role:"", pron:""},
  {side:"Ally", name:"Delaney", role:"", pron:""},
  {side:"Ally", name:"Emily Johnson", role:"", pron:""},
  {side:"Ally", name:"Ellie", role:"", pron:""},
  {side:"Ally", name:"Faye", role:"", pron:""},
  {side:"Alex", name:"Evan", role:"", pron:""},
  {side:"Alex", name:"Ted", role:"", pron:""},
  {side:"Alex", name:"Ty", role:"", pron:""},
  {side:"Alex", name:"Jake", role:"", pron:""},
  {side:"Alex", name:"Tommy", role:"", pron:""},
  {side:"Alex", name:"Kevin", role:"", pron:""},
  {side:"Alex", name:"Matt", role:"", pron:""},
  {side:"Alex", name:"Salomey", role:"", pron:""},
].map((x,i)=>({...x, id:"party-"+String(i+1).padStart(2,"0"), order:i}));

/* ---------------- music ---------------- */
export const MUSIC_SECTIONS = [
  {id:"ceremony", title:"Ceremony", by:"Charlotte String", source:"repertoire", time:"4:00–5:00 PM",
   slots:[
     {id:"prelude", label:"Prelude (guests arriving, ~30 min)", multi:true},
     {id:"processional", label:"Processional (wedding party)"},
     {id:"bride", label:"Bride's entrance"},
     {id:"unity", label:"Signing / unity moment (optional)"},
     {id:"recessional", label:"Recessional"},
   ]},
  {id:"cocktail", title:"Cocktail Hour", by:"Charlotte String", source:"repertoire", time:"5:00–6:15 PM",
   slots:[{id:"cocktail-list", label:"Set list (aim for 15–18 songs)", multi:true}]},
  {id:"dinner", title:"Dinner", by:"Mixology DJ", source:"catalog", time:"6:15–7:30 PM",
   slots:[
     {id:"entrance", label:"Grand entrance"},
     {id:"dinner-list", label:"Dinner playlist (background, ~20 songs)", multi:true},
   ]},
  {id:"early", title:"Early Dancing", by:"Mixology DJ", source:"catalog", time:"7:30–9:00 PM",
   slots:[
     {id:"first-dance", label:"First dance"},
     {id:"alex-carrie", label:"Alex & Carrie"},
     {id:"ally-dad", label:"Ally & Dad"},
     {id:"cake", label:"Cake cutting"},
     {id:"early-list", label:"Open the floor (all ages)", multi:true},
   ]},
  {id:"late", title:"Late Dancing", by:"Mixology DJ", source:"catalog", time:"9:00–10:30 PM",
   slots:[
     {id:"late-list", label:"Late night (friends)", multi:true},
     {id:"last-dance", label:"Last dance"},
     {id:"sendoff", label:"Send-off song"},
   ]},
  {id:"dnp", title:"Do Not Play", by:"Mixology DJ", source:"catalog", time:"",
   slots:[{id:"dnp-list", label:"Never, under any circumstances", multi:true}]},
];

/* Seeded suggestions so you react instead of brainstorm. status "suggested" until you pick one. */
function m(slot, title, artist, source){ return {slot, title, artist, source: source||"repertoire", status:"suggested"}; }
export const MUSIC_SEED = [
  m("prelude","Air on the G String (Air)","J. S. Bach"), m("prelude","Salut d'Amour","Elgar"), m("prelude","Jesu, Joy Of Man's Desiring","J. S. Bach"),
  m("prelude","Gymnopedie #1","Satie"), m("prelude","Butterfly Waltz","Brian Crain"), m("prelude","Here Comes The Sun","Beatles"),
  m("processional","Canon in D","Pachelbel"), m("processional","A Thousand Years","Christina Perri (Twilight)"), m("processional","Married Life","Giacchino (Up)"),
  m("processional","Perfect","Ed Sheeran"), m("processional","Turning Page","Sleeping At Last (Twilight)"),
  m("bride","Bridal Chorus (Here Comes The Bride)","Wagner"), m("bride","Can't Help Falling In Love","Elvis"), m("bride","All Of Me","John Legend"),
  m("bride","At Last","Etta James"), m("bride","Invisible String","Taylor Swift"), m("bride","A River Flows In You","Yiruma"),
  m("unity","Ave Maria","Schubert"), m("unity","Make You Feel My Love","Bob Dylan (as sung by Adele)"), m("unity","Best Part","H. E. R."),
  m("recessional","Signed, Sealed, Delivered","Stevie Wonder"), m("recessional","Best Day Of My Life","American Authors"), m("recessional","Marry You","Bruno Mars"),
  m("recessional","Viva La Vida","Coldplay"), m("recessional","Wedding March","Mendelssohn"), m("recessional","Dancing Queen","ABBA"),
  m("cocktail-list","Lover","Taylor Swift"), m("cocktail-list","Yellow","Coldplay (Bridgerton)"), m("cocktail-list","Thinking Out Loud","Ed Sheeran"),
  m("cocktail-list","Wildest Dreams","Taylor Swift"), m("cocktail-list","Mr. Brightside","The Killers"), m("cocktail-list","Cruel Summer","Taylor Swift"),
  m("cocktail-list","La Vie En Rose","Louiguy/Piaf"), m("cocktail-list","Come Away With Me","Norah Jones"), m("cocktail-list","Carolina In My Mind","James Taylor"),
  m("cocktail-list","Sway","Michael Bublé"), m("cocktail-list","Just The Way You Are","Bruno Mars"), m("cocktail-list","Something","Beatles"),
  m("entrance","Crazy In Love","Beyoncé","catalog"), m("entrance","September","Earth, Wind & Fire","catalog"), m("entrance","Can't Stop The Feeling!","Justin Timberlake","catalog"),
  m("first-dance","Lover","Taylor Swift","catalog"), m("first-dance","Die With A Smile","Lady Gaga & Bruno Mars","catalog"), m("first-dance","Perfect","Ed Sheeran","catalog"),
  m("first-dance","First Day Of My Life","Bright Eyes","catalog"), m("first-dance","Golden","Harry Styles","catalog"),
  m("alex-carrie","My Wish","Rascal Flatts","catalog"), m("alex-carrie","What A Wonderful World","Louis Armstrong","catalog"), m("alex-carrie","Forever Young","Rod Stewart","catalog"), m("alex-carrie","Simple Man","Lynyrd Skynyrd","catalog"),
  m("ally-dad","My Girl","The Temptations","catalog"), m("ally-dad","Landslide","Fleetwood Mac","catalog"), m("ally-dad","Isn't She Lovely","Stevie Wonder","catalog"), m("ally-dad","Daughters","John Mayer","catalog"),
  m("cake","How Sweet It Is (To Be Loved By You)","James Taylor","catalog"), m("cake","Sugar","Maroon 5","catalog"), m("cake","Pour Some Sugar On Me","Def Leppard","catalog"),
  m("last-dance","Don't Stop Believin'","Journey","catalog"), m("last-dance","Piano Man","Billy Joel","catalog"), m("last-dance","All You Need Is Love","The Beatles","catalog"), m("last-dance","Closing Time","Semisonic","catalog"),
  m("sendoff","Home","Edward Sharpe & The Magnetic Zeros","catalog"), m("sendoff","I Gotta Feeling","Black Eyed Peas","catalog"), m("sendoff","Sweet Caroline","Neil Diamond","catalog"),
].map((x,i)=>({...x, id:"song-"+String(i+1).padStart(3,"0"), order:i}));
