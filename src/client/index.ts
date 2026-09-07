/**
 * Liquid Glass theme plugin, browser half: registers the liquid-glass
 * ThemeDefinition (translucent alias tokens over the dark base), drives the
 * structural glass effects (wallpaper, backdrop blur, specular edges) from
 * the durable parameter section, and hosts the Liquid Glass settings page.
 *
 * Parameter flow: the settings scope's resolved values apply to the document
 * (body attribute, wallpaper instance, blur CSS variables); every scope write
 * re-applies, so slider changes land immediately and survive restarts.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { BoundActions } from '@deepseek-ai/dsh-client-store'
// Type-only: the ctx.theme Context merge and ThemeRuntime.
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the settings section slot declaration.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the ctx.slots SlotRegistry merge (the register/inject seats).
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: the ctx.remote Context merge with the generated usage namespace.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import glassCss from './glass.css?inline'
import { GLASS_TOKENS } from './tokens.ts'
import { mountSeaWallpaper, unmountSeaWallpaper, updateSeaWallpaper } from './sea-wallpaper.ts'
import { LiquidGlassSection } from './LiquidGlassSection.tsx'
import { createLiquidGlassStore } from './settings-store.ts'
import { en, zh } from './locales.ts'
import type { LiquidGlassSettings } from '../liquid-glass-settings.ts'
import { LIQUID_GLASS_DEFAULTS } from '../liquid-glass-settings.ts'

/** Theme id this plugin registers. */
export const LIQUID_GLASS_THEME_ID = 'liquid-glass'

/** The body attribute scoping the structural glass effects. */
const GLASS_ATTRIBUTE = 'data-ds-glass'

/** Settings namespace owned by this plugin (declared by the Host half). */
const SETTINGS_NS = 'liquid-glass'

/** Structural shape of a registrable theme (matches ui-theme's ThemeDefinition). */
interface GlassThemeDefinition {
  id: string
  colorScheme: 'dark' | 'light'
  tokens: Record<string, string>
}

/** The registered theme definition. */
export const LIQUID_GLASS_THEME: GlassThemeDefinition = {
  id: LIQUID_GLASS_THEME_ID,
  colorScheme: 'dark',
  tokens: GLASS_TOKENS,
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The liquid glass settings page's copy. */
    'liquid-glass': import('./locales.ts').LiquidGlassLocaleKey
  }
}

/** Mount the glass effects stylesheet for the owning plugin lifetime. */
function installGlassStyles(ctx: ClientContext): void {
  if (typeof document === 'undefined') return
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = '@deepseek-ai/dsh-client-ui-theme-liquid-glass'
    tag.textContent = glassCss
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'ui-theme-liquid-glass: glass stylesheet')
}

/**
 * Apply one parameter set to the document: glass scope attribute, wallpaper
 * instance, theme preference, and the blur CSS axis.
 */
function applyParams(theme: ThemeRuntime, params: LiquidGlassSettings): void {
  const body = document.body
  if (params.enabled) {
    body.setAttribute(GLASS_ATTRIBUTE, '')
    body.style.setProperty('--dsg-blur-main', String(Math.round(params.blur)) + 'px')
    const custom = params.colorMode === 'custom'
    const fx = {
      digitSize: params.digitSize,
      digitBrightness: params.digitBrightness,
      digitFlicker: params.digitFlicker,
      foam: params.foam,
      foamAmount: params.foamAmount,
    }
    // Mount is idempotent; update applies every parameter live (palette with
    // its built-in fade, flow speed, and custom band colors), so control
    // changes land without a disable/enable cycle.
    mountSeaWallpaper({
      seaTheme: params.seaTheme,
      speed: params.speed,
      ...fx,
      ...(custom ? { colorA: params.colorA, colorB: params.colorB } : {}),
    })
    updateSeaWallpaper({
      seaTheme: params.seaTheme,
      speed: params.speed,
      ...fx,
      ...(custom ? { colorA: params.colorA, colorB: params.colorB } : {}),
    })
    if ((theme.getTheme().preference as string) !== LIQUID_GLASS_THEME_ID) theme.setTheme(LIQUID_GLASS_THEME_ID)
  } else {
    body.removeAttribute(GLASS_ATTRIBUTE)
    unmountSeaWallpaper()
    if ((theme.getTheme().preference as string) === LIQUID_GLASS_THEME_ID) theme.setTheme('dark')
  }
}

/**
 * Required services (dsh client-plugin contract): this plugin reads `ctx.theme`
 * (register+switch the glass definition), `ctx.locale` (UI copy), `ctx.settingsScope`
 * (durable sliders) and `ctx.slots` (settings.section). Missing any here makes
 * dsh boot fail with `cannot get property "X" without inject`.
 */
export const inject = ['slots', 'theme', 'locale', 'settingsScope']

/** Client plugin body: theme registration, parameter application, settings page. */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind('liquid-glass')
  installGlassStyles(ctx)

  const theme = ctx.theme
  const disposeTheme = theme.register(LIQUID_GLASS_THEME)
  ctx.effect(() => () => { disposeTheme() }, 'ui-theme-liquid-glass: theme registration')

  const scope = ctx.settingsScope.bind<LiquidGlassSettings>({ namespace: SETTINGS_NS })
  const store = createLiquidGlassStore()
  let bound: BoundActions<typeof store> | undefined

  // The scope mirror is authoritative: every accepted section (initial load,
  // remote write, or local echo) re-applies the parameters to the document.
  const sync = (): void => {
    const snapshot = scope.getSnapshot()
    bound?.sync(snapshot.status, snapshot.value, snapshot.revision ?? -1)
    if (snapshot.status === 'ready' && snapshot.value !== undefined) {
      applyParams(theme, { ...LIQUID_GLASS_DEFAULTS, ...snapshot.value })
    }
  }
  sync()
  ctx.effect(() => scope.subscribe(() => { sync() }), 'ui-theme-liquid-glass: parameter application')

  // The sea wallpaper (layer + WebGL canvas + rAF loop) is imperative DOM:
  // bind its teardown to the plugin fiber so a stop/update never leaks it.
  ctx.effect(() => () => { unmountSeaWallpaper() }, 'ui-theme-liquid-glass: sea wallpaper teardown')

  ctx.effect(() => ctx.locale.register('liquid-glass', { zh, en }), 'ui-theme-liquid-glass: dictionaries')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'liquid-glass',
    order: 21,
    label: () => t('nav'),
    locale: SETTINGS_NS,
    store,
    inject: (actions) => {
      bound = actions
      // The component mounts after the first sync; catch it up here.
      sync()
      return {
        set: (field: string, value: unknown) => { void scope.set(field, value) },
        // One atomic write for correlated field groups (the random color
        // pair); three queued single-field sets race per-field recoveries.
        setMany: (values: Record<string, unknown>) => {
          void scope.mutate(Object.entries(values).map(([field, value]) => ({ op: 'set' as const, path: [field], value: value as import('@deepseek-ai/dsh-util-values').JsonValue })))
        },
      }
    },
  }, LiquidGlassSection))
}
