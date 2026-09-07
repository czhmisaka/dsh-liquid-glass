// @vitest-environment jsdom
/** Sea wallpaper mount/unmount behavior (the sea IIFE is mocked out). */

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/client/sea-background-script.ts', () => ({ default: 'window.__SEA_TEST__ = true' }))

const { computeScreenPlacement, mountSeaWallpaper, unmountSeaWallpaper } = await import('../src/client/sea-wallpaper.ts')

afterEach(() => {
  unmountSeaWallpaper()
  vi.restoreAllMocks()
  delete (window as unknown as Record<string, unknown>).__SEA_TEST__
  delete (window as unknown as Record<string, unknown>).MatrixRainSea
})

describe('sea wallpaper', () => {
  it('injects the sea script once and creates the background in a holder layer', () => {
    const create = vi.fn(() => ({ destroy: () => {} }))
    ;(window as unknown as Record<string, unknown>).MatrixRainSea = { createSeaBackground: create }
    mountSeaWallpaper({ seaTheme: 'dark', speed: 1.3 })
    const layer = document.querySelector('[data-dsg-sea-wallpaper]')
    expect(layer).not.toBeNull()
    expect(document.querySelectorAll('script').length).toBe(1)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark', speed: 1.3, colorWave: true }))
    // Idempotent: a second mount adds nothing.
    mountSeaWallpaper({ seaTheme: 'dark', speed: 1.3 })
    expect(document.querySelectorAll('[data-dsg-sea-wallpaper]')).toHaveLength(1)
    expect(document.querySelectorAll('script')).toHaveLength(1)
  })

  it('destroys the instance and removes the layer on unmount', () => {
    const destroy = vi.fn()
    ;(window as unknown as Record<string, unknown>).MatrixRainSea = { createSeaBackground: () => ({ destroy }) }
    mountSeaWallpaper({ seaTheme: 'dark', speed: 1.3 })
    unmountSeaWallpaper()
    expect(destroy).toHaveBeenCalledOnce()
    expect(document.querySelector('[data-dsg-sea-wallpaper]')).toBeNull()
    // Unmount is idempotent.
    expect(() => { unmountSeaWallpaper() }).not.toThrow()
  })

  it('leaves the layer mounted without a sea global (defensive)', () => {
    mountSeaWallpaper({ seaTheme: 'dark', speed: 1.3 })
    expect(document.querySelector('[data-dsg-sea-wallpaper]')).not.toBeNull()
  })
})

describe('screen-anchored ocean placement', () => {
  it('gives overlapping windows the identical slice (same screen position = same water)', () => {
    const a = computeScreenPlacement(100, 700, 1)
    const b = computeScreenPlacement(100, 700, 1)
    expect(a).toEqual(b)
  })

  it('keeps vertically adjacent windows seamless across the shared edge', () => {
    // Upper window's viewport bottom sits at 600; the lower one starts there.
    const upper = computeScreenPlacement(0, 600, 1)
    const lower = computeScreenPlacement(0, 1200, 1)
    const uvUpperBottom = upper.y / upper.h
    const uvLowerTop = (lower.y + 600) / lower.h
    expect(uvUpperBottom).toBeCloseTo(uvLowerTop, 10)
  })

  it('extends continuously across multiple monitors (global desktop coordinates)', () => {
    // Primary monitor 1920 css wide; a second monitor starts at x=1920.
    const primary = computeScreenPlacement(0, 1080, 1)
    const secondaryRight = computeScreenPlacement(1920, 1080, 1)
    // The secondary's left uv edge equals the primary's right uv edge.
    expect(secondaryRight.x / secondaryRight.w).toBeCloseTo(1.0, 10)
    expect((primary.x + 1920) / primary.w).toBeCloseTo(1.0, 10)
    // A monitor stacked below: GL y-up origin goes negative, uv stays continuous.
    const below = computeScreenPlacement(0, 2160, 1)
    // Primary's bottom row uv.y === the monitor below's top row uv.y.
    const uvPrimaryBottom = primary.y / primary.h
    const uvBelowTop = (below.y + 1080) / below.h
    expect(uvPrimaryBottom).toBeCloseTo(uvBelowTop, 10)
    expect(below.y / below.h).toBeCloseTo(-1.0, 10)
  })

  it('is dpr-invariant (mixed-density monitors share one sea)', () => {
    const a = computeScreenPlacement(100, 700, 1)
    const b = computeScreenPlacement(100, 700, 2)
    expect(a.x / a.w).toBeCloseTo(b.x / b.w, 10)
    expect(a.y / a.h).toBeCloseTo(b.y / b.h, 10)
  })
})
