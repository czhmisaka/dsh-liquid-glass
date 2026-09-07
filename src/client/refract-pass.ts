/**
 * Liquid Glass refraction pass.
 *
 * One transparent WebGL canvas layered above the sea canvas. Glass panes are
 * rounded-rect SDFs passed as uniforms; inside a pane the shader samples the
 * sea canvas (copied into a texture each frame) with thickness-driven
 * displacement, chromatic dispersion at the curved edges, and a specular rim.
 *
 * backdrop-filter cannot displace (sample-dependent refraction), and one
 * canvas per pane would multiply contexts — so a single full-screen pass with
 * pane rects as uniforms owns the effect.
 */
const VERT_SRC = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uSea;
uniform vec2 uRes;
uniform vec2 uViewport;
uniform vec4 uPane;
uniform float uRadius;
uniform float uRefract;
uniform float uDisp;
out vec4 fragColor;
void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 half_ = uPane.zw * 0.5;
  vec2 local = css - (uPane.xy + half_);
  float cr = min(uRadius, min(half_.x, half_.y) * 0.5);
  vec2 q = abs(local) - (half_ - vec2(cr));
  float sd = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - cornerR;
  float inside = 1.0 - smoothstep(-1.0, 1.0, sd);
  if (inside < 0.004) discard;
  float edgeDist = -sd;
  float curve = 1.0 - smoothstep(0.0, 56.0, edgeDist);
  float thickness = pow(clamp(edgeDist / 56.0, 0.0, 1.0), 1.4);
  vec2 q2 = max(q, vec2(0.0));
  vec2 dir = (length(q2) > 0.001) ? normalize(q2) * sign(max(q2.x, q2.y)) : vec2(0.0);
  vec2 uvR = clamp((css + dir * thickness * (uRefract - uDisp)) / uViewport, vec2(0.001), vec2(0.999));
  vec2 uvG = clamp((css + dir * thickness * uRefract) / uViewport, vec2(0.001), vec2(0.999));
  vec2 uvB = clamp((css + dir * thickness * (uRefract + uDisp)) / uViewport, vec2(0.001), vec2(0.999));
  vec3 refr = vec3(texture(uSea, uvR).r, texture(uSea, uvG).g, texture(uSea, uvB).b);
  float rim = smoothstep(0.7, 1.0, curve);
  vec3 outc = refr * mix(0.94, 1.0, thickness) + vec3(0.92, 0.97, 1.0) * rim * 0.12;
  fragColor = vec4(outc, inside);
}`

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

/** One glass pane rect in css px (top-left origin). */
export interface RefractPane {
  x: number
  y: number
  w: number
  h: number
  /** Corner radius; defaults to the pass-level option. */
  radius?: number
}

export interface RefractionPass {
  canvas: HTMLCanvasElement
  destroy(): void
}

export function createRefractionPass(
  seaCanvas: HTMLCanvasElement,
  panesProvider: () => RefractPane[],
  opts: { refract?: number, dispersion?: number, radius?: number, zIndex?: number } = {},
): RefractionPass {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:${opts.zIndex ?? 2};`
  document.body.appendChild(canvas)
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false })
  if (gl === null) return { canvas, destroy: () => canvas.remove() }

  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const vs = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vs, VERT)
  gl.compileShader(vs)
  const fs = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fs, FRAG_SRC)
  gl.compileShader(fs)
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('[Refract] link: ' + gl.getProgramInfoLog(prog))
  gl.useProgram(prog)
  const loc = (n: string): WebGLUniformLocation | null => gl.getUniformLocation(prog, n)
  const uSea = loc('uSea'), uRes = loc('uRes'), uViewport = loc('uViewport'), uPane = loc('uPane'),
    uRadius = loc('uRadius'), uRefract = loc('uRefract'), uDisp = loc('uDisp')
  gl.uniform1i(uSea, 0)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const resize = (): void => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(innerWidth * dpr)
    canvas.height = Math.round(innerHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  addEventListener('resize', resize)
  resize()

  let rafId = 0
  let destroyed = false
  const frame = (): void => {
    if (destroyed) return
    const panes = panesProvider()
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (panes.length > 0) {
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, seaCanvas)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      for (const pane of panes) {
        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.uniform2f(uViewport, innerWidth, innerHeight)
        gl.uniform4f(uPane, pane.x, pane.y, pane.w, pane.h)
        gl.uniform1f(uRadius, pane.radius ?? opts.radius ?? 22)
        gl.uniform1f(uRefract, opts.refract ?? 18)
        gl.uniform1f(uDisp, opts.dispersion ?? 1.4)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
    }
    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return {
    canvas,
    destroy() {
      destroyed = true
      cancelAnimationFrame(rafId)
      removeEventListener('resize', resize)
      canvas.remove()
    },
  }
}
