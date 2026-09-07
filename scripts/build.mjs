#!/usr/bin/env node
/**
 * Standalone build for dsh-liquid-glass.
 *
 * Emits the two artifacts a dsh web profile loads:
 *   lib/index.mjs   — Host half (ESM): registers the durable settings section
 *   lib/client.js   — Browser half (CJS inside the __ModuleLoader__.load
 *                     wrapper): theme registration, sea wallpaper, settings UI
 *
 * react / react-jsx-runtime stay external: the dsh shell seeds one React
 * instance into its module table (PLATFORM_MODULES), and a second bundled copy
 * would break hooks the moment any slot component mounts.
 */
import { build } from 'esbuild'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const src = join(root, 'src')
const out = join(root, 'lib')

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

// ---- Host half: ESM, dependencies external (peer deps of the package) ----
await build({
  entryPoints: [join(src, 'host.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  external: ['@deepseek-ai/*', 'zod'],
  outfile: join(out, 'index.mjs'),
  logLevel: 'info',
})

// ---- Browser half: CJS bundle wrapped for the dsh module loader ----
const tmp = join(out, '.client.cjs.tmp')
await build({
  entryPoints: [join(src, 'client', 'index.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  loader: { '.css': 'text' },
  external: ['react', 'react/jsx-runtime'],
  outfile: tmp,
  logLevel: 'info',
})

const body = await readFile(tmp, 'utf8')
const wrapped = [
  'window.__ModuleLoader__.load({',
  '\tid: "dsh-liquid-glass",',
  '\tfactory: (require) => {',
  '\t\tvar module = { exports: {} };',
  '\t\tvar exports = module.exports;',
  '\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
  body,
  '\t\treturn module.exports;',
  '\t}',
  '});',
  '',
].join('\n')
await writeFile(join(out, 'client.js'), wrapped)
await rm(tmp)

console.log('build complete: lib/index.mjs + lib/client.js')
