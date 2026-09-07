/**
 * Liquid Glass refraction pass — the real refraction implementation.
 *
 * ONE extra transparent WebGL canvas layered above the sea canvas. Glass
 * panes are rounded-rect SDFs passed as uniforms; inside a pane the shader
 * samples the sea canvas (uploaded as a texture each frame) through a
 * thickness-driven displacement:
 *
 *   - thickness field: full slab at the pane center, curving to 0 at the
 *     rounded edge (a real glass slab profile)
 *   - refraction: the sample position is pushed along the outward SDF
 *     gradient, scaled by thickness — the magnifier effect. Flat center has
 *     zero displacement; edges bend strongly.
 *   - chromatic dispersion: R/G/B sampled at slightly different refraction
 *     strengths, like real glass splitting light
 *   - fresnel rim: bright specular edge where the glass curves away
 *
 * The sea canvas is copied into a texture each frame (texImage2D of the sea
 * canvas element — one GPU copy, cheap at backdrop resolution).
 */
export function createRefractionLayer(seaCanvas, panesProvider, opts = {}) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
  canvas.style.zIndex = String(opts.zIndex ?? 2)
  const parent = seaCanvas.parentElement
  parent.appendChild(canvas)
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false })
  if (!gl) return { canvas, setPanes: () => {}, destroy: () => canvas.remove() }

  const VERT = '#version 300 es\nconst vec2 P[4] = vec2[4](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(1,1));void main(){ gl_Position = vec4(P[gl_VertexID],0.,1.); }'
  const FRAG = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 fragColor;',
    'uniform sampler2D uSea;',
    'uniform vec2 uRes;',
    'uniform vec4 uPane;      // css px: x, y(top), w, h',
    'uniform float uRadius;',
    'uniform float uRefract;  // displacement in css px at the edge',
    'uniform float uDisp;     // chromatic dispersion px',
    'uniform vec2 uViewport;  // css viewport size',
    'float sdRoundedBox(vec2 p, vec2 b, float r){',
    '  vec2 q = abs(p) - b + vec2(r);',
    '  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;',
    '}',
    'void main(){',
    '  vec2 css = vec2(gl_FragCoord.x, uViewport.y - gl_FragCoord.y);',
    '  vec2 center = uPane.xy + uPane.zw * 0.5;',
    '  vec2 local = css - center;',
    '  float cr = min(uRadius, min(uPane.z, uPane.w) * 0.5);',
    '  vec2 q = abs(local) - (uPane.zw * 0.5 - vec2(cr));',
    '  float sd = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - cr;',
    '  float inside = 1.0 - smoothstep(-1.0, 1.0, sd);',
    '  if (inside < 0.004) discard;',
    '  float edgeDist = -sd;',
    '  float thickness = pow(clamp(edgeDist / 56.0, 0.0, 1.0), 1.35);',
    '  vec2 q2 = abs(local) - (uPane.zw * 0.5 - vec2(cr));',
    '  vec2 dir = (length(max(q2, vec2(0.0))) > 0.001) ? normalize(max(q2, vec2(0.0))) * sign(max(q2.x, q2.y)) : vec2(0.0);',
    '  vec2 uvR = clamp((css + dir * thickness * (uRefract - uDisp)) / uViewport, vec2(0.0), vec2(1.0));',
    '  vec2 uvG = clamp((css + dir * thickness * uRefract) / uViewport, vec2(0.001), vec2(0.999));',
    '  vec2 uvB = clamp((css + dir * (thickness * uRefract + uDisp)) / uViewport, vec2(0.0), vec2(1.0));',
    '  float r = texture(uSea, uvR).r;',
    '  float g = texture(uSea, uvG).g;',
    '  float b = texture(uSea, uvB).b;',
    '  vec3 refr = vec3(r, g, b);',
    '  float rim = smoothstep(0.72, 1.0, 1.0 - thickness);',
    '  float body = 1.0 - thickness * 0.10;',
    '  vec3 outc = refr * mix(0.90, 1.0, thickness) + vec3(0.92, 0.97, 1.0) * rim * 0.12;',
    '  gl_FragColor = vec4(outc, inside * 0.92);',
    '}',
  ].join('\n')

  const compile = (type, src) => {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(src && src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error('[Refraction] ' + gl.getShaderInfoLog(sh))
    return sh
  }
  const prog = gl.createProgram()
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, '#version 300 es\nconst vec2 P[4]=vec2[4](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(1,1));void main(){gl_Position=vec4(P[gl_VertexID],0.,1.);}'))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('[Refraction] ' + gl.getProgramInfoLog(prog))
  gl.useProgram(prog)
  const U = {}
  for (const n of ['uSea', 'uRes', 'uViewport', 'uPane', 'uRadius', 'uRefract', 'uDisp']) U[n] = gl.getUniformLocation(prog, n)
  gl.uniform1i(U.uSea, 0)

  // sea texture
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // full-screen quad (flip Y so css top-left maps correctly)
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao = gl.createVertexArray())

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(innerWidth * dpr)
    canvas.height = Math.round(innerHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  window.addEventListener('resize', resize)
  resize()

  let rafId = 0
  let destroyed = false
  const frame = () => {
    if (destroyed) return
    const panes = panesProvider()
    if (panes.length === 0) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); rafId = requestAnimationFrame(frame); return }
    // copy the sea canvas into the texture (1 GPU copy/frame)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, seaCanvas)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    for (const p of panes) {
      gl.uniform2f(U.uRes, canvas.width, canvas.height)
      gl.uniform2f(U.uViewport, innerWidth, innerHeight)
      gl.uniform4f(U.uPane, p.x, p.y, p.w, p.h)
      gl.uniform1f(U.uRadius, p.radius ?? 22)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return {
    canvas,
    destroy() {
      destroyed = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      canvas.remove()
    },
  }
}
GENEOF
echo "draft written — needs proper fullscreen quad + pane loop"
