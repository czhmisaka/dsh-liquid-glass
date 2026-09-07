# Agent Note: Digital sea — screen-anchored multi-window ocean and layered sea effects

Status: implemented

English | [中文](2026-09-07-digital-sea-screen-anchored-ocean.zh.md)

## Problem

The Liquid Glass theme's sea background rendered one self-contained canvas per browser window: every window showed the whole ocean compressed into its own viewport, so two windows side by side displayed two unrelated seas, and the layer set (grid, ascii rain, gradient bands, god rays, wave line) was hard-coded with no user control. The ascii digit grid was fixed at ~12 px cells with wide glyph spacing, and every visual dial — band palette, foam, digit density — lived only in shader constants.

## Decision

**Screen-anchored ocean.** The sea is one procedural plane pinned to the physical desktop, normalized to a constant 1920x1080 css window. Each browser window computes its viewport's position in screen coordinates (`screenX/screenY` corrected by `outerWidth-innerWidth` / `outerHeight-innerHeight` chrome offsets) and renders only the slice its viewport covers: `uv = (fragCoord + uOrigin) / uOcean`. Overlapping windows show the identical water at the same screen position — continuity needs no peer exchange, no bounding box, and nothing rescales when windows open, move, or close. Window moves fire no DOM event, so each window re-reads its screen coordinates on a 1 s poll and pushes new uniforms only when they changed. Mixed-density monitors stay continuous because dpr multiplies origin and ocean alike and cancels in the uv ratio.

**Shared wrapped wall clock.** Band phase must agree across windows, so time no longer accumulates per window. Every window converges its phase toward `(wallClockSeconds mod 65536)` with a per-frame pull (`t += (shared - t) * min(1, dt*0.5)` after advancing by `dt*speed`), which cancels both start offsets and speed-change drift. The wrap is not cosmetic: an absolute epoch second (~1.7e9) sent through `uniform1f` loses every sub-second bit at float32's 24-bit mantissa (quantization ~128 s), which froze the animation entirely — the mod keeps ~4 ms resolution. All windows wrap simultaneously, so the once-per-18 h tide shift is cross-window consistent.

**Layered effects, settings-driven.** The shader's layer checks became true bitmask tests (`mod(floor(L/bit), 2.0)`) — the original threshold form (`L >= 16.0`) made a higher layer bit silently re-enable a lower disabled one. The wave line and god rays ship disabled. New layers and uniforms:

- `bandPhase(uv, t, distortion, seed, out b1)` — the gradient's fbm/warp pipeline extracted so the phase is computed once per fragment and shared by the gradient color mapping and the foam mask; the foam therefore rides the exact band shoreline instead of an approximation.
- Character-spray foam (layer bit 32): per-cell random glyphs sampled from the ascii atlas, re-rolled ~3x/s, masked by the wobbling shore band and a clumping noise, with a thin solid waterline at the crest. `patch` is a GLSL reserved word; the variable is `clumps`.
- Digit/foam dials as uniforms — `uDigitCols` (density multiplier inverted to `56/digitSize` so larger settings mean larger digits), `uDigitBright`, `uDigitFlicker`, `uFoamAmount` — pushed live through a `setEffects` instance API from the durable settings section.

Settings additions (host schema + shared vocabulary): `colorMode` (`theme`/`custom` with two color pickers and a random-pair roll), `digitSize`, `digitBrightness`, `digitFlicker`, `foam`, `foamAmount`. All apply live through the existing settingsScope → applyParams chain; nothing requires a disable/enable cycle. The glass sheets lighten to match: sea scrim 32%→10%, center/details blur 6px→2px, and the theme's pane fill tokens drop ~30% so the sea reads through the UI.

## Alternatives considered

**Fleet bounding box (per-window slice of all live windows' union).** Implemented first, rejected: two windows reporting overlapping or equal rects still aligned, but every fleet change rescaled the whole ocean, and the chrome-offset approximation showed at seams. The screen-anchored plane deletes the coordination problem instead of solving it.

**Absolute wall-clock phase (no wrap).** Rejected after shipping it: float32 uniforms quantized 1.7e9 s to 128 s steps and the bands degenerated into per-frame noise. Any large fixed epoch only postpones the cliff (int-bit budget grows with epoch age); the wrapped clock bounds the magnitude permanently at the cost of one phase jump per wrap, which all windows take simultaneously.

**BroadcastChannel fleet coordination.** Implemented for the bounding-box model, deleted with it: the screen-anchored plane needs no peer state, and removing the channel removes stale-peer pruning, heartbeat timers, and the boot-order question entirely.

**Per-window god rays.** Deferred: rays anchor at a uv point, so multiple monitors would each need their own anchor — that requires knowing which monitor a window is on, which the pure screen-coordinate model deliberately does not need. Rays stay off; revisiting costs one layer bit.

## Consequences

- The sea is identical at the same screen position in every window, including overlapping windows; windows partially off-screen or on secondary monitors sample uv outside [0,1] and the procedural field continues without clamping.
- A window on a monitor whose dpr differs from its neighbor keeps continuity; a single window straddling two mixed-density monitors blends browser-side dpr mapping and may shear slightly — a browser limitation, not a shader one.
- The wrapped clock shifts the whole ocean once per ~18 h simultaneously in every window; speed changes glide over ~1 s instead of jumping.
- `wave` and `rays` are off in the plugin's mount options; the shader keeps the layers available (`layers` option) for future settings.
- New settings fields ride schema defaults, so pre-existing durable settings documents merge without migration.
