# Indie Game Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/game` as a desktop HUD gallery with two left-to-right cards that play Codrops emerge reveals sequentially, linking GrayMoth Squad and a SevenDream placeholder.

**Architecture:** Data list drives the gallery. Codrops emerge WebGL is extracted into `emerge-reveal.ts` + thin `EmergeReveal.astro`. Gallery orchestrates sequential `play()`. Homepage keeps its own Perlin/emerge switch untouched this round.

**Tech Stack:** Astro 6, SCSS, WebGL1 + `OES_standard_derivatives`, TypeScript module scripts, static assets under `public/assets/game/`.

## Global Constraints

- Desktop only — no mobile / narrow-viewport work
- Gallery chrome = existing tech/HUD language (return link, cyan accent, brackets); complex motion = Codrops emerge only
- Reveal style = emerge (centre-out, thin cyan rim, mosaic → image), not Perlin
- Sequential: start next card only after previous `play()` completes
- Duration ~1500ms per card, linear progress
- `prefers-reduced-motion: reduce` → show final cover immediately
- No third full copy of the emerge shader inside the gallery page — use the shared module
- Homepage `CMD_02` must point to `/game`
- SevenDream detail is a minimal placeholder; GrayMoth detail page content stays as-is
- Repo has no unit-test runner — verify with small Node assert scripts + `npm run build` + manual browser checks

## File map

| File | Responsibility |
|------|----------------|
| `src/data/games.ts` | Game list (id, title, tag, href, cover) |
| `public/assets/game/sevendream/sevendream-placeholder.jpg` | Generated SevenDream cover |
| `scripts/generate-sevendream-placeholder.ps1` | One-shot generator for that JPG (optional to keep) |
| `src/scripts/emerge-reveal.ts` | WebGL emerge attach / play / destroy API |
| `src/components/ui/effects/EmergeReveal.astro` | Canvas + static img fallback markup |
| `src/pages/game/index.astro` | Gallery page |
| `src/styles/components/pages/game-gallery.scss` | Gallery HUD layout + horizontal track |
| `src/pages/game/sevendream/index.astro` | Placeholder detail page |
| `src/styles/components/pages/sevendream.scss` | Minimal detail styles (or reuse light graymoth patterns) |
| `src/pages/index.astro` | Change CMD_02 href only |
| `scripts/assert-games-data.mjs` | Tiny Node assert for games data |

---

### Task 1: Games data + SevenDream placeholder cover

**Files:**
- Create: `src/data/games.ts`
- Create: `scripts/generate-sevendream-placeholder.ps1`
- Create: `public/assets/game/sevendream/sevendream-placeholder.jpg`
- Create: `scripts/assert-games-data.mjs`

**Interfaces:**
- Consumes: existing GrayMoth cover at `/assets/game/graymoth-squad/graymoth-squad.jpg`
- Produces:
  - `export type GameEntry = { id: string; title: string; tag: string; href: string; cover: string }`
  - `export const games: GameEntry[]` with exactly two entries in gallery order

- [ ] **Step 1: Write `src/data/games.ts`**

```ts
export type GameEntry = {
  id: string;
  title: string;
  tag: string;
  href: string;
  cover: string;
};

export const games: GameEntry[] = [
  {
    id: 'graymoth-squad',
    title: 'GrayMoth Squad',
    tag: '01',
    href: '/game/graymoth-squad',
    cover: '/assets/game/graymoth-squad/graymoth-squad.jpg',
  },
  {
    id: 'sevendream',
    title: 'SevenDream',
    tag: '02',
    href: '/game/sevendream',
    cover: '/assets/game/sevendream/sevendream-placeholder.jpg',
  },
];
```

- [ ] **Step 2: Write assert script `scripts/assert-games-data.mjs`**

```js
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Astro/TS: compile-free check by reading the file as text for required strings,
// then verify cover files exist on disk.
const root = process.cwd();
const src = fs.readFileSync(path.join(root, 'src/data/games.ts'), 'utf8');
const checks = [
  "id: 'graymoth-squad'",
  "id: 'sevendream'",
  "href: '/game/graymoth-squad'",
  "href: '/game/sevendream'",
  "cover: '/assets/game/graymoth-squad/graymoth-squad.jpg'",
  "cover: '/assets/game/sevendream/sevendream-placeholder.jpg'",
];
for (const c of checks) {
  if (!src.includes(c)) {
    console.error('Missing in games.ts:', c);
    process.exit(1);
  }
}

const covers = [
  'public/assets/game/graymoth-squad/graymoth-squad.jpg',
  'public/assets/game/sevendream/sevendream-placeholder.jpg',
];
for (const rel of covers) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p) || fs.statSync(p).size < 1000) {
    console.error('Missing/too-small cover:', rel);
    process.exit(1);
  }
}
console.log('assert-games-data: OK');
```

- [ ] **Step 3: Run assert — expect fail on missing SevenDream cover**

Run: `node scripts/assert-games-data.mjs`  
Expected: exit 1 with `Missing/too-small cover: public/assets/game/sevendream/sevendream-placeholder.jpg`

- [ ] **Step 4: Write generator `scripts/generate-sevendream-placeholder.ps1`**

```powershell
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\public\assets\game\sevendream'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out = Join-Path $outDir 'sevendream-placeholder.jpg'

$w, $h = 1600, 900
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.Color]::FromArgb(255, 10, 12, 14))

$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 0, 255, 204), 3)
$g.DrawRectangle($pen, 48, 48, $w - 96, $h - 96)

$font = New-Object System.Drawing.Font 'Consolas', 72, ([System.Drawing.FontStyle]::Bold)
$sub = New-Object System.Drawing.Font 'Consolas', 28, ([System.Drawing.FontStyle]::Regular)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 255, 204))
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 255, 255, 255))

$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = 'Center'
$fmt.LineAlignment = 'Center'
$g.DrawString('SEVENDREAM', $font, $brush, (New-Object System.Drawing.RectangleF 0, ($h/2 - 80), $w, 120), $fmt)
$g.DrawString('CMD_02 // PLACEHOLDER COVER', $sub, $white, (New-Object System.Drawing.RectangleF 0, ($h/2 + 40), $w, 60), $fmt)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose(); $bmp.Dispose(); $pen.Dispose(); $font.Dispose(); $sub.Dispose(); $brush.Dispose(); $white.Dispose()
Write-Host "Wrote $out"
```

- [ ] **Step 5: Generate the JPG**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-sevendream-placeholder.ps1`  
Expected: prints `Wrote ...sevendream-placeholder.jpg`

- [ ] **Step 6: Re-run assert — expect pass**

Run: `node scripts/assert-games-data.mjs`  
Expected: `assert-games-data: OK`

- [ ] **Step 7: Commit**

```bash
git add src/data/games.ts scripts/assert-games-data.mjs scripts/generate-sevendream-placeholder.ps1 public/assets/game/sevendream/sevendream-placeholder.jpg
git commit -m "Add games data and SevenDream placeholder cover."
```

---

### Task 2: Shared `emerge-reveal.ts` module

**Files:**
- Create: `src/scripts/emerge-reveal.ts`
- Create: `scripts/assert-emerge-api.mjs`

**Interfaces:**
- Consumes: none from Task 1
- Produces:
  - `export type EmergeRevealOptions = { canvas: HTMLCanvasElement; src: string; durationMs?: number; fill?: [number, number, number]; }`
  - `export type EmergeRevealHandle = { play(): Promise<void>; setProgress(p: number): void; destroy(): void; }`
  - `export function createEmergeReveal(options: EmergeRevealOptions): Promise<EmergeRevealHandle | null>`
  - Returns `null` when WebGL context or program fails
  - `play()` resolves when progress reaches 1 (or immediately if `prefers-reduced-motion: reduce`)
  - Shader behaviour must match homepage emerge: centre superellipse front, `rimWidth=0.035`, `rimSoft=0.025`, `fillAlpha=0.35`, mosaic 11→50, fill `#00ffcc` / `(0,1,0.8)`, duration default `1500`

- [ ] **Step 1: Write API shape assert `scripts/assert-emerge-api.mjs`**

```js
import fs from 'node:fs';
import path from 'node:path';

const p = path.join(process.cwd(), 'src/scripts/emerge-reveal.ts');
if (!fs.existsSync(p)) {
  console.error('missing emerge-reveal.ts');
  process.exit(1);
}
const src = fs.readFileSync(p, 'utf8');
const must = [
  'export async function createEmergeReveal',
  'play(): Promise<void>',
  'setProgress',
  'destroy()',
  'rimWidth = 0.035',
  'fillAlpha = 0.35',
  'OES_standard_derivatives',
  'u_progress',
  'u_fill',
];
for (const m of must) {
  if (!src.includes(m)) {
    console.error('emerge-reveal.ts missing:', m);
    process.exit(1);
  }
}
console.log('assert-emerge-api: OK');
```

- [ ] **Step 2: Run assert — expect fail (file missing)**

Run: `node scripts/assert-emerge-api.mjs`  
Expected: exit 1 `missing emerge-reveal.ts`

- [ ] **Step 3: Implement `src/scripts/emerge-reveal.ts`**

Copy the homepage emerge fragment shader from `src/pages/index.astro` (`emergeFsSrc`, the block that contains `rimWidth = 0.035` through `gl_FragColor = vec4(rgb, alpha)`). Wrap it in this module:

```ts
export type EmergeRevealOptions = {
  canvas: HTMLCanvasElement;
  src: string;
  durationMs?: number;
  fill?: [number, number, number];
};

export type EmergeRevealHandle = {
  play(): Promise<void>;
  setProgress(p: number): void;
  destroy(): void;
};

const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`;

function buildFs(hasDerivatives: boolean): string {
  const prefix = hasDerivatives
    ? '#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES 1\n'
    : '';
  // PASTE the full emerge fragment body from index.astro here (precision + uniforms + helpers + main).
  // Keep rimWidth=0.035, rimSoft=0.025, fillAlpha=0.35, centre-out superellipse front.
  return prefix + `/* ... full GLSL from index.astro emergeFsSrc without the template prefix ... */`;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('emerge shader:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export async function createEmergeReveal(
  options: EmergeRevealOptions,
): Promise<EmergeRevealHandle | null> {
  const canvas = options.canvas;
  const durationMs = options.durationMs ?? 1500;
  const fill = options.fill ?? ([0, 1, 0.8] as [number, number, number]);
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
  if (!gl) return null;

  const hasDerivatives = !!gl.getExtension('OES_standard_derivatives');
  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, buildFs(hasDerivatives));
  if (!vs || !fs) return null;

  const prg = gl.createProgram();
  if (!prg) return null;
  gl.attachShader(prg, vs);
  gl.attachShader(prg, fs);
  gl.linkProgram(prg);
  if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
    console.error('emerge link:', gl.getProgramInfoLog(prg));
    return null;
  }
  gl.useProgram(prg);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prg, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  let img: HTMLImageElement;
  try {
    img = await loadImage(options.src);
  } catch (e) {
    console.error(e);
    return null;
  }

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const uRes = gl.getUniformLocation(prg, 'u_res');
  const uImgRes = gl.getUniformLocation(prg, 'u_imgRes');
  const uOff = gl.getUniformLocation(prg, 'u_off');
  const uProgress = gl.getUniformLocation(prg, 'u_progress');
  const uFill = gl.getUniformLocation(prg, 'u_fill');

  let progress = 0;
  let raf = 0;
  let dead = false;

  const draw = (p: number) => {
    if (dead) return;
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    if (w < 1 || h < 1) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    gl.uniform2f(uImgRes, img.width, img.height);
    gl.uniform2f(uOff, 0, 0);
    gl.uniform1f(uProgress, p);
    gl.uniform3f(uFill, fill[0], fill[1], fill[2]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const setProgress = (p: number) => {
    progress = Math.max(0, Math.min(1, p));
    draw(progress);
  };

  const reduceMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const play = () =>
    new Promise<void>((resolve) => {
      if (dead) {
        resolve();
        return;
      }
      if (reduceMotion) {
        setProgress(1);
        resolve();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        if (dead) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / durationMs);
        setProgress(t);
        if (t >= 1) {
          raf = 0;
          resolve();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

  const destroy = () => {
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    // leave GL objects; page navigation drops context
  };

  setProgress(0);
  return { play, setProgress, destroy };
}
```

**Critical:** In Step 3 the implementer must paste the real GLSL body from `index.astro` into `buildFs` — not leave the comment placeholder. Include every helper (`cover`, `scene`, `map`, `cubicOut`, `quadraticOut`, `pristineGrid`) and `main()`.

- [ ] **Step 4: Run assert — expect pass**

Run: `node scripts/assert-emerge-api.mjs`  
Expected: `assert-emerge-api: OK`

- [ ] **Step 5: Commit**

```bash
git add src/scripts/emerge-reveal.ts scripts/assert-emerge-api.mjs
git commit -m "Extract shared Codrops emerge WebGL reveal module."
```

---

### Task 3: `EmergeReveal.astro` wrapper

**Files:**
- Create: `src/components/ui/effects/EmergeReveal.astro`

**Interfaces:**
- Consumes: none at runtime from Task 2 (markup only; gallery boots the script)
- Produces: DOM contract
  - Root: `.emerge-reveal` with `data-emerge-src={src}`
  - Child canvas: `canvas.emerge-reveal__canvas`
  - Child img: `img.emerge-reveal__fallback` with `src`, `alt`, initially visible until WebGL succeeds (or stays as fallback if create returns null)

- [ ] **Step 1: Create the component**

```astro
---
interface Props {
  src: string;
  alt?: string;
  class?: string;
}
const { src, alt = '', class: className = '' } = Astro.props;
---

<div class={`emerge-reveal ${className}`.trim()} data-emerge-src={src}>
  <canvas class="emerge-reveal__canvas" aria-hidden="true"></canvas>
  <img class="emerge-reveal__fallback" src={src} alt={alt} decoding="async" />
</div>

<style>
  .emerge-reveal {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #050607;
  }
  .emerge-reveal__canvas,
  .emerge-reveal__fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .emerge-reveal__fallback {
    object-fit: cover;
  }
  .emerge-reveal.is-gl .emerge-reveal__fallback {
    opacity: 0;
    pointer-events: none;
  }
  .emerge-reveal.is-gl .emerge-reveal__canvas {
    z-index: 1;
  }
</style>
```

- [ ] **Step 2: Sanity — file exists and contains the data attribute**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('src/components/ui/effects/EmergeReveal.astro','utf8'); if(!s.includes('data-emerge-src')||!s.includes('emerge-reveal__canvas')) process.exit(1); console.log('OK')"`  
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/effects/EmergeReveal.astro
git commit -m "Add EmergeReveal Astro wrapper for gallery cards."
```

---

### Task 4: Gallery page `/game` + styles + sequential play

**Files:**
- Create: `src/pages/game/index.astro`
- Create: `src/styles/components/pages/game-gallery.scss`
- Modify: none yet for homepage (Task 6)

**Interfaces:**
- Consumes: `games` from `src/data/games.ts`; `EmergeReveal` component; `createEmergeReveal` from `src/scripts/emerge-reveal.ts`
- Produces: route `/game` with horizontal track; sequential `await handle.play()` in gallery order

- [ ] **Step 1: Write `game-gallery.scss`**

```scss
.gg-page {
  position: fixed;
  inset: 0;
  background: #050607;
  color: #fff;
  font-family: 'Consolas', 'Courier New', monospace;
  overflow: hidden;
}

.gg-nav-top {
  position: absolute;
  top: 28px;
  left: 40px;
  z-index: 20;

  .return-link {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    letter-spacing: 0.12em;
    font-size: 0.85rem;
    &:hover { color: #00ffcc; }
  }
}

.gg-header {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 20;

  .gg-kicker {
    color: #00ffcc;
    letter-spacing: 0.28em;
    font-size: 0.75rem;
  }
  .gg-sub {
    margin-top: 8px;
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
}

.gg-track-wrap {
  position: absolute;
  inset: 110px 0 48px;
  overflow-x: auto;
  overflow-y: hidden;
}

.gg-track {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 48px;
  height: 100%;
  padding: 0 80px;
  width: max-content;
  min-width: 100%;
}

.gg-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(720px, 70vw);
  text-decoration: none;
  color: inherit;
  flex: 0 0 auto;
}

.gg-card__frame {
  position: relative;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(0, 255, 204, 0.35);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.gg-card__meta {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 0 4px;
}

.gg-card__tag {
  color: #00ffcc;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
}

.gg-card__title {
  font-size: 1.1rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Write `src/pages/game/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import EmergeReveal from '../../components/ui/effects/EmergeReveal.astro';
import { games } from '../../data/games';
import '../../styles/components/pages/game-gallery.scss';
---

<BaseLayout title="Games - Volleier" showNav={false} showFooter={false} showLoading={false}>
  <div class="gg-page">
    <div class="gg-nav-top">
      <a href="/" class="return-link"><span class="lnr">←</span> SYS.RETURN_ROOT</a>
    </div>
    <header class="gg-header">
      <div class="gg-kicker">CMD_02 // GAMES</div>
      <div class="gg-sub">Select unit · horizontal archive</div>
    </header>

    <div class="gg-track-wrap">
      <div class="gg-track" data-gg-track>
        {games.map((g) => (
          <a class="gg-card" href={g.href} data-gg-card>
            <div class="gg-card__frame">
              <EmergeReveal src={g.cover} alt={g.title} />
            </div>
            <div class="gg-card__meta">
              <span class="gg-card__tag">{g.tag}</span>
              <span class="gg-card__title">{g.title}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  </div>
</BaseLayout>

<script>
  import { createEmergeReveal } from '../../scripts/emerge-reveal';

  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-emerge-src]'));
  const handles = [];

  for (const root of roots) {
    const src = root.dataset.emergeSrc;
    const canvas = root.querySelector<HTMLCanvasElement>('.emerge-reveal__canvas');
    if (!src || !canvas) continue;
    const handle = await createEmergeReveal({ canvas, src });
    if (handle) {
      root.classList.add('is-gl');
      handles.push(handle);
    }
  }

  for (const handle of handles) {
    await handle.play();
  }
</script>
```

- [ ] **Step 3: Build**

Run: `npm run build`  
Expected: success; `dist/game/index.html` exists

- [ ] **Step 4: Manual browser check (desktop)**

1. `npm run dev` → open `http://localhost:4321/game`
2. Confirm two cards in one horizontal row; scroll sideways if needed
3. Confirm GrayMoth reveals first, then SevenDream (not simultaneous)
4. Confirm titles/tags under frames
5. Click each card → correct detail URL (SevenDream 404 until Task 5 is fine for GrayMoth only; re-check both after Task 5)

- [ ] **Step 5: Commit**

```bash
git add src/pages/game/index.astro src/styles/components/pages/game-gallery.scss
git commit -m "Add /game HUD gallery with sequential emerge card reveals."
```

---

### Task 5: SevenDream placeholder detail page

**Files:**
- Create: `src/pages/game/sevendream/index.astro`
- Create: `src/styles/components/pages/sevendream.scss`

**Interfaces:**
- Consumes: placeholder cover path from games data
- Produces: `/game/sevendream` with return link to `/game`

- [ ] **Step 1: Write SCSS**

```scss
.sd-page {
  position: fixed;
  inset: 0;
  background: #050607;
  color: #fff;
  font-family: 'Consolas', 'Courier New', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sd-nav-top {
  position: absolute;
  top: 28px;
  left: 40px;
  z-index: 20;
  .return-link {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    letter-spacing: 0.12em;
    font-size: 0.85rem;
    &:hover { color: #00ffcc; }
  }
}

.sd-center {
  text-align: center;
  max-width: 720px;
  padding: 40px;
}

.sd-kicker {
  color: #00ffcc;
  letter-spacing: 0.28em;
  font-size: 0.75rem;
  margin-bottom: 16px;
}

.sd-title {
  font-size: 3.5rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.sd-note {
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.18em;
  font-size: 0.85rem;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Write page**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import '../../../styles/components/pages/sevendream.scss';
---

<BaseLayout title="SevenDream - Volleier" showNav={false} showFooter={false} showLoading={false}>
  <div class="sd-page">
    <div class="sd-nav-top">
      <a href="/game" class="return-link"><span class="lnr">←</span> SYS.RETURN_GALLERY</a>
    </div>
    <main class="sd-center">
      <div class="sd-kicker">CMD_02 // UNIT 02</div>
      <h1 class="sd-title">SevenDream</h1>
      <p class="sd-note">Placeholder archive · content pending</p>
    </main>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Build + smoke**

Run: `npm run build`  
Expected: `dist/game/sevendream/index.html` exists

Manual: `/game` → click SevenDream → lands on placeholder; return goes to `/game`

- [ ] **Step 4: Commit**

```bash
git add src/pages/game/sevendream/index.astro src/styles/components/pages/sevendream.scss
git commit -m "Add SevenDream placeholder detail page."
```

---

### Task 6: Point homepage CMD_02 at `/game`

**Files:**
- Modify: `src/pages/index.astro` (the `CMD_02 // 独立游戏` anchor only)

**Interfaces:**
- Consumes: `/game` route from Task 4
- Produces: homepage button href `/game`

- [ ] **Step 1: Change the link**

Find:

```astro
<a href="/game/graymoth-squad" class="tech-button">
```

Replace with:

```astro
<a href="/game" class="tech-button">
```

Do not change the visible label `独立游戏`.

- [ ] **Step 2: Verify with ripgrep**

Run: `rg "CMD_02|href=\"/game" src/pages/index.astro`  
Expected: `href="/game"` near CMD_02; no remaining `href="/game/graymoth-squad"` on that button

- [ ] **Step 3: Build**

Run: `npm run build`  
Expected: success

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Route homepage indie-games command to the /game gallery."
```

---

### Task 7: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Re-run asserts**

```bash
node scripts/assert-games-data.mjs
node scripts/assert-emerge-api.mjs
npm run build
```

Expected: all OK / build complete

- [ ] **Step 2: Manual checklist (desktop browser)**

- [ ] Homepage `独立游戏` → `/game`
- [ ] `/game` shows two 16:9 cards in one horizontal row
- [ ] Overflow scrolls horizontally when needed
- [ ] Emerge plays on card 1, then card 2
- [ ] Reduced-motion (if toggled) shows covers immediately
- [ ] GrayMoth card → `/game/graymoth-squad`
- [ ] SevenDream card → `/game/sevendream` → return → `/game`
- [ ] WebGL-off fallback still shows static images (DevTools sensor / disable WebGL if practical; otherwise confirm fallback markup present)

- [ ] **Step 3: No commit unless fixes were needed**  
If fixes were required, commit them with a message describing the fix.

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| `/game` gallery | 4 |
| Homepage → `/game` | 6 |
| Keep GrayMoth detail | (unchanged; linked) |
| SevenDream placeholder detail | 5 |
| games data list | 1 |
| Placeholder cover asset | 1 |
| HUD chrome + horizontal scroll | 4 |
| Labels + click-through | 4 |
| Shared emerge module | 2–3 |
| Sequential play | 4 |
| Reduced motion | 2 |
| WebGL fallback | 3 + 4 |
| Desktop only / no mobile | Global + SCSS (no breakpoints added) |
| No third shader copy in gallery | 2–4 |

## Placeholder scan

- Task 2 Step 3 explicitly requires pasting real GLSL from `index.astro` (comment is a paste instruction, not a leftover TBD in the shipped file).
- No other TBDs.
