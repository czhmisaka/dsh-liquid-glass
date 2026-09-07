/**
 * Liquid Glass parameter store: a mirror of the settings scope's resolved
 * section. The plugin's apply-world change listener is the only authoritative
 * writer (it owns the scope subscription and the durable writes); the section
 * component reads via props.useStore.
 *
 * Standalone engine: a minimal observable snapshot store with the same
 * handle surface the harness store engine provides (create + useStore).
 */
import type { LiquidGlassSettings } from '../liquid-glass-settings.ts'

/** Store state mirrored from the settings scope. */
export interface LiquidGlassState {
  /** Scope readiness mirrored (loading until the first accepted section). */
  status: 'loading' | 'ready' | 'unavailable'
  /** The resolved parameter values; undefined before the first acceptance. */
  value: LiquidGlassSettings | undefined
  /** Scope revision; -1 until the first sync so revision 0 lands as a change. */
  revision: number
}

/** Store handle: subscribe for re-renders, dispatch actions, read the snapshot. */
export interface LiquidGlassStoreHandle {
  /** Subscribe a listener; returns the unsubscriber. */
  subscribe(listener: () => void): () => void
  /** Read the current state (stable reference between changes). */
  getSnapshot: () => LiquidGlassState
  /** Bind a React useStore hook for slot components (setState-based subscription). */
  useStore: never
  /** Dispatch a declared action; the implementation mutates a draft copy. */
  actions: {
    sync: (status: 'loading' | 'ready' | 'unavailable', value: LiquidGlassSettings | undefined, revision: number) => void
  }
}

/** Declared action shape giving the exported factory a stable return type. */
type LiquidGlassActions = {
  sync: (draft: LiquidGlassState, status: 'loading' | 'ready' | 'unavailable', value: LiquidGlassSettings | undefined, revision: number) => void
}

/** Minimal engine handle over one state object + declared actions. */
export interface EngineStoreHandle<S, A> {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => S
  actions: A
  /** Internal: replace the whole state (framework binding detail). */
  setState: (next: S) => void
}

/**
 * Declares the parameter state and read surface.
 * @returns the store handle.
 */
export function createLiquidGlassStore(): EngineStoreHandle<LiquidGlassState, LiquidGlassActions> {
  const initial: LiquidGlassState = { status: 'loading', value: undefined, revision: -1 }
  let state = initial
  const listeners = new Set<() => void>()
  const handle = {
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    getSnapshot(): LiquidGlassState {
      return state
    },
    // Placeholder; the real useStore binding is supplied by the renderer's
    // PropsStore seat, which wraps this handle per component.
    setState(next: S): void {
      state = next
      for (const listener of listeners) listener()
    },
    actions: {} as LiquidGlassActions,
  }
  handle.actions = {
    sync(
      draft: LiquidGlassState,
      status: 'loading' | 'ready' | 'unavailable',
      value: LiquidGlassSettings | undefined,
      revision: number,
    ): void {
      if (revision <= draft.revision) return
      handle.setState({ status, value, revision })
    },
  }
  return handle
}
