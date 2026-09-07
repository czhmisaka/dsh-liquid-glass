/** Liquid Glass settings section: enable toggle plus live parameter controls. */
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { createLiquidGlassStore } from './settings-store.ts'
import css from './LiquidGlassSection.module.css'

/** Injected business face: durable parameter writes (the apply chain re-applies them). */
export interface LiquidGlassSectionInjected {
  /** Write one parameter durably. */
  set: (field: string, value: unknown) => void
  /** Write several correlated parameters as one atomic namespace mutation. */
  setMany: (values: Record<string, unknown>) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type LiquidGlassSectionProps =
  PropsRuntime<'settings.section'>
  & PropsStore<ReturnType<typeof createLiquidGlassStore>>
  & PropsLocale<'liquid-glass'>
  & InjectFace<LiquidGlassSectionInjected>

/** HSL (h 0-360, s/l 0-1) to #rrggbb. */
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): string => {
    const k = (n + h / 30) % 12
    const v = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * v).toString(16).padStart(2, '0')
  }
  return '#' + f(0) + f(8) + f(4)
}

/**
 * Roll one harmonious band pair: a deep anchor hue plus a bright hue 90-270
 * degrees away, tuned for the dark glass base.
 */
function randomGradientPair(): [string, string] {
  const deep = Math.floor(Math.random() * 360)
  const bright = (deep + 90 + Math.floor(Math.random() * 180)) % 360
  return [hslToHex(deep, 0.72, 0.14), hslToHex(bright, 0.88, 0.74)]
}

/** Render the Liquid Glass page. */
export function LiquidGlassSection({ t, useStore, set, setMany }: LiquidGlassSectionProps) {
  const { status, value } = useStore(s => s)

  return (
    <div className={css.section}>
      <h2 className={css.heading}>{t('page.title')}</h2>
      <p className={css.intro}>{t('page.intro')}</p>
      {(status !== 'ready' || value === undefined) && <p className={css.muted}>{t('enable.off')}</p>}
      {status === 'ready' && value !== undefined && (
        <>
          <section className={css.card} aria-label={t('enable.title')}>
            <div className={css.rowHead}>
              <div>
                <div className={css.rowTitle}>{t('enable.title')}</div>
                <div className={css.rowHint}>{t('enable.description')}</div>
              </div>
              <button
                type='button'
                className={css.toggle}
                aria-pressed={value.enabled}
                onClick={() => { set('enabled', !value.enabled) }}
              >
                {value.enabled ? t('enable.on') : t('enable.off')}
              </button>
            </div>
          </section>
          <section className={css.card} aria-label={t('seaTheme.title')}>
            <div className={css.rowTitle}>{t('seaTheme.title')}</div>
            <div className={css.optionRow}>
              {(['dark', 'light'] as const).map(option => (
                <button
                  key={option}
                  type='button'
                  className={css.option}
                  aria-pressed={value.seaTheme === option}
                  onClick={() => { set('seaTheme', option) }}
                >
                  {t(option === 'dark' ? 'seaTheme.dark' : 'seaTheme.light')}
                </button>
              ))}
            </div>
          </section>
          <section className={css.card} aria-label={t('colorMode.title')}>
            <div className={css.rowTitle}>{t('colorMode.title')}</div>
            <div className={css.optionRow}>
              {(['theme', 'custom'] as const).map(option => (
                <button
                  key={option}
                  type='button'
                  className={css.option}
                  aria-pressed={value.colorMode === option}
                  onClick={() => { set('colorMode', option) }}
                >
                  {option === 'theme' ? t('colorMode.theme') : t('colorMode.custom')}
                </button>
              ))}
              <button
                type='button'
                className={css.dice}
                title={t('color.random')}
                aria-label={t('color.random')}
                onClick={() => {
                  const [colorA, colorB] = randomGradientPair()
                  setMany({ colorMode: 'custom', colorA, colorB })
                }}
              >🎲</button>
            </div>
            {value.colorMode === 'custom' && (
              <div className={css.colorRow}>
                <label className={css.colorCell}>
                  <span>{t('colorA.title')}</span>
                  <input
                    className={css.colorInput}
                    type='color'
                    value={value.colorA}
                    onChange={(event) => { set('colorA', event.target.value) }}
                  />
                </label>
                <label className={css.colorCell}>
                  <span>{t('colorB.title')}</span>
                  <input
                    className={css.colorInput}
                    type='color'
                    value={value.colorB}
                    onChange={(event) => { set('colorB', event.target.value) }}
                  />
                </label>
              </div>
            )}
            <p className={css.hint}>{t('colorMode.hint')}</p>
          </section>
          <section className={css.card} aria-label={t('speed.title')}>
            <div className={css.rowTitle}>{t('speed.title')}</div>
            <input
              className={css.slider}
              type='range'
              min={0.2}
              max={3}
              step={0.1}
              value={value.speed}
              onChange={(event) => { set('speed', Number(event.target.value)) }}
            />
          </section>
          <section className={css.card} aria-label={t('digit.title')}>
            <div className={css.rowTitle}>{t('digit.title')}</div>
            <div className={css.sliderRow}>
              <span className={css.sliderLabel}>{t('digit.size')}</span>
              <input
                className={css.slider}
                type='range'
                min={0.5}
                max={2.5}
                step={0.1}
                value={value.digitSize}
                onChange={(event) => { set('digitSize', Number(event.target.value)) }}
              />
            </div>
            <div className={css.sliderRow}>
              <span className={css.sliderLabel}>{t('digit.brightness')}</span>
              <input
                className={css.slider}
                type='range'
                min={0}
                max={1}
                step={0.05}
                value={value.digitBrightness}
                onChange={(event) => { set('digitBrightness', Number(event.target.value)) }}
              />
            </div>
            <div className={css.sliderRow}>
              <span className={css.sliderLabel}>{t('digit.flicker')}</span>
              <input
                className={css.slider}
                type='range'
                min={0}
                max={4}
                step={0.1}
                value={value.digitFlicker}
                onChange={(event) => { set('digitFlicker', Number(event.target.value)) }}
              />
            </div>
            <div className={css.rowHead}>
              <div className={css.rowTitle}>{t('digit.foam')}</div>
              <button
                type='button'
                className={css.toggle}
                aria-pressed={value.foam}
                onClick={() => { set('foam', !value.foam) }}
              >
                {value.foam ? t('enable.on') : t('enable.off')}
              </button>
            </div>
            {value.foam && (
              <div className={css.sliderRow}>
                <span className={css.sliderLabel}>{t('digit.foamAmount')}</span>
                <input
                  className={css.slider}
                  type='range'
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={value.foamAmount}
                  onChange={(event) => { set('foamAmount', Number(event.target.value)) }}
                />
              </div>
            )}
          </section>
          <section className={css.card} aria-label={t('colorWave.title')}>
            <div className={css.rowHead}>
              <div className={css.rowTitle}>{t('colorWave.title')}</div>
              <button
                type='button'
                className={css.toggle}
                aria-pressed={value.colorWave}
                onClick={() => { set('colorWave', !value.colorWave) }}
              >
                {value.colorWave ? t('enable.on') : t('enable.off')}
              </button>
            </div>
          </section>
          <section className={css.card} aria-label={t('opacity.title')}>
            <div className={css.rowTitle}>{t('opacity.title')}</div>
            <input
              className={css.slider}
              type='range'
              min={0.3}
              max={1}
              step={0.05}
              value={value.opacity}
              onChange={(event) => { set('opacity', Number(event.target.value)) }}
            />
          </section>
          <section className={css.card} aria-label={t('blur.title')}>
            <div className={css.rowTitle}>{t('blur.title')}</div>
            <input
              className={css.slider}
              type='range'
              min={0}
              max={40}
              step={1}
              value={value.blur}
              onChange={(event) => { set('blur', Number(event.target.value)) }}
            />
            <p className={css.hint}>{t('blur.hint')}</p>
          </section>
        </>
      )}
    </div>
  )
}
