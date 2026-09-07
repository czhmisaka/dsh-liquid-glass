/**
 * Sea wallpaper: mounts the bundled @xietuier/matrix-rain sea background
 * (flowing color bands, dark palette) as the fixed bottom layer while the
 * Liquid Glass theme is active, and destroys it on any other theme.
 *
 * The IIFE is imported as a string and injected through a script tag so the
 * global is defined exactly once per page.
 */
import seaBackgroundScript from './sea-background-script.ts'
import type { SeaTheme } from '../liquid-glass-settings.ts'

const WALLPAPER_SELECTOR = '[data-dsg-sea-wallpaper]'

/** Whether the sea script has already been injected on this page. */
let scriptInjected = false

/** The mounted background handle (create + destroy + live setters). */
interface SeaInstance {
  destroy: () => void
  setTheme?: (theme: string) => void
  setSpeed?: (speed: number) => void
  setColors?: (colorA: readonly number[] | undefined, colorB: readonly number[] | undefined) => void
  clearColors?: () => void
  setEffects?: (e: { cols?: number; bright?: number; flicker?: number; foamAmount?: number }) => void
  setStyle?: (style: 'zeabur' | 'ghibli') => void
  setPlacement?: (x: number, y: number, w: number, h: number) => void
}

let instance: SeaInstance | undefined

/** One wallpaper parameter set: palette, flow speed, and the digital-sea effect dials. */
export interface SeaWallpaperParams {
  seaTheme: SeaTheme
  speed: number
  /** Custom deep band color (#rrggbb); undefined keeps the theme preset. */
  colorA?: string
  /** Custom bright band color (#rrggbb); undefined keeps the theme preset. */
  colorB?: string
  /** Digit layer grid density multiplier; larger means larger digits. */
  digitSize?: number
  /** Digit layer alpha, 0-1. */
  digitBrightness?: number
  /** Digit flicker speed multiplier. */
  digitFlicker?: number
  /** Whether the character-spray foam layer renders. */
  foam?: boolean
  /** Foam intensity multiplier, 0-1.5. */
  foamAmount?: number
  /** Sea style: data sea (zeabur) or ghibli anime waves. */
  seaStyle?: 'zeabur' | 'ghibli'
}

/** The sea global the injected IIFE defines. */
interface SeaGlobal {
  MatrixRainSea?: {
    createSeaBackground: (options: Record<string, unknown>) => SeaInstance
  }
}

/**
 * Screen-anchored ocean: the sea is one fixed plane pinned to the physical
 * desktop (a 1920x1080 css normalization window). Every browser window
 * renders the slice its viewport covers, so overlapping windows show the
 * identical water at the same screen position - continuity needs no peer
 * exchange, only each window's own screen coordinates.
 */

/** Sea normalization size in css px: the field's scale shared by all windows. */
const SEA_OCEAN_CSS = { w: 1920, h: 1080 } as const

let placementTimer: ReturnType<typeof setInterval> | undefined
let lastPlacement = ''

/**
 * Pure: this viewport's slice of the screen-anchored sea (device px, GL y-up
 * origin). dpr appears in every term and cancels in the uv ratio, so windows
 * on mixed-density monitors stay continuous.
 * @param viewportLeft - viewport left edge in screen css px.
 * @param viewportBottom - viewport bottom edge in screen css px.
 * @param dpr - this window's device pixel ratio.
 * @returns origin inside the ocean plus the ocean size.
 */
export function computeScreenPlacement(
  viewportLeft: number,
  viewportBottom: number,
  dpr: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: viewportLeft * dpr,
    y: (SEA_OCEAN_CSS.h - viewportBottom) * dpr,
    w: SEA_OCEAN_CSS.w * dpr,
    h: SEA_OCEAN_CSS.h * dpr,
  }
}

/** Compute and push this window's sea slice; skips the call when nothing moved. */
function applyScreenPlacement(): void {
  if (instance === undefined) return
  // Moving a window fires no event: poll the screen coordinates instead.
  const chromeX = Math.max(0, window.outerWidth - window.innerWidth)
  const chromeY = Math.max(0, window.outerHeight - window.innerHeight)
  const viewportLeft = window.screenX + chromeX
  const viewportBottom = window.screenY + chromeY + window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const place = computeScreenPlacement(viewportLeft, viewportBottom, dpr)
  const key = place.x + ',' + place.y + ',' + place.w + ',' + place.h
  if (key === lastPlacement) return
  lastPlacement = key
  instance.setPlacement?.(place.x, place.y, place.w, place.h)
}

/** Start the placement poll. */
function startPlacementLoop(): void {
  if (placementTimer !== undefined) return
  applyScreenPlacement()
  placementTimer = setInterval(() => { applyScreenPlacement() }, 1000)
}

/** Stop the placement poll. */
function stopPlacementLoop(): void {
  if (placementTimer !== undefined) {
    clearInterval(placementTimer)
    placementTimer = undefined
  }
  lastPlacement = ''
}

/** Parse #rrggbb into the shader's 0-1 rgb triple, or undefined when invalid. */
function hexToRgb(hex: string | undefined): [number, number, number] | undefined {
  if (hex === undefined) return undefined
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  const digits = match?.[1]
  if (digits === undefined) return undefined
  const value = parseInt(digits, 16)
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255]
}

/**
 * Mount the sea wallpaper as the bottom layer of the document.
 * Idempotent: repeated calls while mounted are no-ops (see updateSeaWallpaper
 * for live parameter application on an already-mounted wallpaper).
 *
 * @param params - the sea palette, flow speed, and optional custom colors.
 */
export function mountSeaWallpaper(params: SeaWallpaperParams): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(WALLPAPER_SELECTOR) !== null) return

  if (!scriptInjected) {
    const script = document.createElement('script')
    script.textContent = seaBackgroundScript
    document.head.appendChild(script)
    scriptInjected = true
  }

  const layer = document.createElement('div')
  layer.setAttribute('data-dsg-sea-wallpaper', '')
  document.body.prepend(layer)

  const globalApi = (window as unknown as SeaGlobal).MatrixRainSea
  if (globalApi?.createSeaBackground === undefined) return
  const colorA = hexToRgb(params.colorA)
  const colorB = hexToRgb(params.colorB)
  instance = globalApi.createSeaBackground({
    container: layer,
    theme: params.seaTheme,
    speed: params.speed,
    colorWave: true,
    opacity: 1,
    // The mid-screen wave line and the god rays read as artifacts over the
    // app frame; every other layer stays on. Foam follows its setting.
    layers: { wave: false, rays: false, foam: params.foam !== false },
    ...(colorA !== undefined ? { colorA } : {}),
    ...(colorB !== undefined ? { colorB } : {}),
  })
  pushDigitEffects(params)
  instance.setTheme?.(params.seaTheme)
  instance.setStyle?.(params.seaStyle === 'ghibli' ? 'ghibli' : 'zeabur')
  // Join the screen-anchored ocean: poll own viewport, render own slice.
  startPlacementLoop()
}

/**
 * Update the live sea instance (palette with built-in fade, flow speed, and
 * custom band colors). Safe to call on every settings sync; no-op unmounted.
 */
export function updateSeaWallpaper(params: SeaWallpaperParams): void {
  if (instance === undefined) return
  instance.setTheme?.(params.seaTheme)
  instance.setSpeed?.(params.speed)
  const colorA = hexToRgb(params.colorA)
  const colorB = hexToRgb(params.colorB)
  if (colorA !== undefined || colorB !== undefined) {
    instance.setColors?.(colorA, colorB)
  } else {
    instance.clearColors?.()
  }
  pushDigitEffects(params)
  instance.setTheme?.(params.seaTheme)
  instance.setStyle?.(params.seaStyle === 'ghibli' ? 'ghibli' : 'zeabur')
}

/** Push the digit/foam effect parameters to the live instance. */
function pushDigitEffects(params: SeaWallpaperParams): void {
  if (instance === undefined) return
  instance.setEffects?.({
    cols: 56 / Math.max(0.4, params.digitSize ?? 1),
    bright: params.digitBrightness ?? 0.3,
    flicker: params.digitFlicker ?? 1,
    foamAmount: params.foamAmount ?? 1,
  })
}

/** Unmount the sea wallpaper and stop its animation. Idempotent. */
export function unmountSeaWallpaper(): void {
  if (typeof document === 'undefined') return
  stopPlacementLoop()
  document.querySelector(WALLPAPER_SELECTOR)?.remove()
  instance?.destroy()
  instance = undefined
}
