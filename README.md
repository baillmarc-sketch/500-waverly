# 500 Waverly — Penthouse 4 Layout Studio

An interactive, to-scale floor planner for **500 Waverly Ave, PH4 (Clinton Hill, Brooklyn)**.
Drag furniture around the real apartment footprint to plan how you'll live there — works on
phone and desktop, no build step, no internet required.

## Open it

Just open `index.html` in any modern browser.

```bash
# or serve locally (nice on mobile over your wifi)
python3 -m http.server 8080
# then visit http://localhost:8080
```

Open it directly as a file (`file://…/index.html`) and it works too — everything is plain
HTML/CSS/JS with no dependencies.

## What it does

- **Two levels** — toggle between the **Main Level** and the **Roof Deck** up top.
- **To scale** — the plan is traced from the listing floor plan (Living/Dining 25'2"×17'6",
  Primary Bedroom 11'8"×11'0", Kitchen 9'10"×8'2", Balcony 24'8"×5'0", Terrace 33'6"×25'3").
  Every furniture piece uses real dimensions, so if it fits here it fits in real life.
- **Drag, rotate, duplicate, delete** — tap a piece to select it; drag to move (snaps to a
  2" grid), use the rotate knob or the toolbar. Pieces glow red if they overlap.
- **Furniture catalog** — tap **＋ Add furniture** (or the right panel on desktop) to drop in
  beds, sofas, a sectional, dining tables, desks, closet shelving, outdoor pieces, rugs, and more.
- **Mobile + desktop** — pinch to zoom, drag to pan (wheel-zoom on desktop). Big touch targets.
- **Auto-saves** to your browser. Export/Import your layout as JSON to share or back up.
- **💡 Ideas** — built-in interior-design notes tailored to this unit and your needs
  (sectional vs. two sofas, dining for 6+, walk-in-closet build-out options, the roof office
  nook, terrace zoning, and more).

A suggested starting layout is pre-loaded: queen bed + 2 nightstands + dresser in the bedroom,
shelving in the WIC, a sectional / coffee table / TV wall / bookshelves in the living room, a
dining table for 6 by the kitchen, a desk on the roof landing, and the outdoor furniture
arranged across the balcony and terrace.

## Accuracy note

Room **labels and their dimensions come straight from the published floor plan**; the
surrounding wall geometry is a close approximation. Once you have the keys and a tape measure,
fine-tune the numbers in **`data.js`** (`window.FLOORPLAN`) — coordinates are in inches,
origin top-left, north is up.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup + UI shell |
| `styles.css` | Styling (warm "home" palette, responsive) |
| `data.js`    | Floor plan geometry, furniture catalog, default layout — **edit here to tune** |
| `app.js`     | Canvas renderer, gestures, selection, persistence |
