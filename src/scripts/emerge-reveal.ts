export type EmergeRevealOptions = {
  canvas: HTMLCanvasElement;
  src: string;
  durationMs?: number;
  fill?: [number, number, number];
};

export type EmergeRevealHandle = {
  play(): Promise<void>;
  setProgress(p: number): void;
  destroy(): void;
};

const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`;

function buildFs(hasDerivatives: boolean): string {
  const prefix = hasDerivatives
    ? '#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES 1\n'
    : '';
  return (
    prefix +
    `
            precision highp float;
            uniform sampler2D u_img;
            uniform vec2 u_res;
            uniform vec2 u_imgRes;
            uniform vec2 u_off;
            uniform float u_progress;
            uniform vec3 u_fill;

            vec2 cover(vec2 uv, vec2 s, vec2 i) {
                float rs = s.x/s.y; float ri = i.x/i.y;
                vec2 st = (uv-0.5)*0.92+0.5;
                if(rs>ri) st.y=(st.y-0.5)*(ri/rs)+0.5;
                else st.x=(st.x-0.5)*(rs/ri)+0.5;
                return st;
            }

            vec3 scene(vec2 st) {
                float aspect = u_res.x/u_res.y;
                vec2 p = st - 0.5; p.x *= aspect;
                float r = length(p);
                vec2 dist_p = p * (1.0 - 0.25*r*r);
                dist_p.x /= aspect;
                vec2 base_uv = dist_p + 0.5 - u_off;

                float ca = 0.035 * r * r;
                vec2 uvR = base_uv * (1.0 - ca) + (ca * 0.5);
                vec2 uvB = base_uv * (1.0 + ca) - (ca * 0.5);
                float r_col = texture2D(u_img, cover(uvR, u_res, u_imgRes)).r;
                float g_col = texture2D(u_img, cover(base_uv, u_res, u_imgRes)).g;
                float b_col = texture2D(u_img, cover(uvB, u_res, u_imgRes)).b;

                float dark = smoothstep(0.4, 1.0, r);
                return vec3(r_col, g_col, b_col) * (1.0 - dark * 0.45);
            }

            float map(float value, float min1, float max1, float min2, float max2) {
                float val = min2 + (value - min1) * (max2 - min2) / (max1 - min1);
                return clamp(val, min2, max2);
            }
            float cubicOut(float t) { float f = t - 1.0; return f * f * f + 1.0; }
            float quadraticOut(float t) { return -t * (t - 2.0); }
            float pristineGrid(vec2 uv, vec2 lineWidth) {
            #ifdef HAS_DERIVATIVES
                vec4 uvDDXY = vec4(dFdx(uv), dFdy(uv));
                vec2 uvDeriv = vec2(length(uvDDXY.xz), length(uvDDXY.yw));
                bool invertLine = lineWidth.x > 0.5;
                vec2 targetWidth = invertLine ? vec2(1.0) - lineWidth : lineWidth;
                vec2 drawWidth = clamp(targetWidth, uvDeriv, vec2(0.5));
                vec2 lineAA = max(uvDeriv, 0.000001) * 5.5;
                vec2 gridUV = abs(fract(uv) * 2.0 - 1.0);
                gridUV = invertLine ? gridUV : 1.0 - gridUV;
                vec2 grid2 = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);
                grid2 *= clamp(targetWidth / drawWidth, 0.0, 1.0);
                grid2 = mix(grid2, targetWidth, clamp(uvDeriv * 2.0 - vec2(1.0), vec2(0.0), vec2(1.0)));
                grid2 = invertLine ? 1.0 - grid2 : grid2;
                return mix(grid2.x, 1.0, grid2.y);
            #else
                return 0.0;
            #endif
            }

            void main() {
                vec2 st = gl_FragCoord.xy / u_res;
                float uAspect = u_res.x / u_res.y;

                // Distance from centre: superellipse following the viewport, 1.0 at the corners.
                vec2 q = abs(st - 0.5) * 2.0;
                vec2 q2 = q * q;
                float d = pow(dot(q2, q2), 0.25) * 0.8408964;

                // Front overshoots the corners so the trailing cyan rim fully leaves the frame.
                const float rimWidth = 0.035;
                const float rimSoft = 0.025;
                float front = cubicOut(map(u_progress, 0.0, 0.35, 0.0, 1.0)) * (1.0 + rimWidth + rimSoft);
                if (d > front) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                // Mosaic: 12 steps from 11 to 50 columns, starting at 30%.
                float pixelateProgress = map(u_progress, 0.3, 1.0, 0.0, 1.0);
                pixelateProgress = floor(pixelateProgress * 12.0) / 12.0;
                float s = floor(mix(11.0, 50.0, quadraticOut(pixelateProgress)));
                vec2 gridSize = vec2(s, floor(s / uAspect));
                vec2 gridUv = (st - 0.5) * gridSize + 0.5;
                vec2 cellUv = floor(gridUv) / gridSize + 0.5;
                vec3 color = scene(cellUv);
                vec3 defaultColor = scene(st);
                float finalProgress = map(u_progress, 0.75, 1.0, 0.0, 1.0);
                color = mix(color, defaultColor, finalProgress);

                float lines = pristineGrid(gridUv, vec2(0.2 * (1.0 - u_progress)));

                // Thin cyan rim riding just inside the expanding front.
                float rimInner = front - rimWidth;
                float fillGradient = smoothstep(rimInner - rimSoft, rimInner, d);

                // Output is premultiplied: the fill sits at fillAlpha over the page.
                const float fillAlpha = 0.35;
                vec3 rgb = color * 0.9 + vec3(1.0 - lines) * 0.1;
                rgb = mix(rgb, u_fill * fillAlpha, fillGradient);
                float alpha = mix(1.0, fillAlpha, fillGradient);
                rgb = mix(rgb, defaultColor, finalProgress);
                alpha = mix(alpha, 1.0, finalProgress);

                gl_FragColor = vec4(rgb, alpha);
            }
        `
  );
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('emerge shader:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export async function createEmergeReveal(
  options: EmergeRevealOptions,
): Promise<EmergeRevealHandle | null> {
  const canvas = options.canvas;
  const durationMs = options.durationMs ?? 1500;
  const fill = options.fill ?? ([0, 1, 0.8] as [number, number, number]);
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
  if (!gl) return null;

  const hasDerivatives = !!gl.getExtension('OES_standard_derivatives');
  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, buildFs(hasDerivatives));
  if (!vs || !fs) return null;

  const prg = gl.createProgram();
  if (!prg) return null;
  gl.attachShader(prg, vs);
  gl.attachShader(prg, fs);
  gl.linkProgram(prg);
  if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
    console.error('emerge link:', gl.getProgramInfoLog(prg));
    return null;
  }
  gl.useProgram(prg);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prg, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  let img: HTMLImageElement;
  try {
    img = await loadImage(options.src);
  } catch (e) {
    console.error(e);
    return null;
  }

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const uRes = gl.getUniformLocation(prg, 'u_res');
  const uImgRes = gl.getUniformLocation(prg, 'u_imgRes');
  const uOff = gl.getUniformLocation(prg, 'u_off');
  const uProgress = gl.getUniformLocation(prg, 'u_progress');
  const uFill = gl.getUniformLocation(prg, 'u_fill');

  let progress = 0;
  let raf = 0;
  let dead = false;

  const draw = (p: number) => {
    if (dead) return;
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    if (w < 1 || h < 1) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    gl.uniform2f(uImgRes, img.width, img.height);
    gl.uniform2f(uOff, 0, 0);
    gl.uniform1f(uProgress, p);
    gl.uniform3f(uFill, fill[0], fill[1], fill[2]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const setProgress = (p: number) => {
    progress = Math.max(0, Math.min(1, p));
    draw(progress);
  };

  const reduceMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const play = () =>
    new Promise<void>((resolve) => {
      if (dead) {
        resolve();
        return;
      }
      if (reduceMotion) {
        setProgress(1);
        resolve();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        if (dead) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / durationMs);
        setProgress(t);
        if (t >= 1) {
          raf = 0;
          resolve();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

  const destroy = () => {
    dead = true;
    if (raf) cancelAnimationFrame(raf);
  };

  setProgress(0);
  return { play, setProgress, destroy };
}
