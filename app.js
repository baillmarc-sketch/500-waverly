/* ============================================================================
   500 Waverly — Penthouse Planner  ·  app engine
   Vanilla JS + Canvas. Unified pointer (mouse + touch). World units = inches.
   ============================================================================ */
(() => {
"use strict";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- state ---------------- */
const STORE_KEY = "waverly-ph4-layout-v2";   // bump to discard stale layouts after geometry changes
const SNAP = 2;            // position snap, inches
const ROT_SNAP = 15;      // rotation snap, degrees
const WALL = 5;           // wall thickness, inches
const SIDEBAR_W = 300;    // desktop catalog width, px
const MOBILE = 760;       // breakpoint, px

const state = {
  floor: "main",
  scale: 1,               // CSS px per inch
  panX: 0, panY: 0,
  showGrid: false,
  showDims: true,
  selected: null,         // item ref
  guides: [],             // alignment guides shown while dragging
  measuring: false,       // measure-tool active
  meas: null,             // { a:{x,y}, b:{x,y} } in world inches
  layout: { main: [], roof: [] },
};

const SWATCHES = [
  "#d8cdb8", // oatmeal
  "#8c9a93", // sage
  "#b08968", // tan leather
  "#6b4f3a", // walnut
  "#4b4f52", // charcoal
  "#3c4a5e", // navy
  "#b5764f", // terracotta
  "#d9b3ad", // blush
  "#5d7264", // forest
  "#e7ddca", // cream
  "#6b7280", // slate
  "#c79a4b", // ochre
];

function toast(msg, action){
  const t = $("#toast"); t.innerHTML = "";
  const span = document.createElement("span"); span.textContent = msg; t.appendChild(span);
  if (action){
    const b = document.createElement("button"); b.className = "toast-btn"; b.textContent = action.label;
    b.addEventListener("click", ()=>{ t.hidden = true; action.fn(); });
    t.appendChild(b);
  }
  t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(()=> t.hidden = true, action ? 4500 : 1900);
}

/* ---------------- undo ---------------- */
const undoStack = [];
function snapshot(){
  const strip = arr => arr.map(({ _id, ...rest }) => rest);
  return { main: strip(state.layout.main), roof: strip(state.layout.roof) };
}
function pushUndo(){ undoStack.push(snapshot()); if (undoStack.length > 40) undoStack.shift(); }
function undo(){
  if (!undoStack.length){ toast("Nothing to undo"); return; }
  state.layout = sanitizeLayout(undoStack.pop());
  state.selected = null; save(); render();
  toast("Undone");
}

const canvas = $("#plan");
let ctx = canvas.getContext("2d");
let dpr = Math.max(1, window.devicePixelRatio || 1);
let uid = 1;

/* ---------------- units / format ---------------- */
function ftin(inches){
  let f = Math.floor(inches / 12);
  let i = Math.round(inches - f * 12);
  if (i === 12){ f++; i = 0; }
  return i ? `${f}'${i}"` : `${f}'`;
}

/* ---------------- persistence ---------------- */
// Validate/repair any layout from storage, import, or a shared link: drop pieces
// with unknown catalog types, coerce numerics, keep only valid colors, assign ids.
function sanitizeLayout(layout){
  const okColor = c => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
  const clean = fl => (Array.isArray(layout && layout[fl]) ? layout[fl] : [])
    .filter(it => it && window.CATALOG[it.type])
    .map(it => {
      const o = { type: it.type, x: +it.x || 0, y: +it.y || 0, rot: +it.rot || 0, _id: uid++ };
      if (okColor(it.color)) o.color = it.color;
      return o;
    });
  return { main: clean("main"), roof: clean("roof") };
}
function cloneDefault(){
  return sanitizeLayout(window.DEFAULT_LAYOUT);
}
function save(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ v:2, layout: state.layout })); }
  catch(e){ /* private mode / quota */ }
  syncUrl();
}
// Once the user has shared (or opened a shared link) this session, keep the
// address-bar URL in sync with their edits — so the page bookmark always saves
// the CURRENT layout (and a reload restores it). Off by default => clean URLs.
let liveUrl = false, _urlT = 0;
function syncUrl(){
  if (!liveUrl) return;
  clearTimeout(_urlT);
  _urlT = setTimeout(()=>{
    try { const code = encodeLayout(); if (code.length <= 8000) history.replaceState(null, "", "#l="+code); }
    catch(e){}
  }, 500);
}
function load(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.layout) return false;
    state.layout = sanitizeLayout(data.layout);
    return true;
  } catch(e){ return false; }
}

/* ---------------- geometry helpers ---------------- */
function items(){ return state.layout[state.floor]; }
function plan(){ return window.FLOORPLAN[state.floor]; }
function cat(t){ return window.CATALOG[t]; }

function planBounds(){
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for (const a of plan().areas)
    for (const [x,y] of a.poly){ minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); }
  return { minX, minY, maxX, maxY, w:maxX-minX, h:maxY-minY };
}

function toWorld(cssX, cssY){ return { x:(cssX-state.panX)/state.scale, y:(cssY-state.panY)/state.scale }; }

/* point inside rotated rect (item) */
function hitItem(wx, wy, it){
  const c = cat(it.type); if (!c) return false;
  const a = -it.rot * Math.PI/180;
  const dx = wx - it.x, dy = wy - it.y;
  const lx =  dx*Math.cos(a) - dy*Math.sin(a);
  const ly =  dx*Math.sin(a) + dy*Math.cos(a);
  const pad = 2;
  return Math.abs(lx) <= c.w/2+pad && Math.abs(ly) <= c.h/2+pad;
}
function topItemAt(wx, wy){
  const arr = items();
  for (let i=arr.length-1; i>=0; i--) if (hitItem(wx,wy,arr[i])) return arr[i];
  return null;
}

/* axis-aligned bbox of rotated item (for overlap hint) */
function bbox(it){
  const c = cat(it.type); if (!c) return null;
  const a = it.rot*Math.PI/180, ca=Math.abs(Math.cos(a)), sa=Math.abs(Math.sin(a));
  const w = c.w*ca + c.h*sa, h = c.w*sa + c.h*ca;
  return { x0:it.x-w/2, y0:it.y-h/2, x1:it.x+w/2, y1:it.y+h/2 };
}
// Build the set of overlapping piece ids once per render (single O(n^2) pass over
// solid pieces on the current floor) instead of recomputing inside every drawPiece.
function computeOverlaps(){
  _overlapSet.clear();
  const solids = items().filter(it => { const c=cat(it.type); return c && c.solid !== false; });
  const boxes = solids.map(bbox);
  for (let i=0;i<solids.length;i++){
    for (let j=i+1;j<solids.length;j++){
      const b=boxes[i], ob=boxes[j];
      if (b.x0 < ob.x1-3 && b.x1 > ob.x0+3 && b.y0 < ob.y1-3 && b.y1 > ob.y0+3){
        _overlapSet.add(solids[i]._id); _overlapSet.add(solids[j]._id);
      }
    }
  }
}

/* rotated half-extents (for wall snapping) */
function halfExtents(it){
  const c = cat(it.type), a = it.rot*Math.PI/180, ca=Math.abs(Math.cos(a)), sa=Math.abs(Math.sin(a));
  return { bw:(c.w*ca + c.h*sa)/2, bh:(c.w*sa + c.h*ca)/2 };
}
/* cached axis-aligned wall lines for the current floor (for snap-to-wall) */
let _wallCache = { floor:null, vx:[], hy:[] };
function wallLines(){
  if (_wallCache.floor === state.floor) return _wallCache;
  const vx=new Set(), hy=new Set();
  for (const w of (plan().walls||[])){
    if (w[0]===w[2]) vx.add(w[0]);
    if (w[1]===w[3]) hy.add(w[1]);
  }
  for (const a of plan().areas){
    const P=a.poly;
    for (let i=0;i<P.length;i++){
      const A=P[i], B=P[(i+1)%P.length];
      if (A[0]===B[0]) vx.add(A[0]);
      if (A[1]===B[1]) hy.add(A[1]);
    }
  }
  _wallCache = { floor:state.floor, vx:[...vx], hy:[...hy] };
  return _wallCache;
}

/* ---------------- view ---------------- */
let userAdjusted = false;          // did the user manually zoom/pan since the last fit?
function resize(){
  dpr = Math.max(1, window.devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  canvas.width  = Math.round(r.width  * dpr);
  canvas.height = Math.round(r.height * dpr);
  // reset any mid-gesture state and re-fit unless the user has framed their own view
  pointers.clear(); mode = null; pinch = null;
  if (userAdjusted) render(); else fitView();
}
function fitView(){
  const r = canvas.getBoundingClientRect();
  const b = planBounds();
  const pad = 70;
  const sidebar = (window.innerWidth > MOBILE) ? SIDEBAR_W : 0;   // catalog docks right on desktop
  const availW = r.width - sidebar - pad*2;
  const availH = r.height - pad*2 - 40;
  state.scale = Math.min(availW / b.w, availH / b.h);
  state.panX = pad + (availW - b.w*state.scale)/2 - b.minX*state.scale;
  state.panY = pad + (availH - b.h*state.scale)/2 - b.minY*state.scale + 6;
  userAdjusted = false;
  render();
}
function zoomAt(cssX, cssY, factor){
  const w = toWorld(cssX, cssY);
  state.scale = Math.max(0.2, Math.min(12, state.scale*factor));
  state.panX = cssX - w.x*state.scale;
  state.panY = cssY - w.y*state.scale;
  userAdjusted = true;
  scheduleRender();
}

/* coalesce renders to one per animation frame */
let _raf = 0;
function scheduleRender(){ if (_raf) return; _raf = requestAnimationFrame(()=>{ _raf = 0; render(); }); }

/* ======================================================================
   RENDER
   ====================================================================== */
let _overlapSet = new Set();       // ids of pieces overlapping another solid piece (computed per render)
function render(){
  const r = canvas.getBoundingClientRect();
  // recompute overlaps once per frame instead of once per piece (was O(n^2) per piece)
  computeOverlaps();
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,r.width,r.height);
  ctx.save();
  ctx.translate(state.panX, state.panY);
  ctx.scale(state.scale, state.scale);

  const pl = plan();

  drawWorld(pl);

  // alignment guides (while dragging)
  if (state.guides.length) drawGuides();

  // measure line
  if (state.meas) drawMeasure();

  // selection
  if (state.selected && items().includes(state.selected)) drawSelection(state.selected);

  ctx.restore();
  drawHandle();
  drawCompass();
  drawRotBadge();
  if (state.meas) drawMeasureLabel();
  updateHud();
}

/* Static plan content (no interaction overlays) — shared by the on-screen render
   and the PNG export so both stay pixel-identical. Caller sets the transform. */
function drawWorld(pl){
  // soft drop shadow under the floor plate
  ctx.save();
  ctx.shadowColor = "rgba(60,45,30,.28)";
  ctx.shadowBlur = 26/state.scale*8;
  ctx.shadowOffsetY = 8;
  for (const a of pl.areas){ pathPoly(a.poly); ctx.fillStyle = "#000"; ctx.fill(); }
  ctx.restore();

  // area fills
  for (const a of pl.areas){
    pathPoly(a.poly);
    ctx.fillStyle = a.kind === "outdoor" ? "#e7eadf" : "#f3e7d2"; // oak indoors, paver outdoors
    ctx.fill();
    if (a.kind === "outdoor") drawPaverGrid(a.poly);
    else drawWoodGrain(a.poly);
  }

  if (state.showGrid) drawGrid();

  // perimeter: walls (indoor) / rail (outdoor)
  for (const a of pl.areas){
    pathPoly(a.poly, true);
    if (a.kind === "outdoor"){
      ctx.lineWidth = 7; ctx.strokeStyle = "#b9b09c"; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#8d8674"; ctx.stroke();
    } else {
      ctx.lineWidth = WALL; ctx.lineJoin="round"; ctx.strokeStyle = "#39322b"; ctx.stroke();
    }
  }

  // interior walls
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.lineWidth = WALL; ctx.strokeStyle = "#39322b";
  for (const w of (pl.walls||[])){ ctx.beginPath(); ctx.moveTo(w[0],w[1]); ctx.lineTo(w[2],w[3]); ctx.stroke(); }

  // windows over walls
  for (const w of (pl.windows||[])){
    ctx.lineWidth = WALL+2.5; ctx.strokeStyle = "#f3e7d2"; ctx.beginPath(); ctx.moveTo(w[0],w[1]); ctx.lineTo(w[2],w[3]); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = "#7fa6c4"; ctx.beginPath(); ctx.moveTo(w[0],w[1]); ctx.lineTo(w[2],w[3]); ctx.stroke();
  }

  // doors
  for (const d of (pl.doors||[])) drawDoor(d);

  // fixtures
  for (const f of (pl.fixtures||[])) drawFixture(f);

  // furniture — rugs/decor first (solid:false), then solids
  const arr = items();
  const order = [...arr].sort((a,b)=>(cat(a.type).solid===false?0:1)-(cat(b.type).solid===false?0:1));
  for (const it of order) drawPiece(it);

  // labels (upright, scaled with plan)
  for (const a of pl.areas) if (a.label) drawAreaLabel(a);
  for (const l of (pl.labels||[])) drawLabel(l);
}

/* Export the CURRENT floor as a clean, high-res PNG (no selection/measure/grid
   overlays, no overlap highlights) — for sharing or handing to a render tool. */
function exportPNG(){
  const b = planBounds();
  const pad = 70;                                   // output-px margin around the plan
  const scale = 2200 / Math.max(b.w, b.h);          // long edge ≈ 2200px
  const W = Math.round(b.w*scale + pad*2);
  const H = Math.round(b.h*scale + pad*2);
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const octx = off.getContext("2d");
  octx.fillStyle = "#fbf6ec"; octx.fillRect(0,0,W,H);   // warm paper background

  // redirect drawing to the off-screen canvas with a clean transform
  const _ctx=ctx, _s=state.scale, _px=state.panX, _py=state.panY, _dpr=dpr;
  const _ov=_overlapSet, _grid=state.showGrid;
  ctx = octx; dpr = 1; _overlapSet = new Set(); state.showGrid = false;
  state.scale = scale; state.panX = pad - b.minX*scale; state.panY = pad - b.minY*scale;
  octx.setTransform(1,0,0,1,0,0);
  octx.save(); octx.translate(state.panX, state.panY); octx.scale(scale, scale);
  try { drawWorld(plan()); } finally {
    octx.restore();
    ctx=_ctx; dpr=_dpr; state.scale=_s; state.panX=_px; state.panY=_py;
    _overlapSet=_ov; state.showGrid=_grid;
    render();                                         // repaint the live canvas
  }

  const name = `500-waverly-${state.floor}-floorplan.png`;
  off.toBlob(blob => {
    if (!blob){ toast("Couldn't export — try again"); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    toast(`${plan().label} floor plan saved as PNG`);
  }, "image/png");
}

/* measure tool: dashed line + endpoint dots, drawn in the world transform */
function drawMeasure(){
  const { a, b } = state.meas;
  ctx.save();
  ctx.strokeStyle = "#c08457"; ctx.lineWidth = 2/state.scale;
  ctx.setLineDash([6/state.scale, 4/state.scale]);
  ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
  ctx.setLineDash([]);
  for (const pt of [a,b]){ ctx.beginPath(); ctx.arc(pt.x,pt.y, 4/state.scale, 0, 7); ctx.fillStyle="#c08457"; ctx.fill(); }
  ctx.restore();
}
/* measure distance label, drawn in screen space (after restore) */
function drawMeasureLabel(){
  const { a, b } = state.meas;
  const mx = state.panX + (a.x+b.x)/2*state.scale;
  const my = state.panY + (a.y+b.y)/2*state.scale;
  const txt = ftin(Math.hypot(b.x-a.x, b.y-a.y));
  ctx.save();
  ctx.font = "700 12px Inter, sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  const w = ctx.measureText(txt).width + 16;
  ctx.fillStyle = "#332d27"; rr(mx-w/2, my-11, w, 22, 7); ctx.fill();
  ctx.fillStyle = "#f3ece2"; ctx.fillText(txt, mx, my);
  ctx.restore();
}

/* angle readout shown while rotating */
function drawRotBadge(){
  if (mode !== "rotate" || !state.selected) return;
  const it = state.selected;
  const h = handleScreen(it);
  const sx = h.x, sy = h.y;
  const txt = `${Math.round(((it.rot%360)+360)%360)}°`;
  ctx.save();
  ctx.font = "700 12px Inter, sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  const w = ctx.measureText(txt).width + 16;
  ctx.fillStyle = "#332d27";
  rr(sx - w/2, sy - 26, w, 20, 6); ctx.fill();
  ctx.fillStyle = "#f3ece2"; ctx.fillText(txt, sx, sy - 16);
  ctx.restore();
}

function drawGuides(){
  const b = planBounds();
  ctx.save();
  ctx.strokeStyle = "#d4567e"; ctx.lineWidth = 1; ctx.setLineDash([5,4]);
  for (const g of state.guides){
    ctx.beginPath();
    if (g.type==="v"){ ctx.moveTo(g.at, b.minY-30); ctx.lineTo(g.at, b.maxY+30); }
    else { ctx.moveTo(b.minX-30, g.at); ctx.lineTo(b.maxX+30, g.at); }
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();
}

/* north compass, drawn in screen space */
function drawCompass(){
  const r = canvas.getBoundingClientRect();
  const cx = r.width - 34, cy = 34, R = 17;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.beginPath(); ctx.arc(0,0,R,0,7); ctx.fill();
  ctx.strokeStyle = "#b9ac98"; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-R+4); ctx.lineTo(4,1); ctx.lineTo(0,-2); ctx.lineTo(-4,1); ctx.closePath();
  ctx.fillStyle = "#c08457"; ctx.fill();
  ctx.fillStyle = "#5a5046"; ctx.font = "700 9px Inter, sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("N", 0, R-5);
  ctx.restore();
}

function pathPoly(poly, openOk){
  ctx.beginPath();
  poly.forEach((pt,i)=> i? ctx.lineTo(pt[0],pt[1]) : ctx.moveTo(pt[0],pt[1]));
  ctx.closePath();
}
function drawPaverGrid(poly){
  ctx.save(); pathPoly(poly); ctx.clip();
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for (const [x,y] of poly){ minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y); }
  ctx.strokeStyle="#d3d8c6"; ctx.lineWidth=1;
  for (let x=Math.ceil(minX/24)*24; x<=maxX; x+=24){ ctx.beginPath(); ctx.moveTo(x,minY); ctx.lineTo(x,maxY); ctx.stroke(); }
  for (let y=Math.ceil(minY/24)*24; y<=maxY; y+=24){ ctx.beginPath(); ctx.moveTo(minX,y); ctx.lineTo(maxX,y); ctx.stroke(); }
  ctx.restore();
}
function drawWoodGrain(poly){
  ctx.save(); pathPoly(poly); ctx.clip();
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for (const [x,y] of poly){ minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y); }
  ctx.strokeStyle = "rgba(150,118,78,.10)"; ctx.lineWidth = 0.8;
  for (let y=Math.ceil(minY/7)*7; y<=maxY; y+=7){ ctx.beginPath(); ctx.moveTo(minX,y); ctx.lineTo(maxX,y); ctx.stroke(); }
  ctx.restore();
}
function drawGrid(){
  const b = planBounds();
  ctx.save(); ctx.strokeStyle = "rgba(120,100,70,.16)"; ctx.lineWidth = 0.7;
  for (let x=Math.floor(b.minX/12)*12; x<=b.maxX; x+=12){ ctx.beginPath(); ctx.moveTo(x,b.minY-20); ctx.lineTo(x,b.maxY+20); ctx.stroke(); }
  for (let y=Math.floor(b.minY/12)*12; y<=b.maxY; y+=12){ ctx.beginPath(); ctx.moveTo(b.minX-20,y); ctx.lineTo(b.maxX+20,y); ctx.stroke(); }
  ctx.restore();
}

/* ---- labels ---- */
function drawAreaLabel(a){
  ctx.save();
  ctx.fillStyle = "#5a5046"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.font = "800 14px Inter, sans-serif";
  ctx.fillText(a.label.toUpperCase(), a.lx, a.ly);
  if (a.dim && state.showDims){
    ctx.font = "600 11px Inter, sans-serif"; ctx.fillStyle="#8a7f70";
    ctx.fillText(a.dim, a.lx, a.ly+15);
  }
  ctx.restore();
}
function drawLabel(l){
  ctx.save();
  ctx.fillStyle = "#6b6054"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.font = "700 11.5px Inter, sans-serif";
  ctx.fillText(l.text.toUpperCase(), l.x, l.y);
  if (l.sub && state.showDims){
    ctx.font = "600 9.5px Inter, sans-serif"; ctx.fillStyle="#9a8f80";
    ctx.fillText(l.sub, l.x, l.y+12);
  }
  ctx.restore();
}

/* ---- doors ---- */
function drawDoor(d){
  ctx.save();
  ctx.lineCap = "butt";
  // cut the opening: paint floor colour over the wall segment
  if (d.gap){
    ctx.strokeStyle = d.over || "#f3e7d2";
    ctx.lineWidth = WALL + 3;
    ctx.beginPath(); ctx.moveTo(d.gap[0],d.gap[1]); ctx.lineTo(d.gap[2],d.gap[3]); ctx.stroke();
  }
  // swing arc + leaf so the doorway reads clearly
  ctx.lineCap = "round";
  ctx.strokeStyle = "#a89a85"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(d.x, d.y, d.r, d.a0*Math.PI/180, d.a1*Math.PI/180); ctx.stroke();
  const a = d.a1*Math.PI/180;
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.r*Math.cos(a), d.y + d.r*Math.sin(a)); ctx.stroke();
  ctx.restore();
}

/* ---- fixtures ---- */
function drawFixture(f){
  ctx.save();
  ctx.lineJoin="round";
  const stroke = "#7d7263";
  switch(f.kind){
    case "island": {
      rr(f.x,f.y,f.w,f.h,5); ctx.fillStyle="#efe9df"; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=stroke; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(f.x+f.w*0.32, f.y+f.h/2, 7,5,0,0,7); ctx.strokeStyle="#9a8f80"; ctx.lineWidth=1.5; ctx.stroke();
      break;
    }
    case "counter": case "vanity": {
      rr(f.x,f.y,f.w,f.h,3); ctx.fillStyle="#efe7da"; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=stroke; ctx.stroke();
      if (f.kind==="vanity"){
        ctx.beginPath(); ctx.ellipse(f.x+f.w/2,f.y+f.h/2,9,5.5,0,0,7); ctx.fillStyle="#eef3f4"; ctx.fill();
        ctx.lineWidth=1; ctx.strokeStyle="#c2cdd0"; ctx.stroke();
        ctx.fillStyle="#b9c2c4"; ctx.beginPath(); ctx.arc(f.x+f.w/2, f.y+3, 1.6,0,7); ctx.fill();
      }
      break;
    }
    case "appliance": {
      rr(f.x,f.y,f.w,f.h,2); ctx.fillStyle="#dfd8cb"; ctx.fill(); ctx.lineWidth=1; ctx.strokeStyle=stroke; ctx.stroke();
      ctx.fillStyle="#8a7f70"; ctx.font="700 7px Inter"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(f.label||"", f.x+f.w/2, f.y+f.h/2);
      break;
    }
    case "tub": {
      rr(f.x,f.y,f.w,f.h,9); ctx.fillStyle="#f4f7f8"; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=stroke; ctx.stroke();
      const vert = f.h >= f.w;
      if (vert) rr(f.x+4, f.y+11, f.w-8, f.h-17, 7); else rr(f.x+11, f.y+4, f.w-17, f.h-8, 7);
      ctx.fillStyle="#e8eef0"; ctx.fill(); ctx.lineWidth=1; ctx.strokeStyle="#c2cdd0"; ctx.stroke();
      ctx.fillStyle="#b9c2c4";
      if (vert){
        ctx.beginPath(); ctx.arc(f.x+f.w/2, f.y+f.h-9, 1.6,0,7); ctx.fill();   // drain (foot)
        ctx.beginPath(); ctx.arc(f.x+f.w/2, f.y+6,    2,  0,7); ctx.fill();    // faucet (head)
      } else {
        ctx.beginPath(); ctx.arc(f.x+f.w-9, f.y+f.h/2, 1.6,0,7); ctx.fill();
        ctx.beginPath(); ctx.arc(f.x+6,     f.y+f.h/2, 2,  0,7); ctx.fill();
      }
      break;
    }
    case "shower": {
      rr(f.x,f.y,f.w,f.h,3); ctx.fillStyle="#eef3f4"; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle=stroke; ctx.stroke();
      ctx.save(); rr(f.x,f.y,f.w,f.h,3); ctx.clip();
      ctx.strokeStyle="#d6dfe1"; ctx.lineWidth=0.7;                            // tile grid
      for (let gx=f.x+8; gx<f.x+f.w; gx+=8){ ctx.beginPath(); ctx.moveTo(gx,f.y); ctx.lineTo(gx,f.y+f.h); ctx.stroke(); }
      for (let gy=f.y+8; gy<f.y+f.h; gy+=8){ ctx.beginPath(); ctx.moveTo(f.x,gy); ctx.lineTo(f.x+f.w,gy); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle="#9aa6a8"; ctx.lineWidth=1.2;                            // linear drain
      ctx.beginPath(); ctx.moveTo(f.x+4, f.y+f.h-5); ctx.lineTo(f.x+f.w-4, f.y+f.h-5); ctx.stroke();
      ctx.strokeStyle="#8fb3cf"; ctx.lineWidth=2;                              // glass door edge
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x, f.y+f.h); ctx.stroke();
      ctx.fillStyle="#b9c2c4"; ctx.beginPath(); ctx.arc(f.x+f.w-7, f.y+7, 2.2,0,7); ctx.fill(); // head
      break;
    }
    case "toilet": {
      ctx.fillStyle="#f4f7f8"; ctx.strokeStyle=stroke; ctx.lineWidth=1.4;
      rr(f.x-7,f.y-10,14,8,2); ctx.fill(); ctx.stroke();                       // tank
      ctx.beginPath(); ctx.ellipse(f.x,f.y+3,7,9,0,0,7); ctx.fillStyle="#f4f7f8"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(f.x,f.y+3,4.4,6,0,0,7); ctx.lineWidth=0.8; ctx.strokeStyle="#c2cdd0"; ctx.stroke();
      break;
    }
    case "wd": {
      rr(f.x,f.y,f.w,f.h,3); ctx.fillStyle="#e9e3d8"; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=stroke; ctx.stroke();
      ctx.beginPath(); ctx.arc(f.x+f.w/2,f.y+f.h/2,Math.min(f.w,f.h)/2-4,0,7); ctx.strokeStyle="#b3a999"; ctx.stroke();
      break;
    }
    case "stairs": {
      rr(f.x,f.y,f.w,f.h,2); ctx.fillStyle="#ece4d6"; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=stroke; ctx.stroke();
      ctx.strokeStyle="#bdb09b"; ctx.lineWidth=1;
      const steps=7;
      for (let i=1;i<steps;i++){ const yy=f.y+(f.h/steps)*i; ctx.beginPath(); ctx.moveTo(f.x,yy); ctx.lineTo(f.x+f.w,yy); ctx.stroke(); }
      ctx.fillStyle="#8a7f70"; ctx.font="700 9px Inter"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const ay = f.dir==="up"? f.y+10 : f.y+f.h-10;
      ctx.fillText(f.dir==="up"?"↑":"↓", f.x+f.w/2, ay);
      ctx.fillText(f.label||"", f.x+f.w/2, f.y+f.h/2);
      break;
    }
    case "planters": {
      rr(f.x,f.y,f.w,f.h,3); ctx.fillStyle="#7d5a3c"; ctx.fill();
      ctx.fillStyle="#6b9a5a";
      const horiz = f.w>=f.h, n = Math.max(2, Math.round((horiz?f.w:f.h)/22));
      for (let i=0;i<n;i++){
        const cx = horiz ? f.x + (f.w/n)*(i+0.5) : f.x+f.w/2;
        const cy = horiz ? f.y+f.h/2 : f.y + (f.h/n)*(i+0.5);
        ctx.beginPath(); ctx.arc(cx,cy,Math.min(f.w,f.h)/2-2,0,7); ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

/* ---- furniture ---- */
function drawPiece(it){
  const c = cat(it.type); if (!c) return;
  const warn = _overlapSet.has(it._id);
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate(it.rot*Math.PI/180);
  const w=c.w, h=c.h;
  ctx.lineJoin="round";
  if (c.solid !== false){                       // soft drop shadow for real furniture
    const lifted = (it === state.selected && mode === "drag");
    ctx.shadowColor = "rgba(50,38,24,.30)";
    ctx.shadowBlur = lifted ? 16 : 6;
    ctx.shadowOffsetY = lifted ? 9 : 3;
  }
  drawShape(ctx, c.render, w, h, it.color || c.fill, { warn });
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.restore();

  // upright label
  if (c.solid !== false && Math.min(c.w,c.h)*state.scale > 34){
    ctx.save();
    ctx.fillStyle="rgba(35,30,25,.62)"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.font = "600 8px Inter, sans-serif";
    const name = shortName(c.name);
    ctx.fillText(name, it.x, it.y);
    ctx.restore();
  }
}
function shortName(n){
  return n.replace(/\s*\(.*\)/,"").replace("Dining Table","Dining").replace("Media + TV","TV");
}

/* generic shape drawer — centered at 0,0, size w×h in current units */
function drawShape(g, render, w, h, fill, opt={}){
  const hw=w/2, hh=h/2;
  const stroke = opt.warn ? "#c2553f" : "rgba(45,35,25,.55)";
  const lw = 1.4;
  g.lineWidth = lw;
  g.strokeStyle = stroke;
  g.fillStyle = fill;

  const cushion = (x,y,cw,ch,r=4)=>{ rrG(g,x,y,cw,ch,r); g.fill(); g.stroke(); };

  switch(render){
    case "bed": {
      rrG(g,-hw,-hh,w,h,6); g.fillStyle=fill; g.fill(); g.stroke();
      // pillows at the "head" (top, -y)
      g.fillStyle="#fbf6ec";
      rrG(g,-hw+5,-hh+5, hw-8, 16, 3); g.fill(); g.stroke();
      rrG(g,1,-hh+5, hw-8, 16, 3); g.fill(); g.stroke();
      // duvet line
      g.strokeStyle="rgba(45,35,25,.30)"; g.beginPath(); g.moveTo(-hw,-hh+30); g.lineTo(hw,-hh+30); g.stroke();
      break;
    }
    case "sofa": {
      rrG(g,-hw,-hh,w,h,7); g.fill(); g.stroke();              // body
      g.fillStyle = shade(fill,-12);
      rrG(g,-hw+3,-hh+3,w-6,12,4); g.fill();                   // backrest (top)
      g.fillStyle = shade(fill,8);
      cushion(-hw+5, -hh+16, w-10, h-22, 4);                  // seat
      break;
    }
    case "sectional": {
      // L-shape: main body (top) + return (left)
      rrG(g,-hw,-hh,w,h*0.52,7); g.fill(); g.stroke();
      rrG(g,-hw,-hh,w*0.42,h,7); g.fill(); g.stroke();
      g.fillStyle=shade(fill,8);
      rrG(g,-hw+5,-hh+13, w-10, h*0.52-18, 4); g.fill();
      rrG(g,-hw+5,-hh+13, w*0.42-12, h-22, 4); g.fill();
      break;
    }
    case "armchair": {
      rrG(g,-hw,-hh,w,h,7); g.fill(); g.stroke();
      g.fillStyle=shade(fill,-12); rrG(g,-hw+3,-hh+3,w-6,11,4); g.fill();
      g.fillStyle=shade(fill,8);  rrG(g,-hw+5,-hh+15,w-10,h-20,4); g.fill();
      break;
    }
    case "table": {
      rrG(g,-hw,-hh,w,h,4); g.fillStyle=fill; g.fill(); g.stroke();
      g.strokeStyle="rgba(255,255,255,.18)"; rrG(g,-hw+5,-hh+5,w-10,h-10,3); g.stroke();
      break;
    }
    case "box": case "drawers": case "media": {
      rrG(g,-hw,-hh,w,h,3); g.fill(); g.stroke();
      if (render==="drawers"){
        g.strokeStyle="rgba(255,255,255,.22)";
        const n=Math.max(1,Math.round(w/20));
        for(let i=1;i<n;i++){ const x=-hw+(w/n)*i; g.beginPath(); g.moveTo(x,-hh+3); g.lineTo(x,hh-3); g.stroke(); }
      }
      if (render==="media"){
        // TV bar on the front (-y side)
        g.fillStyle="#20262e"; rrG(g,-hw+4,-hh-3,w-8,4,1); g.fill();
      }
      break;
    }
    case "shelf": {
      rrG(g,-hw,-hh,w,h,2); g.fill(); g.stroke();
      g.strokeStyle="rgba(255,255,255,.25)";
      const n=Math.max(2,Math.round(w/9));
      for(let i=1;i<n;i++){ const x=-hw+(w/n)*i; g.beginPath(); g.moveTo(x,-hh+2); g.lineTo(x,hh-2); g.stroke(); }
      break;
    }
    case "round": {
      g.beginPath(); g.ellipse(0,0,hw,hh,0,0,7); g.fill(); g.stroke();
      break;
    }
    case "chair": {
      rrG(g,-hw,-hh+3,w,h-3,3); g.fill(); g.stroke();
      g.fillStyle=shade(fill,-12); rrG(g,-hw,-hh,w,5,2); g.fill();   // back at top
      break;
    }
    case "plant": {
      g.fillStyle="#9a8666"; g.beginPath(); g.ellipse(0,0,hw*0.6,hh*0.6,0,0,7); g.fill();
      g.fillStyle=fill; for(let i=0;i<5;i++){ const an=i/5*7; g.beginPath(); g.ellipse(Math.cos(an)*hw*0.4,Math.sin(an)*hh*0.4,hw*0.45,hh*0.45,0,0,7); g.fill(); }
      break;
    }
    case "rug": {
      g.setLineDash([6,4]); g.lineWidth=1.4; g.strokeStyle="rgba(120,100,70,.6)";
      rrG(g,-hw,-hh,w,h,3); g.fillStyle=fill; g.globalAlpha=0.55; g.fill(); g.globalAlpha=1; g.stroke();
      g.setLineDash([]);
      break;
    }
    case "ruground": {
      g.setLineDash([6,4]); g.lineWidth=1.4; g.strokeStyle="rgba(120,100,70,.6)";
      g.beginPath(); g.ellipse(0,0,hw,hh,0,0,7); g.fillStyle=fill; g.globalAlpha=0.55; g.fill(); g.globalAlpha=1; g.stroke();
      g.setLineDash([]);
      break;
    }
    default: { rrG(g,-hw,-hh,w,h,3); g.fill(); g.stroke(); }
  }
}

/* rounded-rect path on ctx (world) and on arbitrary ctx */
function rr(x,y,w,h,r){ rrG(ctx,x,y,w,h,r); }
function rrG(g,x,y,w,h,r){
  r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}
function shade(hex, amt){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)+amt, gr=((n>>8)&255)+amt, b=(n&255)+amt;
  r=Math.max(0,Math.min(255,r)); gr=Math.max(0,Math.min(255,gr)); b=Math.max(0,Math.min(255,b));
  return "#"+((1<<24)+(r<<16)+(gr<<8)+b).toString(16).slice(1);
}

/* ---- selection chrome ---- */
function drawSelection(it){
  const c = cat(it.type); if (!c) return;
  ctx.save();
  ctx.translate(it.x,it.y); ctx.rotate(it.rot*Math.PI/180);
  ctx.strokeStyle="#c08457"; ctx.lineWidth=2; ctx.setLineDash([5,4]);
  rr(-c.w/2-3,-c.h/2-3,c.w+6,c.h+6,5); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
/* rotate-handle knob in SCREEN px — constant 26px beyond the piece's front edge,
   so it stays grabbable at any zoom */
function handleScreen(it){
  const c=cat(it.type); const a=it.rot*Math.PI/180;
  const dx=Math.sin(a), dy=-Math.cos(a);
  const fe={ x: state.panX+(it.x+dx*(c.h/2))*state.scale, y: state.panY+(it.y+dy*(c.h/2))*state.scale };
  return { x: fe.x+dx*26, y: fe.y+dy*26, fe };
}
/* draw the rotate handle (stem + knob) in screen space, after ctx.restore() */
function drawHandle(){
  const it=state.selected; if (!it || !items().includes(it)) return;
  const h=handleScreen(it);
  ctx.save();
  ctx.strokeStyle="#c08457"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(h.fe.x,h.fe.y); ctx.lineTo(h.x,h.y); ctx.stroke();
  ctx.beginPath(); ctx.arc(h.x,h.y,8,0,7); ctx.fillStyle="#c08457"; ctx.fill();
  ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
  ctx.restore();
}

/* ======================================================================
   HUD
   ====================================================================== */
function updateHud(){
  const bar = $("#scalebar .bar");
  const px = 60 * state.scale;   // 5 ft = 60 in
  bar.style.width = px + "px";

  // selection bar
  const sel = state.selected;
  const selbar = $("#selbar");
  if (sel && items().includes(sel)){
    const c = cat(sel.type);
    selbar.hidden = false;
    $("#sel-name").textContent = c.name;
    $("#sel-dims").textContent = `${ftin(c.w)} × ${ftin(c.h)}  ·  ${Math.round(((sel.rot%360)+360)%360)}°`;
  } else {
    selbar.hidden = true;
    $("#swatch-pop").hidden = true;
  }

  // area readout — count + approx footprint of furniture on this floor
  const n = items().filter(it=>cat(it.type).solid!==false).length;
  $("#area-readout").textContent = `${plan().label} · ${n} pieces`;
}

/* ======================================================================
   POINTER / GESTURES
   ====================================================================== */
const pointers = new Map();
let mode = null;            // 'drag' | 'rotate' | 'pan' | 'pinch'
let dragDX=0, dragDY=0, panSX=0, panSY=0, moved=false, downOnEmpty=false;
let pinch = null;
let lastTapItem = null, lastTapTime = 0;
let gestureUndo = false;   // have we already snapshotted this drag/rotate gesture?

function evPos(e){ const r=canvas.getBoundingClientRect(); return { x:e.clientX-r.left, y:e.clientY-r.top }; }

canvas.addEventListener("pointerdown", e=>{
  canvas.setPointerCapture(e.pointerId);
  const pos = evPos(e); pointers.set(e.pointerId, pos);
  moved = false;

  if (pointers.size === 2){
    const pts=[...pointers.values()];
    pinch = {
      d: dist(pts[0],pts[1]),
      mid: mid(pts[0],pts[1]),
      scale: state.scale, panX: state.panX, panY: state.panY,
    };
    mode = "pinch";
    return;
  }

  const w = toWorld(pos.x,pos.y);
  if (state.measuring){ mode="measure"; state.meas={ a:{x:w.x,y:w.y}, b:{x:w.x,y:w.y} }; render(); return; }
  // rotate handle? (screen-space hit test, generous radius)
  if (state.selected && items().includes(state.selected)){
    const h = handleScreen(state.selected);
    if (Math.hypot(h.x-pos.x, h.y-pos.y) < 22){ mode="rotate"; gestureUndo=false; return; }
  }
  const hit = topItemAt(w.x,w.y);
  if (hit){
    const now = Date.now();
    if (hit === lastTapItem && now - lastTapTime < 320){   // double-tap → rotate 90°
      pushUndo(); hit.rot = (hit.rot + 90) % 360; save(); lastTapTime = 0;
    } else { lastTapItem = hit; lastTapTime = now; }
    select(hit);
    mode="drag"; dragDX=w.x-hit.x; dragDY=w.y-hit.y; downOnEmpty=false; gestureUndo=false;
  } else {
    mode="pan"; panSX=pos.x; panSY=pos.y; downOnEmpty=true;
  }
});

canvas.addEventListener("pointermove", e=>{
  if (!pointers.has(e.pointerId)) return;
  const pos = evPos(e); pointers.set(e.pointerId, pos);
  moved = true;

  if (mode==="pinch" && pointers.size>=2){
    const pts=[...pointers.values()];
    const d=Math.max(1e-3, dist(pts[0],pts[1])), m=mid(pts[0],pts[1]);
    const f = d/Math.max(1e-3, pinch.d);
    const ns = Math.max(0.2, Math.min(12, pinch.scale*f));
    // keep midpoint world-stable using starting transform
    const wx=(pinch.mid.x-pinch.panX)/pinch.scale, wy=(pinch.mid.y-pinch.panY)/pinch.scale;
    state.scale=ns;
    state.panX = m.x - wx*ns;
    state.panY = m.y - wy*ns;
    userAdjusted = true; scheduleRender(); return;
  }

  const w = toWorld(pos.x,pos.y);
  if (mode==="drag" && state.selected){
    const sel = state.selected;
    if (!gestureUndo){ pushUndo(); gestureUndo = true; }   // snapshot once at drag start
    let nx = Math.round((w.x-dragDX)/SNAP)*SNAP;
    let ny = Math.round((w.y-dragDY)/SNAP)*SNAP;
    const g=[];
    const { bw, bh } = halfExtents(sel);
    const WL = wallLines();
    // 1) snap flush to a wall (edges), else 2) align centers with other pieces
    let snapX=false, snapY=false;
    for (const vx of WL.vx){
      if (Math.abs((nx-bw)-vx) <= 5){ nx=vx+bw; g.push({type:"v",at:vx}); snapX=true; break; }
      if (Math.abs((nx+bw)-vx) <= 5){ nx=vx-bw; g.push({type:"v",at:vx}); snapX=true; break; }
    }
    for (const hy of WL.hy){
      if (Math.abs((ny-bh)-hy) <= 5){ ny=hy+bh; g.push({type:"h",at:hy}); snapY=true; break; }
      if (Math.abs((ny+bh)-hy) <= 5){ ny=hy-bh; g.push({type:"h",at:hy}); snapY=true; break; }
    }
    for (const o of items()){
      if (o===sel || cat(o.type).solid===false) continue;
      if (!snapX && Math.abs(o.x-nx) <= 4){ nx=o.x; g.push({type:"v",at:o.x}); snapX=true; }
      if (!snapY && Math.abs(o.y-ny) <= 4){ ny=o.y; g.push({type:"h",at:o.y}); snapY=true; }
    }
    sel.x = nx; sel.y = ny; state.guides = g;
    scheduleRender();
  } else if (mode==="rotate" && state.selected){
    if (!gestureUndo){ pushUndo(); gestureUndo = true; }
    let ang = Math.atan2(w.y-state.selected.y, w.x-state.selected.x)*180/Math.PI + 90;
    ang = Math.round(ang/ROT_SNAP)*ROT_SNAP;
    state.selected.rot = ((ang%360)+360)%360;
    scheduleRender();
  } else if (mode==="measure" && state.meas){
    state.meas.b = { x:w.x, y:w.y }; scheduleRender();
  } else if (mode==="pan"){
    state.panX += pos.x-panSX; state.panY += pos.y-panSY;
    panSX=pos.x; panSY=pos.y; userAdjusted = true; scheduleRender();
  }
});

function endPointer(e){
  pointers.delete(e.pointerId);
  if (state.guides.length){ state.guides=[]; render(); }
  if (mode==="drag" || mode==="rotate") save();
  if (mode==="pan" && downOnEmpty && !moved){ select(null); }
  gestureUndo = false;
  if (pointers.size===0){ mode=null; pinch=null; downOnEmpty=false; }
  else if (pointers.size===1){ // lift from pinch → resume pan from the remaining finger's live position
    const live=[...pointers.values()][0];
    mode="pan"; panSX=live.x; panSY=live.y; moved=false; downOnEmpty=false; pinch=null;
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

canvas.addEventListener("wheel", e=>{
  e.preventDefault();
  const pos=evPos(e);
  zoomAt(pos.x,pos.y, e.deltaY<0 ? 1.12 : 1/1.12);
}, { passive:false });

function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function mid(a,b){ return { x:(a.x+b.x)/2, y:(a.y+b.y)/2 }; }

/* ======================================================================
   SELECTION + ACTIONS
   ====================================================================== */
function select(it){ state.selected = it; $("#swatch-pop").hidden = true; render(); }

function buildSwatches(){
  const pop = $("#swatch-pop"); pop.innerHTML = "";
  const reset = document.createElement("button");
  reset.className = "swatch reset"; reset.textContent = "↺"; reset.title = "Default finish";
  reset.setAttribute("aria-label","Default finish");
  reset.addEventListener("click", ()=>{ if (state.selected){ pushUndo(); delete state.selected.color; save(); render(); } });
  pop.appendChild(reset);
  for (const hex of SWATCHES){
    const b = document.createElement("button");
    b.className = "swatch"; b.style.background = hex; b.title = hex; b.setAttribute("aria-label","Finish "+hex);
    b.addEventListener("click", ()=>{ if (state.selected){ pushUndo(); state.selected.color = hex; save(); render(); } });
    pop.appendChild(b);
  }
}

function addPiece(type){
  if (!window.CATALOG[type]) return;
  const r = canvas.getBoundingClientRect();
  const sidebar = (window.innerWidth>760)? SIDEBAR_W : 0;
  const center = toWorld((r.width-sidebar)/2, r.height/2);
  pushUndo();
  const it = { type, x:Math.round(center.x/SNAP)*SNAP, y:Math.round(center.y/SNAP)*SNAP, rot:0, _id:uid++ };
  items().push(it);
  select(it); save();
  if (window.innerWidth<=760) closeCatalog();
}

function act(a){
  const it=state.selected; if(!it) return;
  if (a==="color"){ const pop=$("#swatch-pop"); pop.hidden=!pop.hidden; return; }
  pushUndo();
  if (a==="rot-l") it.rot=(((it.rot-15)%360)+360)%360;
  if (a==="rot-r") it.rot=(it.rot+15)%360;
  if (a==="rot-90") it.rot=(it.rot+90)%360;
  if (a==="dup"){ const n={...it,x:it.x+12,y:it.y+12,_id:uid++}; items().push(n); state.selected=n; }
  if (a==="front"){ const arr=items(); const i=arr.indexOf(it); if(i>=0){ arr.splice(i,1); arr.push(it); } }
  if (a==="del"){ const arr=items(); const i=arr.indexOf(it); if(i>=0) arr.splice(i,1); state.selected=null; render(); save(); toast("Deleted", { label:"Undo", fn:undo }); return; }
  render(); save();
}

/* ======================================================================
   CATALOG UI
   ====================================================================== */
function buildCatalog(){
  const cats=[...new Set(Object.values(window.CATALOG).map(c=>c.cat))];
  const tabsEl=$("#catalog-tabs"); tabsEl.innerHTML="";
  let active=cats[0];
  const grid=$("#catalog-grid");

  function renderGrid(){
    grid.innerHTML="";
    for (const [key,c] of Object.entries(window.CATALOG)){
      if (c.cat!==active) continue;
      const el=document.createElement("button");
      el.className="cat-item";
      const cnv=makeThumb(c);
      el.appendChild(cnv);
      const nm=document.createElement("div"); nm.className="cat-name"; nm.textContent=c.name; el.appendChild(nm);
      const sz=document.createElement("div"); sz.className="cat-size"; sz.textContent=`${ftin(c.w)} × ${ftin(c.h)}`; el.appendChild(sz);
      el.addEventListener("click",()=>addPiece(key));
      grid.appendChild(el);
    }
  }
  cats.forEach(cn=>{
    const t=document.createElement("button"); t.className="cat-tab"+(cn===active?" active":""); t.textContent=cn;
    t.addEventListener("click",()=>{ active=cn; $$(".cat-tab",tabsEl).forEach(x=>x.classList.toggle("active",x===t)); renderGrid(); });
    tabsEl.appendChild(t);
  });
  renderGrid();
}
function makeThumb(c){
  const W=74,H=46,pad=8;
  const cnv=document.createElement("canvas");
  cnv.width=W*2; cnv.height=H*2; cnv.style.width=W+"px"; cnv.style.height=H+"px"; cnv.className="cat-thumb";
  const g=cnv.getContext("2d"); g.scale(2,2);
  const s=Math.min((W-pad*2)/c.w,(H-pad*2)/c.h);
  g.translate(W/2,H/2); g.scale(s,s);
  drawShape(g, c.render, c.w, c.h, c.fill, { thumb:true });
  return cnv;
}

/* ======================================================================
   SUGGESTIONS
   ====================================================================== */
function suggestionsHTML(){
  return `
  <h1>Making 500 Waverly feel like home</h1>
  <p class="lede">A penthouse with great bones: oak floors, soaring ceilings with exposed beams, navy &amp; blush accent walls, a walnut U-shaped kitchen with a waterfall peninsula, wraparound corner glass, and ~780&nbsp;sf of outdoor across the balcony and roof terrace. Here's how I'd plan each zone for the two of you — lots of clothes, lots of books, and a love of hosting.</p>

  <h2>🛋️ Living / Dining — the "epic" room</h2>
  <ul>
    <li><strong>Anchor with a sectional</strong> floating off the walls so the navy/blush walls stay visible. A ~9–10&nbsp;ft sectional (the seed layout uses a 112"×84" L) seats 5–6 and faces a media console — keep the chaise toward the window for the views without blocking the balcony doors.</li>
    <li><strong>Two-piece alternative:</strong> a 84" sofa + a loveseat or two swivel accent chairs reads more "grown-up living room" and is far easier to rearrange for parties. Try both in the planner.</li>
    <li><strong>Define zones with rugs.</strong> An 8×10 under the seating and a 5×8 under the dining table visually splits the long room into "living" and "dining" without walls.</li>
    <li><strong>TV:</strong> a low 64–72" media console on the wall opposite the windows avoids glare. Mounting on the blush wall keeps cords hidden and the sightline clean from the sofa.</li>
    <li><strong>Books:</strong> you have a lot — run a wall of shelving. Built-ins or modular (String, IKEA Billy/ BESTÅ, or Floyd) along the long interior wall turns the book collection into the room's main "art." Budget ~12" depth; the planner's bookshelves are 36"×12" so you can lay out a full wall.</li>
  </ul>

  <h2>🍽️ Dining for 6+</h2>
  <ul>
    <li>A <strong>72" rectangular table seats 6</strong> comfortably; a 96" (8-seat) fits if you pull it toward the kitchen — there's length to spare. An <strong>extendable</strong> table is the move: 60–72" day-to-day, opens to 96"+ for dinners.</li>
    <li>Leave <strong>~36"</strong> of clearance behind chairs to walk. Place it near the kitchen peninsula so serving is one step away; the peninsula doubles as a buffet.</li>
    <li>The <strong>U-shaped kitchen</strong> peninsula has <em>no seating overhang</em>, but the base is deep on storage — use it for prep and as a serving counter rather than stools. For casual seating, the dining table is two steps away.</li>
  </ul>

  <h2>🛏️ Bedroom (11'11" × 10'0")</h2>
  <ul>
    <li><strong>Queen is the right call</strong> here — a king (76" wide) would crowd a 10' wall once you add nightstands. Queen (60") leaves comfortable ~24" walkways on both sides.</li>
    <li>Put the headboard on the <strong>inside (interior) wall</strong>, not the exterior wall — that outside wall runs a little off-square, and the corner windows take the other two walls, so the bed sits true and you wake up facing the light. Two slim nightstands flank it.</li>
    <li>Those corner windows are the feature — keep furniture low around them. Consider a bench at the foot instead of a tall piece.</li>
  </ul>

  <h2>👗 Walk-in closet — built-in ideas</h2>
  <p>You both have a lot of clothes, and the WIC is the place to solve it. Options, cheapest → nicest:</p>
  <ul>
    <li><strong>IKEA BOAXEL / ELVARLI</strong> — wall-mounted adjustable rails, double-hang one side for shirts, long-hang the other for coats/dresses. Cheap, flexible, renter-friendly.</li>
    <li><strong>The Container Store Elfa</strong> — sturdier, looks semi-custom, great drawer inserts for folded items and accessories.</li>
    <li><strong>Custom (California Closets / local)</strong> — if you're staying a while: floor-to-ceiling, a center island with drawers (the planner has a "Closet Island"), and good lighting. Maximize <em>double-hang</em> zones — two of you means hanging length is the scarce resource.</li>
    <li>Rule of thumb: ~50% double-hang, 20% long-hang, 20% drawers/shelves, 10% shoes. Add a mirror and a single sconce or LED strip.</li>
  </ul>

  <h2>🖥️ Roof landing — the office nook</h2>
  <ul>
    <li>Put the desk <strong>inside the enclosed stair-bulkhead landing</strong> (before the swing door to the terrace), not out on the open deck — it's <em>indoors</em>, so it's sheltered and climate-controlled year-round. Tuck a <strong>48" desk + rolling chair</strong> into the corner by the window, facing the water-tower view.</li>
    <li>By my read the clear floor beside the stair is roughly <strong>48" wide</strong> — enough for a 48" desk against the wall with a rolling chair in front (a desk + chair wants about <strong>48" × 54"</strong> of footprint). It's snug but workable; <strong>verify the tile count</strong> (looks like 12" tiles) when you have the keys so we can lock the exact spot.</li>
    <li>Since it's inside you can use normal furniture — no weatherproofing. Add a slim <strong>shelf</strong> down the side wall and a power source, and it's a real work-from-home nook.</li>
    <li><strong>Your Aeron fits.</strong> A Size B is ~27"×27" with the arms ~26" off the floor, so it tucks under any flat-top desk (~28" underside) — arms clear, no drawer box in the way. Tucked, the back + base sit ~14" proud, so the desk+chair reads about <strong>42"×34"</strong> parked and ~48" when you roll out. I've dropped a <strong>Compact Desk (42"×20")</strong> + an <strong>Aeron-sized task chair</strong> into the nook so the fit is to scale.</li>
    <li>Also added a <strong>monitor</strong> on the desk and a small <strong>file cabinet</strong> down the east wall (with the slim bookshelf) — the whole nook stays <em>inside</em> the landing, clear of the stair and the terrace door swing.</li>
  </ul>

  <h2>🌇 Balcony &amp; roof terrace (outdoor furniture staying)</h2>
  <ul>
    <li><strong>Balcony (24'8"×5'0"):</strong> it's narrow — a bistro/round café table for 2 + a couple of chairs is the right scale (matches what's there now). Don't over-furnish; it's the morning-coffee perch.</li>
    <li><strong>Terrace (33'6"×25'3"):</strong> zone it — a <em>lounge</em> cluster (sofa/loungers + low table) for sun, a <em>dining</em> set for 6 under shade, and a <em>grill</em> station near the stairs for easy in/out. The wood planters you have soften the concrete and give privacy.</li>
    <li>Suggestions to add later: a market umbrella or cantilever shade, outdoor rug to warm the pavers, string lights along the parapet, and a few large planters with hardy grasses/evergreens for year-round green.</li>
  </ul>

  <h2>✨ Other ideas</h2>
  <ul>
    <li><strong>Keep the convertible option in mind:</strong> the living room can revert to a 2nd bedroom. If you ever want a guest room/nursery/office-with-a-door, the seed layout's "living zone" is exactly where that wall would go.</li>
    <li><strong>Lighting:</strong> the ceilings are tall — a statement pendant over the dining table and floor lamps in the living corners will make it feel finished and warm at night.</li>
    <li><strong>Entry moment:</strong> a slim console + mirror + tray by the angled entry wall gives you a drop zone for keys/mail.</li>
    <li><strong>Storage:</strong> use the under-stair closet for luggage/seasonal; the W/D closet shelving for household goods. Vertical everywhere — these ceilings are your friend.</li>
  </ul>

  <h2>☯️ Feng Shui review</h2>
  <p class="lede">A quick consultant's pass on energy flow (chi), command positions, and balance — adapted to this specific unit.</p>
  <ul>
    <li><strong>Bed — command position (done in the seed layout):</strong> the bedroom door is in the SW corner, so the bed's headboard goes on the <strong>solid east wall</strong>, diagonally across from the door. You can see anyone entering without being in the door's direct "chi" path, and the head is backed by a solid wall (not glass, and not shared with the bathroom plumbing — both Feng Shui no-nos). Use a <strong>tall, solid/upholstered headboard</strong> ("mountain" support) and keep <strong>both sides of the bed accessible</strong> with a nightstand each (balanced yin/yang for a couple). Avoid storing clutter under the bed.</li>
    <li><strong>Two nightstands, matched:</strong> symmetry on both sides supports an equal partnership — keep them a pair, with paired lamps.</li>
    <li><strong>Bathroom doors:</strong> keep the en-suite and guest bath doors closed and drains/lids down — Feng Shui treats drains as chi (and wealth) leaving. A plant or a mirror placement can help; don't hang a mirror facing the bed.</li>
    <li><strong>Entry / "mouth of chi":</strong> the front door opens into the foyer lane — keep it bright, uncluttered, and give it a clear landing spot (console + mirror, but the mirror should <em>not</em> face the door straight on, or it pushes chi back out). A small rug and good light "invite" energy in.</li>
    <li><strong>Command position elsewhere:</strong> on the roof landing, angle the <strong>desk so you face the terrace/open view, with a wall behind your back</strong>, not your back to the stairs. Same principle as the bed — see what's coming.</li>
    <li><strong>Five elements &amp; balance:</strong> the home is heavy on <em>wood</em> (oak floors, walnut kitchen) and <em>metal/water</em> (glass, city views). Warm it with <em>fire</em> (candles, warm lighting, a few red/terracotta accents) and <em>earth</em> (ceramics, stone, the terrace planters) so it doesn't feel cold. The blush wall already adds gentle fire/earth.</li>
    <li><strong>Flow:</strong> the open living/dining is great for chi, but keep a clear, curving path from the entry to the balcony doors — don't block the sightline with the sofa back. Round/soft-edged coffee and dining tables ease the "sharp chi" of a long rectangular room.</li>
    <li><strong>Terrace:</strong> abundant plants = growth and vitality; just keep them healthy (remove anything dead/dried promptly). A water feature in the north/east of the terrace can support career/wealth if you want one.</li>
  </ul>

  <p class="lede" style="margin-top:18px">Everything in the planner is to scale and draggable. Try the sectional vs. two-sofa options, slide the dining table along the room, and see what leaves the best flow to the balcony doors. Your layout auto-saves on this device.</p>
  `;
}

/* ======================================================================
   WIRING
   ====================================================================== */
function switchFloor(fl){
  state.floor=fl; state.selected=null;
  $$(".fs-btn").forEach(b=>{ const on=b.dataset.floor===fl; b.classList.toggle("active",on); b.setAttribute("aria-selected", on?"true":"false"); });
  $("#cat-floor-name").textContent = window.FLOORPLAN[fl].label;
  fitView();
}
function openCatalog(){ $("#catalog").classList.add("open"); $("#catalog-backdrop").hidden = false; }
function closeCatalog(){ $("#catalog").classList.remove("open"); $("#catalog-backdrop").hidden = true; }
// swipe the bottom-sheet catalog down to dismiss
function wireSheetSwipe(){
  const sheet = $("#catalog");
  let startY=0, dy=0, dragging=false;
  const down = e=>{ startY=(e.touches?e.touches[0]:e).clientY; dy=0; dragging=true; sheet.style.transition="none"; };
  const move = e=>{ if(!dragging) return; dy=Math.max(0,(e.touches?e.touches[0]:e).clientY-startY); sheet.style.transform=`translateY(${dy}px)`; };
  const up = ()=>{ if(!dragging) return; dragging=false; sheet.style.transition=""; sheet.style.transform=""; if(dy>90) closeCatalog(); };
  for (const el of [$("#catalog-grab"), $(".catalog-head")]){
    if(!el) continue;
    el.addEventListener("touchstart", down, {passive:true});
    el.addEventListener("touchmove", move, {passive:true});
    el.addEventListener("touchend", up);
  }
}

function exportLayout(){
  const blob=new Blob([JSON.stringify({ v:2, layout:state.layout }, null, 2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="500-waverly-layout.json"; a.click();
  URL.revokeObjectURL(url);
}
function importLayout(file){
  const fr=new FileReader();
  fr.onload=()=>{ try{
    const d=JSON.parse(fr.result);
    if(!d || !d.layout) throw 0;
    pushUndo();
    state.layout = sanitizeLayout(d.layout);
    state.selected=null; save(); render();
    toast("Layout imported");
  }catch(e){ toast("Couldn't read that layout file"); } };
  fr.readAsText(file);
}

/* ---- presets ---- */
function buildPresetsMenu(){
  const menu = $("#presets-menu");
  menu.innerHTML = `<div class="menu-head">Starter layouts</div>`;
  for (const id of window.PRESET_ORDER){
    const pr = window.PRESETS[id];
    const b = document.createElement("button");
    b.className = "menu-item";
    b.innerHTML = `<strong>${pr.name}</strong><small>${pr.desc}</small>`;
    b.addEventListener("click", ()=>{ menu.hidden = true; loadPreset(id); });  // undoable, no blocking dialog
    menu.appendChild(b);
  }
}
function buildMoreMenu(){
  const menu = $("#more-menu");
  const items = [
    ["↶","Undo",                ()=>undo()],
    ["⌂","Layouts",            ()=>{ $("#more-menu").hidden=true; $("#presets-menu").hidden=false; }],
    ["💡","Decorator ideas",    ()=>$("#btn-suggestions").click()],
    ["📏","Measure",            ()=>$("#btn-measure").click()],
    ["🔗","Share link",         ()=>$("#btn-share").click()],
    ["⟲","Reset to Feng Shui",  ()=>$("#btn-reset").click()],
    ["▦","Toggle grid",         ()=>$("#btn-grid").click()],
    ["⌗","Toggle dimensions",   ()=>$("#btn-dims").click()],
    ["🖼","Download PNG",        ()=>$("#btn-png").click()],
    ["↥","Export layout",       ()=>$("#btn-export").click()],
    ["↧","Import layout",       ()=>$("#btn-import").click()],
    ["?","How it works",        ()=>$("#btn-help").click()],
  ];
  menu.innerHTML = `<div class="menu-head">Tools</div>`;
  for (const [ico,label,fn] of items){
    const b = document.createElement("button"); b.className = "menu-item mrow";
    b.innerHTML = `<span class="mi-ico">${ico}</span><span>${label}</span>`;
    b.addEventListener("click", ()=>{ menu.hidden = true; fn(); });
    menu.appendChild(b);
  }
}
function loadPreset(id){
  const pr = window.PRESETS[id];
  pushUndo();
  state.layout = sanitizeLayout({ main: pr.main, roof: pr.roof });
  state.selected = null; save(); render();
  toast(`Loaded "${pr.name}"`, { label:"Undo", fn:undo });
}

/* ---- shareable link (layout encoded in the URL hash, base64url) ---- */
const b64url = {
  enc: s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),
  dec: s => decodeURIComponent(escape(atob(s.replace(/-/g,"+").replace(/_/g,"/")))),
};
function encodeLayout(){
  const enc = fl => state.layout[fl].map(it=>{
    const a=[it.type, it.x, it.y, it.rot]; if (it.color) a.push(it.color); return a;
  });
  return b64url.enc(JSON.stringify({ m:enc("main"), r:enc("roof") }));
}
function applyEncoded(str){
  const o = JSON.parse(b64url.dec(str));
  const dec = a => (a||[]).map(t => ({ type:t[0], x:t[1], y:t[2], rot:t[3], color:t[4] }));
  state.layout = sanitizeLayout({ main: dec(o.m), roof: dec(o.r) });   // drops unknown types
}
function doShare(){
  const code = encodeLayout();
  if (code.length > 8000){ toast("Layout too big for a link — use Export instead"); return; }
  const url = location.origin + location.pathname + "#l=" + code;
  // turn on live-URL mode: the address bar now tracks your edits, so bookmarking
  // this page (or reloading it) saves/restores the CURRENT layout. Safe because
  // the hash stays in sync with localStorage — no stale-snapshot data loss.
  liveUrl = true;
  history.replaceState(null, "", "#l=" + code);
  const ok = ()=> toast("Link copied — opens on any device. Bookmark this page to save it.");
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(ok, ()=> prompt("Copy your layout link:", url));
  } else {
    prompt("Copy your layout link:", url);
  }
}

function wire(){
  $$(".fs-btn").forEach(b=> b.addEventListener("click",()=>switchFloor(b.dataset.floor)));

  $("#btn-presets").addEventListener("click", e=>{
    e.stopPropagation();
    const m=$("#presets-menu"); m.hidden=!m.hidden;
  });
  $("#btn-share").addEventListener("click", doShare);
  $("#btn-more").addEventListener("click", e=>{
    e.stopPropagation();
    const m=$("#more-menu"); const show=m.hidden; $("#presets-menu").hidden=true; m.hidden=!show;
  });
  document.addEventListener("click", e=>{
    const m=$("#more-menu");
    if (!m.hidden && !m.contains(e.target) && e.target.id!=="btn-more") m.hidden=true;
  });
  $("#btn-measure").addEventListener("click", e=>{
    state.measuring = !state.measuring;
    e.currentTarget.classList.toggle("active", state.measuring);
    $(".stage").classList.toggle("measuring", state.measuring);
    if (!state.measuring) state.meas = null;
    select(null);
    if (state.measuring) toast("Measure: drag across the plan to read a distance");
    render();
  });
  document.addEventListener("click", e=>{
    const m=$("#presets-menu");
    if (!m.hidden && !m.contains(e.target) && e.target.id!=="btn-presets") m.hidden=true;
  });

  $("#btn-grid").addEventListener("click", e=>{ state.showGrid=!state.showGrid; e.currentTarget.classList.toggle("active",state.showGrid); render(); });
  $("#btn-dims").addEventListener("click", e=>{ state.showDims=!state.showDims; e.currentTarget.classList.toggle("active",state.showDims); render(); });
  $("#btn-reset").addEventListener("click", ()=> loadPreset("suggested"));  // undoable via the toast
  $("#btn-png").addEventListener("click", exportPNG);
  $("#btn-export").addEventListener("click", exportLayout);
  $("#btn-import").addEventListener("click", ()=> $("#file-import").click());
  $("#file-import").addEventListener("change", e=>{ if(e.target.files[0]) importLayout(e.target.files[0]); e.target.value=""; });

  $("#zoom-in").addEventListener("click", ()=>{ const r=canvas.getBoundingClientRect(); zoomAt(r.width/2,r.height/2,1.2); });
  $("#zoom-out").addEventListener("click", ()=>{ const r=canvas.getBoundingClientRect(); zoomAt(r.width/2,r.height/2,1/1.2); });
  $("#zoom-fit").addEventListener("click", fitView);

  $$("#selbar .sel-tools button").forEach(b=> b.addEventListener("click",()=>act(b.dataset.act)));

  $("#btn-add").addEventListener("click", openCatalog);
  $("#catalog-close").addEventListener("click", closeCatalog);
  $("#catalog-backdrop").addEventListener("click", closeCatalog);
  wireSheetSwipe();

  $("#btn-suggestions").addEventListener("click", ()=>{ $("#suggest-body").innerHTML=suggestionsHTML(); $("#suggest-modal").hidden=false; });
  $("#suggest-close").addEventListener("click", ()=> $("#suggest-modal").hidden=true);
  $("#suggest-modal").addEventListener("click", e=>{ if(e.target.id==="suggest-modal") $("#suggest-modal").hidden=true; });

  $("#btn-help").addEventListener("click", ()=> $("#help-modal").hidden=false);
  $("#help-close").addEventListener("click", ()=> $("#help-modal").hidden=true);
  $("#help-modal").addEventListener("click", e=>{ if(e.target.id==="help-modal") $("#help-modal").hidden=true; });

  // keyboard (desktop)
  let nudgeT = 0;
  window.addEventListener("keydown", e=>{
    if (e.target.tagName==="INPUT") return;
    if ((e.metaKey||e.ctrlKey) && (e.key==="z"||e.key==="Z")){ e.preventDefault(); undo(); return; }
    const it=state.selected;
    if (!it){ if(e.key==="g"){ $("#btn-grid").click(); } return; }
    if (e.key==="Delete"||e.key==="Backspace"){ e.preventDefault(); act("del"); }
    else if (e.key==="r"||e.key==="]"){ act("rot-r"); }
    else if (e.key==="["){ act("rot-l"); }
    else if (e.key==="d"){ act("dup"); }
    else if (e.key==="Escape"){ select(null); }
    else if (e.key.startsWith("Arrow")){
      e.preventDefault(); const step=e.shiftKey?6:1;
      // snapshot once at the start of a run of nudges (debounced)
      if (Date.now()-nudgeT > 600) pushUndo(); nudgeT = Date.now();
      if(e.key==="ArrowLeft") it.x-=step; if(e.key==="ArrowRight") it.x+=step;
      if(e.key==="ArrowUp") it.y-=step; if(e.key==="ArrowDown") it.y+=step;
      render(); save();
    }
  });

  window.addEventListener("resize", ()=>{ resize(); });
}

/* ======================================================================
   BOOT
   ====================================================================== */
function init(){
  let loaded = false;
  if (location.hash.startsWith("#l=")){
    try { applyEncoded(location.hash.slice(3)); loaded = true; liveUrl = true; } catch(e){ /* fall through */ }
  }
  if (!loaded && !load()) state.layout = cloneDefault();
  // last-resort guard: a corrupt layout must never leave a blank screen
  if (!state.layout || !Array.isArray(state.layout.main)) state.layout = cloneDefault();
  buildCatalog();
  buildPresetsMenu();
  buildMoreMenu();
  buildSwatches();
  wire();
  $("#cat-floor-name").textContent = window.FLOORPLAN[state.floor].label;
  resize();
  try { fitView(); } catch(e){ state.layout = cloneDefault(); fitView(); }
  try {
    if (!localStorage.getItem("waverly-tips")){
      setTimeout(()=> toast("Tip: drag to move · double-tap to rotate · pinch to zoom"), 700);
      localStorage.setItem("waverly-tips","1");
    }
  } catch(e){}
}
init();

})();
