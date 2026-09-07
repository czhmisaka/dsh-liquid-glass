/**
 * Liquid Glass alias-token overrides. Every token carries both palette modes
 * (the theme contract requires it so a switch never goes illegible); the
 * theme declares colorScheme 'dark', so the dark values are the live ones.
 */

/** Alias-token overrides keyed by variable name. */
export const GLASS_TOKENS: Record<string, string> = {
  // Base: a deep blue-slate that lets the gradient wallpaper glow through.
  '--dsw-alias-bg-base': 'rgba(10, 14, 24, 0.30)',
  // Raised surfaces become thin translucent glass panes.
  '--dsw-alias-bg-layer-1': 'rgba(255, 255, 255, 0.045)',
  '--dsw-alias-bg-layer-2': 'rgba(255, 255, 255, 0.03)',
  // Overlays (dialogs, menus) get a touch more body for legibility.
  '--dsw-alias-bg-overlay': 'rgba(18, 22, 34, 0.38)',
  // Borders become light-catching hairlines.
  '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.14)',
  '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.22)',
  // Brand accent: an icy cyan tuned for the dark glass.
  '--dsw-alias-brand-primary': '#6fd2ff',
  '--dsw-alias-label-primary': '#f2f6ff',
  '--dsw-alias-label-secondary': 'rgba(235, 242, 255, 0.78)',
  '--dsw-alias-state-error-primary': '#ff7d70',
  '--dsw-alias-state-success-primary': '#5ce2a8',
  '--dsw-alias-state-warn-primary': '#ffc06b',
  // The sidebar becomes the thinnest pane so the wallpaper shows through most.
  '--dsw-specific-sidebar-fill': 'rgba(255, 255, 255, 0.025)',
}
