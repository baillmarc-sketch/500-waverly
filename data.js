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
    areas: [
      { kind: "indoor",  poly: [[58,64],[470,64],[470,398],[150,398],[18,300],[40,150]],
        label: "Living / Dining", dim: "25'2\" × 17'6\"", lx: 160, ly: 150 },
      { kind: "outdoor", poly: [[130,4],[426,4],[426,64],[130,64]],
        label: "Balcony", dim: "24'8\" × 5'0\"", lx: 278, ly: 26 },
    ],
    walls: [
      // primary bedroom box
      [322,64,322,196],[322,196,470,196],
      // the angled wall by the stairs (faces the living room)
      [322,196,300,210],
      // WIC
      [300,210,300,330],[300,210,346,210],[300,330,346,330],
      // bedroom closet (CL)
      [405,196,405,228],[405,228,470,228],
      // en-suite bath
      [346,228,470,228],[346,228,346,330],[346,330,470,330],
      // stair shaft
      [250,300,250,392],[250,300,300,300],
      // kitchen
      [150,300,250,300],[150,300,150,398],
      // west service block: guest bath + W/D + CL
      [150,150,150,398],[40,250,150,250],[95,250,95,398],
    ],
    windows: [
      [130,64,300,64],   // living glass / balcony doors
      [322,64,420,64],   // bedroom glass / balcony door
    ],
    doors: [
      { x:150, y:398, r:34, a0:180, a1:270 },  // entry
      { x:322, y:110, r:28, a0:0,   a1:90  },  // bedroom
    ],
    fixtures: [
      { kind:"stairs",   x:250, y:300, w:50,  h:92, dir:"up", label:"UP" },
      { kind:"island",   x:160, y:312, w:78,  h:38 },
      { kind:"counter",  x:150, y:380, w:100, h:18 },
      { kind:"appliance",x:150, y:381, w:24,  h:16, label:"R" },
      { kind:"appliance",x:224, y:381, w:24,  h:16, label:"MW" },
      { kind:"tub",      x:44,  y:156, w:52,  h:30 },
      { kind:"wd",       x:50,  y:320, w:42,  h:42, label:"W/D" },
      { kind:"shower",   x:428, y:282, w:40,  h:46 },
      { kind:"toilet",   x:368, y:300 },
      { kind:"vanity",   x:348, y:238, w:60,  h:16 },
    ],
    labels: [
      { text:"Primary Bedroom", sub:"11'8\" × 11'0\"", x:396, y:118 },
      { text:"Kitchen",         sub:"9'10\" × 8'2\"",  x:195, y:345 },
      { text:"WIC",             sub:"",                x:322, y:272 },
      { text:"CL",              sub:"",                x:437, y:212 },
      { text:"Bath",            sub:"",                x:402, y:258 },
      { text:"Bath",            sub:"",                x:95,  y:195 },
      { text:"W/D",             sub:"",                x:70,  y:355 },
      { text:"CL",              sub:"",                x:122, y:355 },
      { text:"Entry",           sub:"",                x:95,  y:305 },
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
    doors: [],
    fixtures: [
      { kind:"stairs",   x:298, y:352, w:64, h:104, dir:"down", label:"DN" },
      { kind:"planters", x:70,  y:46,  w:160, h:18 },
      { kind:"planters", x:280, y:46,  w:150, h:18 },
      { kind:"planters", x:418, y:140, w:18,  h:130 },
    ],
    labels: [
      { text:"Landing / Office", sub:"covered", x:330, y:340 },
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
    p("rug_6x9",     396, 150),
    p("bed_queen",   396, 156, 180),
    p("nightstand",  352, 178, 180),
    p("nightstand",  440, 178, 180),
    p("dresser",     458, 100, 90),
  ],
  wic: [
    p("wic_shelf",   322, 238, 90),
    p("wic_shelf",   322, 295, 90),
  ],
  dining: [
    p("rug_5x8",     195, 248),
    p("dining6",     195, 248),
    p("dining_chair",167, 228, 180), p("dining_chair",195, 228, 180), p("dining_chair",223, 228, 180),
    p("dining_chair",167, 268),      p("dining_chair",195, 268),      p("dining_chair",223, 268),
  ],
  stools: [
    p("bar_stool",   175, 300), p("bar_stool", 200, 300), p("bar_stool", 225, 300),
  ],
  balcony: [
    p("out_coffee",  190, 30),
    p("out_chair",   162, 30,  90),
    p("out_chair",   218, 30, -90),
  ],
  livingSectional: [
    p("rug_8x10",    205, 150),
    p("sectional",   210, 150, 180),
    p("coffee_table",288, 150),
    p("console_tv",  314, 150, 90),
    p("armchair",    110, 110, -30),
    p("bookshelf",   314, 100, 90),
    p("bookshelf",    80,  72),
    p("bookshelf",   116,  72),
    p("plant",       300, 182),
  ],
  livingTwoSofa: [
    p("rug_8x10",    200, 150),
    p("sofa3",       170, 115),
    p("loveseat",    255, 160, -90),
    p("coffee_table",200, 150),
    p("armchair",    110, 160, 20),
    p("console_tv",  314, 150, 90),
    p("bookshelf",   314, 100, 90),
    p("bookshelf",    80,  72),
    p("bookshelf",   116,  72),
    p("plant",       300, 182),
  ],
  guestRoom2BR: [
    p("rug_6x9",     205, 116),
    p("bed_queen",   205, 118),
    p("nightstand",  165, 80),
    p("nightstand",  245, 80),
    p("dresser",     292, 150, 90),
    p("wardrobe",    170, 168),
    p("wardrobe",    218, 168),
  ],
  livingReduced2BR: [
    p("loveseat",    250, 215, 180),
    p("armchair",    300, 255, -35),
    p("coffee_table",250, 250),
    p("console_tv",  314, 230, 90),
    p("plant",       300, 200),
  ],
  diningReduced2BR: [
    p("rug_round",   185, 295),
    p("dining_round",185, 295),
    p("dining_chair",185, 268, 180), p("dining_chair",157, 295, 90), p("dining_chair",213, 295, -90),
  ],
  roof: [
    p("desk",        200, 380, 90),
    p("office_chair",236, 380),
    p("bookshelf",   175, 360),
    p("rug_round",   150, 150),
    p("dining_round",150, 150),
    p("out_chair",   108, 150,  90), p("out_chair", 192, 150, -90),
    p("out_chair",   150, 108, 180), p("out_chair", 150, 192),
    p("out_lounge",  235, 250, 22),
    p("out_lounge",  300, 268, 22),
    p("out_dining",  360, 150),
    p("out_chair",   322, 138,  90), p("out_chair", 398, 138, -90),
    p("out_chair",   360, 110, 180), p("out_chair", 360, 190),
    p("grill",       398, 300),
    p("plant",        60, 300),
    p("planter",     420, 320),
  ],
};

/* =================== PRESETS =================== */
window.PRESETS = {
  suggested: {
    name: "Sectional",
    desc: "Open 1-bed — big L-sectional, TV wall, books, dining for 6.",
    main: [ ...C.bedroom, ...C.wic, ...C.livingSectional, ...C.dining, ...C.stools, ...C.balcony ],
    roof: [ ...C.roof ],
  },
  twoSofa: {
    name: "Two Sofas",
    desc: "Open 1-bed — sofa + loveseat; easier to rearrange for parties.",
    main: [ ...C.bedroom, ...C.wic, ...C.livingTwoSofa, ...C.dining, ...C.stools, ...C.balcony ],
    roof: [ ...C.roof ],
  },
  twoBed: {
    name: "Convert-back 2-Bed",
    desc: "Second bedroom carved from the living room (the original 2BR config).",
    main: [ ...C.bedroom, ...C.wic, ...C.guestRoom2BR, ...C.livingReduced2BR, ...C.diningReduced2BR, ...C.stools, ...C.balcony ],
    roof: [ ...C.roof ],
  },
};
window.PRESET_ORDER = ["suggested", "twoSofa", "twoBed"];

/* the seed layout used on first load / reset */
window.DEFAULT_LAYOUT = { main: window.PRESETS.suggested.main, roof: window.PRESETS.suggested.roof };
