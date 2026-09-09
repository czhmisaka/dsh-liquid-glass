/**
 * Liquid Glass parameter vocabulary: the durable settings document section and
 * the live values the client applies. Shared by the Host settings half and the
 * browser half.
 *
 * @module @deepseek-ai/dsh-client-ui-theme-liquid-glass/settings
 */

/** Sea palette. */
export type SeaTheme = 'dark' | 'light'

/** Sea band palette source: theme presets or two custom colors. */
export type GlassColorMode = 'theme' | 'custom'

/** The durable liquid glass parameter section. */
export interface LiquidGlassSettings {
  /** Whether the liquid glass theme drives the UI. */
  enabled: boolean
  /** Sea palette (dark 暗紫 / light 暖橙). */
  seaTheme: SeaTheme
  /** Color band flow speed. */
  speed: number
  /** Tide trough/peak hue oscillation. */
  colorWave: boolean
  /** Wallpaper opacity. */
  opacity: number
  /** Main glass blur radius in px (sidebar/overlays). */
  blur: number
  /** Where the sea band gradient colors come from. */
  colorMode: GlassColorMode
  /** Custom deep band color (#rrggbb); read when colorMode is 'custom'. */
  colorA: string
  /** Custom bright band color (#rrggbb); read when colorMode is 'custom'. */
  colorB: string
  /** Digit layer grid density multiplier; larger means larger digits. */
  digitSize: number
  /** Digit layer alpha, 0-1. */
  digitBrightness: number
  /** Digit flicker speed multiplier. */
  digitFlicker: number
  /** Whether the character-spray foam layer renders. */
  foam: boolean
  /** Foam intensity multiplier, 0-1.5. */
  foamAmount: number
  /** Sea style: data sea (zeabur) or ghibli anime waves. */
  seaStyle: 'zeabur' | 'ghibli'
}

/** Default parameter values (the schema's defaults mirror these). */
export const LIQUID_GLASS_DEFAULTS: LiquidGlassSettings = {
  enabled: false,
  seaTheme: 'dark',
  speed: 1.3,
  colorWave: true,
  opacity: 1,
  blur: 26,
  colorMode: 'theme',
  colorA: '#05020f',
  colorB: '#d18cff',
  digitSize: 1,
  digitBrightness: 0.3,
  digitFlicker: 1,
  foam: true,
  foamAmount: 1,
  seaStyle: 'zeabur',
}

/** Sea theme options in display order. */
export const SEA_THEMES: readonly SeaTheme[] = ['dark', 'light']
