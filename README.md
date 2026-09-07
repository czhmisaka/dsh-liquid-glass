# dsh-liquid-glass

**Liquid Glass theme for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)** — translucent frosted surfaces over a screen-anchored **digital sea**: flowing color bands, ascii digit rain, and character-spray foam, **continuous across browser windows**.

English | [中文](README.zh.md)

## What it looks like

- Frosted glass panes (backdrop blur + specular edges) over a live WebGL sea
- A full-width sea shader with six layers: grid, ascii digit rain, flowing color bands, character-spray foam — wave line and god rays available but shipped off
- The sea is **pinned to your physical desktop**: open two browser windows side by side (or overlapping) and both show different slices of **one continuous ocean** — drag a window and it becomes a porthole sliding over the same water
- A settings page with live controls: sea palette (dark violet / warm orange), custom band colors with a 🎲 random roll, band flow speed, digit size / brightness / flicker, character foam toggle + amount, color wave, wallpaper opacity, glass blur strength

## Install

Copy (or clone) this repo and point your dsh web profile at the built artifacts.

```sh
git clone https://github.com/czhmisaka/dsh-liquid-glass.git
cd dsh-liquid-glass
pnpm install        # or: npm install
pnpm build          # emits lib/index.mjs (host) + lib/client.js (browser)
```

Deploy into a dsh profile:

```sh
DEST=~/.dsh/profiles/web/plugins/liquid-glass
mkdir -p "$DEST"
cp package.json "$DEST/"
cp lib/index.mjs "$DEST/host.js"
cp lib/client.js "$DEST/lib/client.js"   # mkdir -p "$DEST/lib" first
```

Enable it in the profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: liquid-glass
      name: './plugins/liquid-glass/host.js'
```

Restart dsh, open Settings → **液态玻璃 (Liquid Glass)**, flip the enable toggle.

> The host half registers the durable settings section; the browser half registers the theme, mounts the sea wallpaper, and hosts the settings page. `react` / `react/jsx-runtime` are resolved from the dsh shell's shared module table — they are external on purpose (a second React instance breaks hooks).

## The screen-anchored ocean

The sea is one procedural plane pinned to the physical desktop (a 1920×1080 css normalization window). Every browser window computes its viewport's position in screen coordinates and renders **only the slice its viewport covers**:

```
uv = (fragment px + window origin on screen) / ocean size
```

- Overlapping windows show the **identical water** at the same screen position — continuity needs no window-to-window messaging at all
- Windows may go off-screen or span monitors: the procedural field is unbounded, and dpr cancels in the uv ratio, so mixed-density monitors share one sea
- Band phase derives from a **shared wrapped wall clock** (`t mod 65536 s`), so all windows flow in lockstep — and stay inside float32 uniform precision (an absolute epoch second would lose every sub-second bit and freeze the animation)

See [the design note](.agents-note.md) for the full decision record, rejected alternatives (fleet bounding box, absolute epoch phase, BroadcastChannel coordination), and consequences.

## The layers

| Layer | Default | What it draws |
|---|---|---|
| grid | on | faint structural grid |
| ascii rain | on | falling monospace glyphs, density/brightness/flicker adjustable |
| gradient bands | on | fbm-warped flowing color bands (the sea itself) |
| ~~god rays~~ | off | light shafts |
| ~~wave line~~ | off | mid-screen wave line |
| character foam | on | glyph spray along the band shorelines, mutating ~3×/s |

Foam rides the **real band shoreline**: the shader computes the band phase once per fragment (`bandPhase`) and shares it between the gradient color mapping and the foam mask, so the spray always tracks the visible wave edges.

## Development

```sh
pnpm test       # vitest: wallpaper mount/unmount + ocean placement continuity math
pnpm build      # esbuild: lib/index.mjs + lib/client.js
```

The sea shader lives in `src/client/sea-background-script.ts` as a bundled IIFE string (from [@xietuier/matrix-rain](https://github.com/czhmisaka/matrix-rain), MIT, extended with the foam layer, placement uniforms, and the wrapped clock). Everything else is plain TS + React.

## License

MIT
