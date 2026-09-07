/**
 * Ambient type surface of the dsh client runtime, standalone flavor.
 *
 * The plugin runs inside the dsh web shell, whose modules provide these
 * services at runtime; the standalone repo keeps only the type shapes the
 * browser half touches, so it builds without the harness workspace.
 */

/** Cordis client context, narrowed to what this plugin reads. */
export interface Effectful {
  effect<T>(factory: () => T, label?: string): T
  inject(names: string[], cb: (scope: never) => void): void
  plugin(entry: unknown, config?: unknown): unknown
}

export interface ClientContext extends Effectful {
  locale: {
    bind(namespace: string): {
      (key: string): string
    }
    register(namespace: string, dicts: Record<string, Record<string, string>>): void
  }
  theme: {
    register(theme: GlassThemeDefinition): () => void
    getTheme(): { preference: string }
    setTheme(id: string): void
  }
  settingsScope: {
    bind<T>(spec: { namespace: string }): {
      getSnapshot(): { status: 'loading' | 'ready' | 'unavailable', value: T | undefined, revision?: number }
      subscribe(listener: () => void): () => void
      set(field: string, value: unknown): Promise<void>
      mutate(ops: ReadonlyArray<{ op: 'set', path: [string], value: unknown }>): Promise<void>
    }
  }
  slots: {
    inject(name: string, factory: () => unknown): void
    register(config: Record<string, unknown>, component: unknown): unknown
  }
}

export interface GlassThemeDefinition {
  id: string
  colorScheme: 'dark' | 'light'
  tokens: Record<string, string>
}

export interface ThemeRuntime {
  getTheme(): { preference: string }
  setTheme(id: string): void
}

/** Slot props shares (minimal shapes used by the settings sections). */
export type PropsRuntime<K extends string> = Record<string, unknown>
export type PropsLocale<K extends string> = { t: (key: string) => string }
export type PropsStore<H> = { useStore: <TSelect>(selector: (state: never) => TSelect) => TSelect }
export type InjectFace<F> = F

/** JsonValue for settings writes (standalone flavor). */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface BoundActions<S> {
  sync: (...args: unknown[]) => void
  [key: string]: unknown
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    locale: ClientContext['locale']
    theme: ClientContext['theme']
    settingsScope: ClientContext['settingsScope']
    slots: ClientContext['slots']
  }
}
