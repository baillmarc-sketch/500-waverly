/* ============================================================================
   500 Waverly Ave — Penthouse 4  ·  Floor plan + furniture data
   ----------------------------------------------------------------------------
   ALL UNITS ARE INCHES. Origin top-left, x→east, y→south (north is up).
   Geometry traced from the published listing floor plan. Labeled room
   dimensions are taken straight from the plan; the surrounding wall geometry
   is a close approximation — fine-tune the numbers here against your tape
   measure once you have the keys.
   ============================================================================ */

const p = (type, x, y, rot = 0) => ({ type, x, y, rot });   // center x,y in inches

/* =================== FLOORS =================== */
window.FLOORPLAN = {
  /* -------------------------------------------------- LOWER / MAIN LEVEL */
  main: {
    label: "Main Level",
    areas: [
      { kind: "indoor",  poly: [[40,60],[470,60],[470,398],[150,398],[20,300]],
        label: "Living / Dining", dim: "25'2\" × 17'6\"", lx: 165, ly: 155 },
      { kind: "outdoor", poly: [[130,0],[426,0],[426,60],[130,60]],
        label: "Balcony", dim: "24'8\" × 5'0\"", lx: 278, ly: 24 },
    ],
    walls: [
      // primary bedroom box
      [330,60,330,192],[330,192,470,192],
      // bedroom closet (CL)
      [405,192,405,225],
      // en-suite bath
      [346,225,470,225],[346,225,346,330],[346,330,470,330],
      // WIC
      [300,210,346,210],[300,210,300,330],[300,330,346,330],
      // stair shaft
      [252,300,252,392],[252,300,300,300],
      // kitchen
      [150,300,252,300],[150,300,150,398],
      // west service block: guest bath + W/D + CL
      [150,210,150,300],[40,210,150,210],[40,300,150,300],[95,300,95,398],
    ],
    windows: [
      [150,60,300,60],   // living glass / balcony doors
      [330,60,420,60],   // bedroom glass / balcony door
    ],
    doors: [
      { x:150, y:398, r:34, a0:180, a1:270 },  // entry
      { x:330, y:115, r:30, a0:0,   a1:90  },  // bedroom
    ],
    fixtures: [
      { kind:"stairs",   x:252, y:300, w:48,  h:92, dir:"up", label:"UP" },
      { kind:"island",   x:168, y:312, w:86,  h:40 },
      { kind:"counter",  x:150, y:380, w:102, h:18 },
      { kind:"appliance",x:152, y:381, w:24,  h:16, label:"R" },
      { kind:"appliance",x:226, y:381, w:24,  h:16, label:"MW" },
      { kind:"tub",      x:42,  y:214, w:52,  h:30 },
      { kind:"wd",       x:48,  y:330, w:42,  h:42, label:"W/D" },
      { kind:"shower",   x:426, y:282, w:42,  h:46 },
      { kind:"toilet",   x:360, y:300 },
      { kind:"vanity",   x:346, y:236, w:60,  h:16 },
    ],
    labels: [
      { text:"Primary Bedroom", sub:"11'8\" × 11'0\"", x:400, y:118 },
      { text:"Kitchen",         sub:"9'10\" × 8'2\"",  x:200, y:340 },
      { text:"WIC",             sub:"",                x:322, y:270 },
      { text:"CL",              sub:"",                x:437, y:208 },
      { text:"Bath",            sub:"",                x:408, y:255 },
      { text:"Bath",            sub:"",                x:115, y:255 },
      { text:"W/D",             sub:"",                x:70,  y:355 },
      { text:"CL",              sub:"",                x:122, y:355 },
      { text:"Entry",           sub:"",                x:100, y:330 },
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

/* =================== DEFAULT (seed) LAYOUT =================== */
window.DEFAULT_LAYOUT = {
  main: [
    /* bedroom */
    p("rug_6x9",     400, 150),
    p("bed_queen",   400, 150, 180),
    p("nightstand",  356, 176, 180),
    p("nightstand",  444, 176, 180),
    p("dresser",     458, 100, 90),
    /* WIC shelving */
    p("wic_shelf",   314, 235, 90),
    p("wic_shelf",   314, 290, 90),
    /* living */
    p("rug_8x10",    195, 150),
    p("sectional",   175, 158, 180),
    p("coffee_table",255, 150),
    p("console_tv",  318, 150, 90),
    p("armchair",    150,  92, -40),
    p("bookshelf",   318,  88, 90),
    p("bookshelf",   318, 205, 90),
    p("bookshelf",    72,  68),
    p("bookshelf",   110,  68),
    p("plant",       300,  92),
    /* dining */
    p("rug_5x8",     205, 248),
    p("dining6",     205, 248),
    p("dining_chair",177, 228, 180), p("dining_chair",205, 228, 180), p("dining_chair",233, 228, 180),
    p("dining_chair",177, 268),      p("dining_chair",205, 268),      p("dining_chair",233, 268),
    /* island stools */
    p("bar_stool",   150, 300), p("bar_stool", 175, 300), p("bar_stool", 200, 300),
    /* balcony bistro */
    p("out_coffee",  278, 30),
    p("out_chair",   248, 30,  90),
    p("out_chair",   308, 30, -90),
  ],

  roof: [
    /* landing office */
    p("desk",        200, 380, 90),
    p("office_chair",236, 380),
    p("bookshelf",   175, 360),
    /* lounge seating */
    p("rug_round",   150, 150),
    p("dining_round",150, 150),
    p("out_chair",   108, 150,  90), p("out_chair", 192, 150, -90),
    p("out_chair",   150, 108, 180), p("out_chair", 150, 192),
    /* loungers */
    p("out_lounge",  235, 250, 22),
    p("out_lounge",  300, 268, 22),
    /* dining */
    p("out_dining",  360, 150),
    p("out_chair",   322, 138,  90), p("out_chair", 398, 138, -90),
    p("out_chair",   360, 110, 180), p("out_chair", 360, 190),
    /* grill + greenery */
    p("grill",       398, 300),
    p("plant",        60, 300),
    p("planter",     420, 320),
  ],
};
