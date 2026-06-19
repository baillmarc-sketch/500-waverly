# 500 Waverly PH4 — Render Hand-off Package
### Everything to paste into Nano Banana (Gemini) or ChatGPT to get photo-real, on-architecture renders

Pair this with `DESIGN-BRIEF.md` (the *why*). This file is the *how* — the exact
images to attach, the master prompt, and per-room prompts. Optimized for the
**image-editing** workflow so results stay true to the real apartment.

---

## 0. Which tool & mode
- **Best:** **Nano Banana (Gemini app)** in **image-edit mode** — attach a real room photo
  as the base, attach the mood board as style reference, paste the prompt. It restyles the
  *actual* geometry → looks like your apartment, not a stock room.
- **Backup:** **ChatGPT (DALL·E / GPT image)** — attach the same images; good for the
  from-scratch versions and a second look. It will reinvent geometry more, so trust Nano
  Banana for "true to the unit."
- No API or pro account needed — both work from the consumer apps with uploads.

## 1. What to attach (per render)
1. **Base photo** of the room you're rendering (your listing/walk-through photos):
   - Kitchen → the walnut-peninsula photo.
   - Living/Dining → the corner-glass wide shot.
   - Bedroom → your best bedroom photo (or skip base and go from-scratch using §4).
2. **Style reference** → the **mood board** image (every render).
3. *(Optional)* a **floor-plan screenshot** from the live planner for proportions —
   open the planner, fit the view, screenshot each level.

> Tip: attach the **base photo first, mood board second**, then paste the prompt.
> In Nano Banana you can literally say "use image 1 as the room, image 2 as the style."

## 2. Master prompt (paste this ONCE at the top of every chat)
> **Project:** Restyling a real NYC penthouse (500 Waverly Ave, PH4, ~1-bed). I'll give you a
> photo of a room (image 1) and a mood board (image 2). **Keep image 1's architecture exactly:**
> same windows, wall positions, cabinet/island layout, ceiling beams, oak floor, proportions and
> camera. **Restyle only the furniture, styling, materials, and (when I say so) wall color** to
> match the mood board: *Warm, Edited, Modern — a gallery dinner-party apartment.*
>
> **Palette:** cream, warm-white, taupe, oatmeal, charcoal, tobacco, black; small accents of
> deep-red, cobalt, mustard, forest-green, burnt-orange. **Woods:** walnut + white oak.
> **Metals:** brushed steel + aged brass. **Materials:** bouclé, linen, canvas, travertine,
> tobacco leather, ceramic. **Mood:** collected, not precious, low-slung seating, art-forward,
> candlelit dinner-party warmth, music, late nights.
>
> **Photography:** photorealistic editorial interior, 24–35mm, eye-level, straight verticals,
> soft natural window light (golden or blue hour), warm practical lamps/candles. **Avoid:**
> clutter, glossy CGI, oversaturation, fisheye, warped lines, text, watermarks, people.
>
> Output 3:2 landscape. I'll request rooms one at a time. Reply "ready" and I'll send the first.

## 3. Per-room EDIT prompts (use with the base photo)
Run each in **Version A** (keep navy + blush) and **Version B** (warm the walls).

### Kitchen
- **A:** "Use image 1 as the exact kitchen (keep walnut cabinets, white quartz waterfall
  peninsula, white uppers, range, pendants, oak floor, the blush and navy walls). Restyle to the
  mood board: add brass hardware accents, a leaned artwork, a ceramic bowl of citrus, a tobacco
  leather stool, warm under-cabinet light, a kilim runner. Late-afternoon daylight. Keep it
  minimal and warm."
- **B:** "…same, but repaint the navy wall a warm **bronze-olive** and the accent wall a soft
  **clay/plaster**; keep everything else identical. Golden-hour light."

### Living + Dining (hero shot)
- **A:** "Use image 1 as the exact room (keep the black-framed corner windows, view, navy walls,
  oak floor, exposed beams, camera). Replace furniture to match the mood board: a low **oatmeal
  bouclé** sectional, a **sculptural shearling lounge chair**, a round travertine coffee table, a
  dark-wood media console with wall-mounted TV; beyond it a round **walnut dining table** set for
  a dinner party with mixed modern chairs, taper candles, a low floral bowl. Add a faded rust-red
  rug, plants, large gallery art. Blue-hour outside, warm lamps and candles inside."
- **B:** "…same furniture and staging, but navy walls repainted **warm charcoal / bronze-olive**
  and the palette pushed earthier (tobacco, olive, mustard accents), aged-brass fixtures."

### Bedroom
- **A:** "Use image 1 as the exact bedroom (keep corner windows, oak floor, proportions, blush
  accent wall). Style to the mood board: a low **walnut platform bed** on the solid wall, dark-wood
  nightstands, two **mushroom lamps**, cream/taupe linen bedding with one tobacco throw, a large
  calm artwork over the bed, a low dresser under the window. Soft morning light, warm, uncluttered."
- **B:** "…same, but walls in warm **clay/plaster** with a deep **forest-green or bronze-olive**
  headboard wall; optional brass sconces. Keep the walnut bed and corner windows."

## 4. No good base photo? From-scratch prompt
Drop "use image 1 as the room," keep the mood board attached, and prepend the room's size +
key features from §5, e.g.: *"Generate a photorealistic ~9'10"×8'2" kitchen with a walnut
U-shape and white-quartz waterfall peninsula, white uppers, two dome pendants, oak floor,
one blush + one navy wall, exposed ceiling beams…"* then the styling from §3.

## 5. Floor plan & dimensions (paste as context)
All interior, approximate, from the planner data:
- **Living / Dining:** 25'2" × 17'6" — open-plan, floor-to-ceiling **black-framed corner glass**,
  navy accent walls, exposed beams, white-oak floors.
- **Kitchen:** 9'10" × 8'2" — **U-shape**: walnut cabinets, white-quartz **waterfall peninsula**
  with sink (faces the living/dining), back-wall range + white uppers, tall fridge/pantry column.
- **Primary Bedroom:** 11'8" × 11'0" — **corner windows**, bed in command position on the solid
  east wall, walk-in closet adjacent.
- **Balcony (off living):** 24'8" × 5'0" — narrow, plants massed at the east end.
- **Roof Terrace:** 33'6" × 25'3" — with an enclosed stair-bulkhead **landing** (the indoor
  office nook), and a water-tower / Brooklyn skyline view.
- **Finishes throughout:** white-oak floors, white ceilings with **exposed beams**, navy + blush
  accent walls, nickel/chrome dome pendants, black window frames.

## 6. Pro tips for "looks almost real"
- **One variable at a time.** Get the architecture locked first, then change palette, then swap
  furniture. Don't ask for everything new at once.
- **Reuse the thread** so the model keeps the room consistent across A/B and across rooms.
- **Name the camera** ("keep the same camera angle as image 1") to avoid it wandering.
- **Ask for 2–3 variations**, then "keep this one, only change X."
- **Upscale** the winner (both apps have a higher-res / "enhance" option) before sharing.
- **For a cohesive set,** render the living/dining hero first, then tell the model
  "match the lighting and palette of the previous image" for the others.
