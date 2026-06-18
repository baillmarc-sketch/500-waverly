/* ============================================================================
   500 Waverly Ave — Penthouse 4  ·  Floor plan + furniture data
   ----------------------------------------------------------------------------
   ALL UNITS ARE INCHES. Origin top-left, x→east, y→south (north is up).
   Geometry traced from the published listing floor plan — the angled west
   wall, the diagonal stair wall, the balcony, and the bath/closet cluster all
   mirror the real unit. Labeled room dimensions come straight from the plan.
   Fine-tune any number here against your tape measure once you have the keys.
   ============================================================================ */

const p = (type, x, y, rot = 0) => ({ type, x, y, rot });   // center x,y in inches

/* =================== FLOORS =================== */
window.FLOORPLAN = {
  /* -------------------------------------------------- LOWER / MAIN LEVEL */
  main: {
    label: "Main Level",
    // Traced 1:1 from the listing plan (~1.40 px/in). Interior is ~469" (39') wide,
    // origin offset (40,70); north wall y=70, south ~y=417, east wall x=509.
    areas: [
      { kind: "indoor",  poly: [[40,70],[509,70],[509,340],[416,340],[416,417],[200,430],[40,265]],
        label: "Living / Dining", dim: "25'2\" × 17'6\"", lx: 215, ly: 150 },
      { kind: "outdoor", poly: [[193,4],[489,4],[489,70],[193,70]],
        label: "Balcony", dim: "24'8\" × 5'0\"", lx: 360, ly: 30 },
    ],
    walls: [
      // primary bedroom box
      [368,70,368,205],[368,205,509,205],
      // angled wall by the stairs — the bedroom door opens here
      [368,205,345,217],
      // WIC
      [345,217,345,346],[345,217,391,217],[345,346,391,346],
      // bedroom closet (CL)
      [451,205,451,242],[451,242,509,242],
      // en-suite bath
      [391,242,509,242],[391,242,391,346],[391,346,509,346],
      // stair shaft
      [299,315,299,411],[299,315,347,315],
      // kitchen — open-plan to the Living/Dining (no north wall); island faces in
      [205,315,205,420],    // kitchen west wall (entrance lane beyond)
      // west cluster: bathroom (left) + stacked CL-over-W/D closets, with the
      // ENTRANCE LANE (open foyer) running between the closet column and kitchen
      [40,210,165,210],     // cluster north wall (Living/Dining above)
      [110,210,110,337],    // bath / closet-column divider
      [165,210,165,394],    // closet-column east wall (entry lane beyond)
      [110,300,165,300],    // CL (upper) over W/D (lower)
    ],
    windows: [
      [200,70,345,70],   // living glass / balcony doors
      [368,70,470,70],   // bedroom glass / balcony door
    ],
    doors: [
      { x:188, y:418, r:30, a0:170, a1:262, gap:[178,407,198,429] },           // entry
      { x:366, y:206, r:28, a0:268, a1:358, gap:[368,205,345,217] },            // bedroom (angled wall)
      { x:391, y:280, r:26, a0:268, a1:358, gap:[391,250,391,280] },            // en-suite bath (from WIC)
      { x:380, y:217, r:24, a0:92,  a1:182, gap:[350,217,380,217] },            // WIC (from bedroom zone)
      { x:462, y:205, r:24, a0:2,   a1:92,  gap:[460,205,492,205] },            // bedroom CL
      { x:88,  y:210, r:24, a0:92,  a1:182, gap:[60,210,90,210] },              // guest bath (from living)
      { x:165, y:248, r:22, a0:180, a1:270, gap:[165,220,165,248] },            // west CL (from lane)
      { x:165, y:344, r:22, a0:180, a1:270, gap:[165,316,165,344] },            // W/D closet (from lane)
    ],
    fixtures: [
      { kind:"stairs",   x:299, y:315, w:48,  h:96, dir:"up", label:"UP" },
      { kind:"island",   x:214, y:330, w:76,  h:40 },
      { kind:"counter",  x:204, y:399, w:95,  h:18 },
      { kind:"appliance",x:205, y:400, w:23,  h:16, label:"R" },   // fridge
      { kind:"appliance",x:239, y:400, w:26,  h:16, label:"" },    // cooktop
      { kind:"appliance",x:276, y:400, w:23,  h:16, label:"MW" },  // microwave
      // guest bathroom (far left)
      { kind:"tub",      x:44,  y:220, w:30,  h:58 },              // tub along the west wall
      { kind:"vanity",   x:70,  y:226, w:34,  h:13 },
      { kind:"toilet",   x:90,  y:276 },
      // stacked W/D in the lower closet box
      { kind:"wd",       x:120, y:304, w:34,  h:40, label:"" },
      // en-suite bath: shower in the SW, vanity along the north wall, toilet on the east
      { kind:"shower",   x:395, y:296, w:42,  h:48 },
      { kind:"vanity",   x:444, y:246, w:62,  h:16 },
      { kind:"toilet",   x:487, y:300 },
    ],
    labels: [
      { text:"Primary Bedroom", sub:"11'8\" × 11'0\"", x:438, y:130 },
      { text:"Kitchen",         sub:"9'10\" × 8'2\"",  x:250, y:360 },
      { text:"WIC",             sub:"",                x:368, y:278 },
      { text:"CL",              sub:"",                x:480, y:223 },
      { text:"Bath",            sub:"",                x:450, y:300 },
      { text:"Bath",            sub:"",                x:72,  y:250 },
      { text:"CL",              sub:"",                x:137, y:255 },
      { text:"W/D",             sub:"",                x:137, y:322 },
      { text:"Entry",           sub:"",                x:185, y:404 },
    ],
  },

  /* -------------------------------------------------- UPPER / ROOF LEVEL */
  roof: {
    label: "Roof Deck",
    areas: [
      { kind: "outdoor", poly: [[20,40],[440,40],[440,470],[120,470],[20,360]],
        label: "Terrace", dim: "33'6\" × 25'3\"", lx: 200, ly: 175 },
      { kind: "indoor",  poly: [[250,320],[410,320],[410,470],[250,470]],
        label: "", dim: "", lx: 330, ly: 360 },
    ],
    walls: [
      [250,320,410,320],[250,320,250,470],[410,320,410,470],
    ],
    windows: [],
    doors: [
      { x:290, y:320, r:26, a0:92, a1:182, gap:[256,320,290,320] },  // terrace door off the landing
    ],
    fixtures: [
      { kind:"stairs",   x:298, y:352, w:64, h:104, dir:"down", label:"DN" },
      { kind:"planters", x:70,  y:46,  w:160, h:18 },
      { kind:"planters", x:280, y:46,  w:150, h:18 },
      { kind:"planters", x:418, y:140, w:18,  h:130 },
    ],
    labels: [
      { text:"Landing", sub:"stair down", x:372, y:400 },
    ],
  },
};

/* =================== FURNITURE CATALOG ===================
   render = how it's drawn · w,h inches · solid:false = rug/decor (no overlap flag)
*/
window.CATALOG = {
  /* Bedroom */
  bed_queen:    { name:"Queen Bed",        cat:"Bedroom", w:60,  h:80,  fill:"#dcc8aa", render:"bed" },
  bed_king:     { name:"King Bed",         cat:"Bedroom", w:76,  h:80,  fill:"#dcc8aa", render:"bed" },
  nightstand:   { name:"Nightstand",       cat:"Bedroom", w:22,  h:16,  fill:"#a9805a", render:"box" },
  dresser:      { name:"Dresser",          cat:"Bedroom", w:60,  h:20,  fill:"#a9805a", render:"drawers" },
  wardrobe:     { name:"Wardrobe",         cat:"Bedroom", w:48,  h:24,  fill:"#9c7b57", render:"drawers" },

  /* Living */
  sectional:    { name:"Sectional (L)",    cat:"Living",  w:112, h:84,  fill:"#8c9a93", render:"sectional" },
  sofa3:        { name:"3-Seat Sofa",      cat:"Living",  w:84,  h:38,  fill:"#8c9a93", render:"sofa" },
  loveseat:     { name:"Loveseat",         cat:"Living",  w:60,  h:35,  fill:"#8c9a93", render:"sofa" },
  armchair:     { name:"Accent Chair",     cat:"Living",  w:32,  h:32,  fill:"#b08968", render:"armchair" },
  coffee_table: { name:"Coffee Table",     cat:"Living",  w:48,  h:24,  fill:"#7a5c3e", render:"box" },
  side_table:   { name:"Side Table",       cat:"Living",  w:20,  h:20,  fill:"#7a5c3e", render:"round" },
  console_tv:   { name:"Media + TV",       cat:"Living",  w:64,  h:16,  fill:"#5f4634", render:"media" },
  bookshelf:    { name:"Bookshelf",        cat:"Living",  w:36,  h:12,  fill:"#94714c", render:"shelf" },

  /* Dining */
  dining6:      { name:"Dining Table (6)", cat:"Dining",  w:72,  h:38,  fill:"#8a6240", render:"table" },
  dining8:      { name:"Dining Table (8)", cat:"Dining",  w:96,  h:40,  fill:"#8a6240", render:"table" },
  dining_round: { name:"Round Table",      cat:"Dining",  w:54,  h:54,  fill:"#8a6240", render:"round" },
  dining_chair: { name:"Dining Chair",     cat:"Dining",  w:18,  h:20,  fill:"#6b7280", render:"chair" },
  bar_stool:    { name:"Bar Stool",        cat:"Dining",  w:16,  h:16,  fill:"#6b7280", render:"round" },

  /* Office / Storage */
  desk:         { name:"Desk",             cat:"Office",  w:48,  h:24,  fill:"#9c7b57", render:"box" },
  office_chair: { name:"Rolling Chair",    cat:"Office",  w:24,  h:24,  fill:"#3f4756", render:"round" },
  wic_shelf:    { name:"Closet Shelving",  cat:"Storage", w:30,  h:14,  fill:"#b8a88f", render:"shelf" },
  wic_island:   { name:"Closet Island",    cat:"Storage", w:40,  h:22,  fill:"#bba98c", render:"drawers" },

  /* Outdoor */
  out_sofa:     { name:"Outdoor Sofa",     cat:"Outdoor", w:78,  h:34,  fill:"#7d8a76", render:"sofa" },
  out_chair:    { name:"Outdoor Chair",    cat:"Outdoor", w:28,  h:28,  fill:"#7d8a76", render:"armchair" },
  out_lounge:   { name:"Chaise Lounge",    cat:"Outdoor", w:28,  h:74,  fill:"#7d8a76", render:"box" },
  out_dining:   { name:"Outdoor Dining",   cat:"Outdoor", w:60,  h:36,  fill:"#8a7a5c", render:"table" },
  out_coffee:   { name:"Outdoor Coffee",   cat:"Outdoor", w:40,  h:22,  fill:"#8a7a5c", render:"box" },
  grill:        { name:"Grill",            cat:"Outdoor", w:30,  h:24,  fill:"#3f4756", render:"box" },

  /* Decor */
  rug_8x10:     { name:"Rug 8×10",         cat:"Decor",   w:96,  h:120, fill:"#d9cfc0", render:"rug",     solid:false },
  rug_6x9:      { name:"Rug 6×9",          cat:"Decor",   w:72,  h:108, fill:"#d9cfc0", render:"rug",     solid:false },
  rug_5x8:      { name:"Rug 5×8",          cat:"Decor",   w:60,  h:96,  fill:"#d9cfc0", render:"rug",     solid:false },
  rug_round:    { name:"Round Rug",        cat:"Decor",   w:84,  h:84,  fill:"#d9cfc0", render:"ruground",solid:false },
  plant:        { name:"Plant",            cat:"Decor",   w:18,  h:18,  fill:"#5b8a5b", render:"plant",   solid:false },
  planter:      { name:"Planter",          cat:"Decor",   w:22,  h:22,  fill:"#6b8e5a", render:"plant",   solid:false },
};

/* =================== LAYOUT BUILDING BLOCKS =================== */
const C = {
  bedroom: [
    // Feng Shui "command position": headboard on the solid east wall, diagonal
    // from the SW door, door visible but not in its direct path.
    p("rug_6x9",     458, 130),
    p("bed_queen",   467, 130, 90),
    p("nightstand",  498, 86,  90),
    p("nightstand",  498, 174, 90),
    p("dresser",     379, 116, 90),
  ],
  wic: [
    p("wic_shelf",   368, 245, 90),
    p("wic_shelf",   368, 300, 90),
  ],
  dining: [
    p("rug_5x8",     262, 258),
    p("dining6",     262, 258),
    p("dining_chair",234, 238, 180), p("dining_chair",262, 238, 180), p("dining_chair",290, 238, 180),
    p("dining_chair",234, 278),      p("dining_chair",262, 278),      p("dining_chair",290, 278),
  ],
  stools: [
    p("bar_stool",   224, 318), p("bar_stool", 251, 318), p("bar_stool", 278, 318),
  ],
  balcony: [
    p("out_coffee",  250, 36),
    p("out_chair",   210, 36,  90),
    p("out_chair",   290, 36, -90),
  ],
  livingSectional: [
    p("rug_8x10",    235, 162),
    p("sectional",   240, 162, 180),
    p("coffee_table",322, 162),
    p("console_tv",  360, 130, 90),     // TV on the bedroom wall, above the door
    p("armchair",    118, 120, -30),
    p("bookshelf",    96,  78),         // book wall on the solid NW wall
    p("bookshelf",   134,  78),
    p("bookshelf",   172,  78),
    p("plant",       338, 196),
  ],
  livingTwoSofa: [
    p("rug_8x10",    235, 162),
    p("sofa3",       205, 124),
    p("loveseat",    300, 172, -90),
    p("coffee_table",245, 162),
    p("armchair",    120, 178, 20),
    p("console_tv",  360, 130, 90),
    p("bookshelf",    96,  78),
    p("bookshelf",   134,  78),
    p("bookshelf",   172,  78),
    p("plant",       338, 196),
  ],
  livingFacing: [
    p("rug_8x10",    240, 162),
    p("sofa3",       240, 116),         // north sofa, faces in
    p("loveseat",    240, 210, 180),    // south sofa, faces in
    p("coffee_table",240, 162),
    p("armchair",    158, 162, 90),     // end chair toward the TV
    p("console_tv",  360, 130, 90),
    p("bookshelf",    96,  78),
    p("bookshelf",   134,  78),
    p("bookshelf",   172,  78),
    p("plant",       338, 196),
  ],
  livingReading: [
    p("rug_8x10",    245, 162),
    p("sofa3",       180, 162, 270),    // faces east toward the TV
    p("armchair",    278, 122, 200),
    p("armchair",    278, 202, 160),
    p("coffee_table",252, 162),
    p("console_tv",  360, 130, 90),
    p("bookshelf",    70,  78),         // a wall of books on the NW wall
    p("bookshelf",   106,  78),
    p("bookshelf",   142,  78),
    p("bookshelf",   178,  78),
    p("plant",       330, 118),
  ],
  livingEntertainer: [
    p("rug_8x10",    245, 168),
    p("sectional",   245, 162, 180),
    p("armchair",    118, 120, -30),
    p("armchair",    323, 200, -90),
    p("coffee_table",325, 162),
    p("console_tv",  360, 130, 90),
    p("bookshelf",   110,  78),
    p("plant",       338, 118),
  ],
  diningLarge: [
    p("rug_6x9",     258, 258, 90),
    p("dining8",     258, 258),
    p("dining_chair",228, 236, 180), p("dining_chair",258, 236, 180), p("dining_chair",288, 236, 180),
    p("dining_chair",228, 280),      p("dining_chair",258, 280),      p("dining_chair",288, 280),
    p("dining_chair",210, 258, 90),  p("dining_chair",306, 258, -90),
  ],
  roof: [
    // office on the deck right beside the terrace door (back to the bulkhead, facing the view)
    p("desk",        320, 306),
    p("office_chair",320, 282),
    p("bookshelf",   366, 306),
    // lounge conversation (NW)
    p("rug_round",   150, 150),
    p("dining_round",150, 150),
    p("out_chair",   108, 150,  90), p("out_chair", 192, 150, -90),
    p("out_chair",   150, 108, 180), p("out_chair", 150, 192),
    // sun loungers (W)
    p("out_lounge",  175, 250, 10),
    p("out_lounge",  175, 330, 10),
    // dining (NE)
    p("out_dining",  370, 150),
    p("out_chair",   322, 150,  90), p("out_chair", 418, 150, -90),
    p("out_chair",   370, 104, 180), p("out_chair", 370, 196),
    // grill + greenery
    p("grill",       110, 320),
    p("plant",        60, 250),
    p("planter",     420, 360),
  ],
};

/* =================== PRESETS =================== */
const oneBed = (living, dining=C.dining) =>
  [ ...C.bedroom, ...C.wic, ...living, ...dining, ...C.stools, ...C.balcony ];

window.PRESETS = {
  suggested: {
    name: "Sectional",
    desc: "Big L-sectional facing the TV wall — the cozy default.",
    main: oneBed(C.livingSectional), roof: [ ...C.roof ],
  },
  twoSofa: {
    name: "L-Sofas",
    desc: "Sofa + loveseat in an L — flexible, easy to rearrange for parties.",
    main: oneBed(C.livingTwoSofa), roof: [ ...C.roof ],
  },
  facing: {
    name: "Facing Sofas",
    desc: "Two sofas across a coffee table — conversation-first, great for hosting.",
    main: oneBed(C.livingFacing), roof: [ ...C.roof ],
  },
  reading: {
    name: "Reading Lounge",
    desc: "Sofa + two armchairs + a wall of books — leans into the book collection.",
    main: oneBed(C.livingReading), roof: [ ...C.roof ],
  },
  entertainer: {
    name: "Entertainer",
    desc: "Sectional, extra lounge chairs and a table for 8 — built for dinners.",
    main: oneBed(C.livingEntertainer, C.diningLarge), roof: [ ...C.roof ],
  },
};
window.PRESET_ORDER = ["suggested", "twoSofa", "facing", "reading", "entertainer"];

/* the seed layout used on first load / reset */
window.DEFAULT_LAYOUT = { main: window.PRESETS.suggested.main, roof: window.PRESETS.suggested.roof };
