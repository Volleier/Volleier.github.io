# Indie Game Gallery Design

Date: 2026-10-13  
Status: Approved for planning  
Approach: A — shared WebGL emerge reveal + data-driven gallery

## Goal

Add a desktop gallery page that showcases Volleier’s games in a left-to-right horizontal strip. Each game is a rectangular card whose cover image uses the Codrops-style **emerge** reveal (cyan rim + mosaic → full image). Site chrome stays tech/HUD; complex motion comes from Codrops emerge only.

## Non-goals

- Mobile / narrow-viewport layout
- Perlin dissolve on gallery cards
- Replacing existing GrayMoth Squad detail page content beyond linking from the gallery
- Full SevenDream product page content (placeholder shell only)

## Routing

| Path | Role |
|------|------|
| `/game` | New gallery page |
| `/game/graymoth-squad` | Existing detail page (unchanged purpose) |
| `/game/sevendream` | New minimal placeholder detail page |

Homepage `CMD_02 // 独立游戏` currently links to `/game/graymoth-squad`. Change it to `/game`.

## Content model

Single source list (preferred: `src/data/games.ts`, or equivalent constant consumed by the gallery page):

```ts
type GameEntry = {
  id: string;
  title: string;
  tag?: string;       // e.g. "01" / short HUD label
  href: string;       // detail route
  cover: string;      // public image URL
};
```

Initial entries:

1. **GrayMoth Squad** — cover `/assets/game/graymoth-squad/graymoth-squad.jpg` — href `/game/graymoth-squad`
2. **SevenDream** — generated placeholder cover at `/assets/game/sevendream/sevendream-placeholder.jpg` — href `/game/sevendream`

Adding a third game later = append one entry (+ cover asset + optional detail page).

## Page chrome (`/game`)

Use `BaseLayout` with the same pattern as game detail pages where sensible: `showNav={false}`, `showFooter={false}`, `showLoading={false}` (gallery does not need the hex loading screen).

Structure:

1. Top return link: `← SYS.RETURN_ROOT` → `/`
2. Light header: e.g. `CMD_02 // GAMES` plus a short subtitle
3. Main horizontal track of game cards
4. Corner / accent treatments consistent with existing tech/HUD language (cyan emphasis, brackets, no new purple/glow aesthetic)

Ignore mobile layout and touch-specific UX. Desktop horizontal overflow scrolling is enough (native overflow-x; optional wheel-to-horizontal if cheap; no mobile breakpoints required).

## Card UI

Each card:

- Large rectangular frame (landscape cover, ~16:9 preferred)
- WebGL canvas (or equivalent) filling the image area, running **emerge** reveal
- Label under (or tightly adjacent to) the frame: game title + optional tag
- Entire card is a link to `href`

Two cards sit in one fixed horizontal row. Track may be wider than the viewport; user scrolls left/right.

## Reveal behaviour (Codrops emerge)

Reuse the emerge pipeline already present behind `REVEAL_STYLE === 'emerge'` on the homepage:

- Centre-out expansion
- Thin cyan rim ahead of mosaic
- Mosaic refinement then fade to full image
- Duration ~1.5s per card (linear progress, same family as prior port)

Playback:

- On gallery enter, cards reveal **sequentially**: start the next card only after the previous card’s reveal completes
- `prefers-reduced-motion: reduce`: skip animation; show final cover immediately

## Architecture (Approach A)

### Shared emerge module

Extract emerge WebGL into:

- `src/scripts/emerge-reveal.ts` — core attach / play / complete API
- `src/components/ui/effects/EmergeReveal.astro` — thin Astro wrapper that mounts a canvas and boots the script

Responsibilities:

- Attach to a canvas + image URL
- Compile/run emerge fragment shader (OES_standard_derivatives when available; omit grid lines if missing)
- `play()` / `setProgress(1)` API for sequential control
- Premultiplied alpha / transparent clear so page background shows outside the reveal

Homepage may keep its current `REVEAL_STYLE` switch for now. Optional follow-up (out of scope unless cheap): wire homepage `emerge` path to the shared module so the two copies do not drift. **Gallery must use the shared module; do not paste a third full copy into the gallery page.**

### Gallery page

- `src/pages/game/index.astro` — layout + track + cards from data
- Styles: `src/styles/components/pages/game-gallery.scss` (or similar), matching HUD tone

### SevenDream placeholder

- Minimal detail page mirroring GrayMoth shell structure enough to land a click: return to `/game`, title “SevenDream”, no fake full product content
- Placeholder cover image: generate a simple dark + cyan typographic cover asset committed under `public/assets/game/sevendream/`

## Interaction summary

| Action | Result |
|--------|--------|
| Click GrayMoth card | Navigate to `/game/graymoth-squad` |
| Click SevenDream card | Navigate to `/game/sevendream` |
| Return link on gallery | `/` |
| Return on SevenDream | `/game` (gallery remains the hub) |
| Horizontal scroll | Pan the card track |

## Error / fallback

- If WebGL unavailable: show static `<img>` cover (no reveal)
- If cover fails to load: keep empty/dark frame; do not block other cards’ reveals

## Testing checklist

- Homepage CMD_02 opens `/game`
- Two cards visible in one horizontal row; overflow scrolls horizontally on desktop
- Sequential emerge plays on load; reduced-motion shows final images
- GrayMoth and SevenDream cards navigate correctly
- Placeholder cover and SevenDream page exist and look on-brand enough for HUD chrome
- Mobile explicitly not required

## Open decisions resolved

- Approach A approved
- Second game name: SevenDream (placeholder content)
- Labels + click-through both required
- Sequential reveal on enter
- Horizontal scrollable row; no narrow-screen work
- HUD chrome + Codrops for the complex reveal only
- Mobile ignored
