/** Typed locale dictionaries for the liquid glass settings page. */

export type LiquidGlassLocaleKey =
  | 'nav'
  | 'page.title'
  | 'page.intro'
  | 'enable.title'
  | 'enable.description'
  | 'enable.on'
  | 'enable.off'
  | 'seaTheme.title'
  | 'seaTheme.dark'
  | 'seaTheme.light'
  | 'colorMode.title'
  | 'colorMode.theme'
  | 'colorMode.custom'
  | 'colorMode.hint'
  | 'colorA.title'
  | 'colorB.title'
  | 'color.random'
  | 'digit.title'
  | 'digit.size'
  | 'digit.brightness'
  | 'digit.flicker'
  | 'digit.foam'
  | 'digit.foamAmount'
  | 'style.title'
  | 'style.zeabur.dark'
  | 'style.zeabur.light'
  | 'style.ghibli.day'
  | 'style.ghibli.dusk'
  | 'style.viewSide'
  | 'style.viewTop'
  | 'speed.title'
  | 'colorWave.title'
  | 'opacity.title'
  | 'blur.title'
  | 'blur.hint'

export const en: Record<LiquidGlassLocaleKey, string> = {
  nav: 'Liquid Glass',
  'page.title': 'Liquid Glass',
  'page.intro': 'Translucent frosted surfaces with backdrop blur over a live sea background. Changes apply immediately.',
  'enable.title': 'Enable liquid glass',
  'enable.description': 'Glass panes, wallpaper, and blur effects across the whole interface.',
  'enable.on': 'On',
  'enable.off': 'Off',
  'seaTheme.title': 'Sea palette',
  'seaTheme.dark': 'Dark violet',
  'seaTheme.light': 'Warm orange',
  'colorMode.title': 'Band colors',
  'colorMode.theme': 'Theme palette',
  'colorMode.custom': 'Custom',
  'colorMode.hint': 'Custom feeds your two colors to the flowing bands; Random rolls a fresh harmonious pair.',
  'colorA.title': 'Deep band',
  'colorB.title': 'Bright band',
  'color.random': 'Random colors',
  'digit.title': 'Digital sea',
  'digit.size': 'Digit size',
  'digit.brightness': 'Digit brightness',
  'digit.flicker': 'Flicker speed',
  'digit.foam': 'Character foam',
  'digit.foamAmount': 'Foam amount',
  'style.title': 'Sea style',
  'style.zeabur.dark': 'Data sea · dark',
  'style.zeabur.light': 'Data sea · warm',
  'style.ghibli.day': 'Ghibli · day',
  'style.ghibli.dusk': 'Ghibli · dusk',
  'style.viewSide': 'Side view',
  'style.viewTop': 'Top view',
  'speed.title': 'Band flow speed',
  'colorWave.title': 'Color wave',
  'opacity.title': 'Wallpaper opacity',
  'blur.title': 'Glass blur strength',
  'blur.hint': 'Applies to the sidebar, dialogs, overlays, and cards.',
}

export const zh: Record<LiquidGlassLocaleKey, string> = {
  nav: '液态玻璃',
  'page.title': '液态玻璃',
  'page.intro': '半透明磨砂表面与背景模糊,铺在流动的海面背景上,修改立即生效。',
  'enable.title': '启用液态玻璃',
  'enable.description': '全局玻璃面板、壁纸与模糊效果。',
  'enable.on': '开',
  'enable.off': '关',
  'seaTheme.title': '海面配色',
  'seaTheme.dark': '暗紫',
  'seaTheme.light': '暖橙',
  'colorMode.title': '色带配色',
  'colorMode.theme': '主题配色',
  'colorMode.custom': '自定义',
  'colorMode.hint': '自定义时海面色带使用你选的两个颜色；随机按钮会掷出一组和谐的新配色。',
  'colorA.title': '深色带',
  'colorB.title': '亮色带',
  'color.random': '随机配色',
  'digit.title': '数字海',
  'digit.size': '字符大小',
  'digit.brightness': '字符亮度',
  'digit.flicker': '闪烁速度',
  'digit.foam': '字符泡沫',
  'digit.foamAmount': '泡沫浓度',
  'style.title': '海面风格',
  'style.zeabur.dark': '数据海·暗紫',
  'style.zeabur.light': '数据海·暖橙',
  'style.ghibli.day': '吉卜力·白日',
  'style.ghibli.dusk': '吉卜力·黄昏',
  'style.viewSide': '侧视',
  'style.viewTop': '俯视',
  'speed.title': '色带流速',
  'colorWave.title': '色彩波动',
  'opacity.title': '壁纸不透明度',
  'blur.title': '玻璃模糊强度',
  'blur.hint': '作用于侧栏、对话框、浮层与卡片。',
}
