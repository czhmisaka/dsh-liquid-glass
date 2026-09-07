# dsh-liquid-glass

**DeepSeek Harness 的液态玻璃主题** —— 半透明磨砂玻璃铺在一片**锚定物理桌面的数字海**上：流动色带、ascii 数字雨、字符浪花，**跨浏览器窗口连续**。

[English](README.md) | 中文

## 效果

- 磨砂玻璃面板（backdrop blur + 高光描边）铺在实时 WebGL 海面上
- 六层海面 shader：网格、ascii 数字雨、流动色带、字符浪花（波浪线、阳光射线可用但默认关闭）
- 海面**钉在你的物理桌面上**：开两个浏览器窗口并排或叠加，两个窗口看到的是**同一片连续海洋**的不同切片——拖动窗口就像挪动一个观察海面的窗洞
- 设置页实时调参：海面配色（暗紫/暖橙）、自定义色带颜色 + 🎲 随机、色带流速、字符大小/亮度/闪烁、字符泡沫开关与浓度、色彩波动、壁纸不透明度、玻璃模糊强度

## 安装

```sh
git clone https://github.com/czhmisaka/dsh-liquid-glass.git
cd dsh-liquid-glass
pnpm install
pnpm build          # 产出 lib/index.mjs（host）+ lib/client.js（浏览器）
```

部署到 dsh profile：

```sh
DEST=~/.dsh/profiles/web/plugins/liquid-glass
mkdir -p "$DEST/lib"
cp package.json "$DEST/"
cp lib/index.mjs "$DEST/host.js"
cp lib/client.js "$DEST/lib/client.js"
```

在 profile 的 `cordis.patch.yml` 里启用：

```yaml
- insert:
    - id: liquid-glass
      name: './plugins/liquid-glass/host.js'
```

重启 dsh，打开 设置 → **液态玻璃**，打开开关即可。

> host 半注册持久化设置节；浏览器半注册主题、挂载海面壁纸和设置页。`react` / `react/jsx-runtime` 从 dsh shell 的共享模块表解析——刻意 external（第二份 React 实例会让 hooks 崩溃）。

## 屏幕锚定的数字海

海面是一片钉在物理桌面上的程序化平面（1920×1080 css 归一化窗口）。每个浏览器窗口计算自己视口在屏幕坐标里的位置，**只渲染自己视口覆盖的那一片**：

```
uv = (片内像素 + 窗口在屏幕上的原点) / 海洋尺寸
```

- 叠加窗口在同一屏幕位置显示**完全相同的水**——连续性不需要任何窗口间通信
- 窗口可以拖出屏幕或跨显示器：程序噪声场无界，dpr 在 uv 比值中约掉，混合密度显示器共享同一片海
- 色带相位来自**共享的包装墙钟**（`t mod 65536 秒`），所有窗口同相位流动——同时保持在 float32 uniform 精度内（绝对纪元秒会丢失全部小数位，动画直接冻结）

完整决策记录（含被否方案：窗口包围盒、绝对纪元相位、BroadcastChannel 协调）见仓库内 `.agents-note.md`。

## 图层

| 图层 | 默认 | 内容 |
|---|---|---|
| 网格 grid | 开 | 淡网格 |
| ascii 数字雨 | on | 下落等宽字符，密度/亮度/闪烁可调 |
| 流动色带 | 开 | fbm 扭曲的流动色带（海本身） |
| ~~阳光射线~~ | 关 | 光柱 |
| ~~波浪线~~ | 关 | 屏中波浪线 |
| 字符泡沫 | 开 | 沿色带岸线的字形浪花，约 3 次/秒变异 |

泡沫贴着**真实色带岸线**：shader 每像素算一次色带相位（`bandPhase`），渐变着色与泡沫掩膜共用，碎沫永远跟随可见的浪边。

## 开发

```sh
pnpm test       # vitest：壁纸挂载/卸载 + 海洋 placement 连续性数学
pnpm build      # esbuild：lib/index.mjs + lib/client.js
```

海面 shader 在 `src/client/sea-background-script.ts`（来自 [@xietuier/matrix-rain](https://github.com/czhmisaka/matrix-rain) 的 IIFE 字符串，MIT，扩展了泡沫层、placement uniform 与包装时钟）。其余为普通 TS + React。

## License

MIT
