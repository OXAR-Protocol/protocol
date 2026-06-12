import { VERT, FRAG } from "./shaders";

// Three thin particle streams in normalized [0,1]² space (y down).
const CONTROL_POINTS = new Float32Array([
  -0.1, 0.3, 0.35, 0.18, 0.65, 0.38, 1.1, 0.22,
  -0.1, 0.52, 0.3, 0.4, 0.7, 0.55, 1.1, 0.42,
  -0.1, 0.16, 0.4, 0.3, 0.6, 0.1, 1.1, 0.3,
]);

const DPR_CAP = 1.5;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile failed");
  }
  return sh;
}

/** GPU particle currents. Throws in the constructor if WebGL is unavailable —
 *  the caller falls back to the static CSS background (site never dies). */
export class DiveEngine {
  private gl: WebGLRenderingContext;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private count: number;
  private raf = 0;
  private running = false;
  private scroll = 0;
  private mouse: [number, number] = [0.5, 0.5];
  private t0 = performance.now();
  private reduced: boolean;
  private onResize = () => this.resize();
  private onVisibility = () => {
    if (document.hidden) this.pause();
    else this.play();
  };

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
    if (!gl) throw new Error("webgl unavailable");
    this.gl = gl;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.count = window.innerWidth < 768 ? 4000 : 9000;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) ?? "link failed");
    }
    gl.useProgram(prog);

    this.buildAttributes(prog);
    for (const name of ["uTime", "uScroll", "uAspect", "uDPR", "uMouse"]) {
      this.uniforms[name] = gl.getUniformLocation(prog, name);
    }
    // Array uniforms must be queried as "name[0]" on some drivers.
    this.uniforms.uCP =
      gl.getUniformLocation(prog, "uCP[0]") ?? gl.getUniformLocation(prog, "uCP");
    gl.uniform2fv(this.uniforms.uCP, CONTROL_POINTS);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // additive — particles glow
    gl.clearColor(0, 0, 0, 0);

    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.resize();
  }

  private buildAttributes(prog: WebGLProgram) {
    const { gl, count } = this;
    const fields: [string, (i: number) => number][] = [
      ["aT", () => Math.random()],
      ["aStream", () => Math.floor(Math.random() * 3)],
      ["aPhase", () => Math.random()],
      ["aSize", () => 1.2 + Math.random() * 2.4],
      ["aSpeed", () => 0.4 + Math.random() * 1.1],
      ["aAmp", () => 0.004 + Math.random() * 0.035],
    ];
    for (const [name, gen] of fields) {
      const data = new Float32Array(count);
      for (let i = 0; i < count; i++) data[i] = gen(i);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);
    }
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    this.gl.uniform1f(this.uniforms.uAspect, w / h);
    this.gl.uniform1f(this.uniforms.uDPR, dpr);
    if (this.reduced) this.frame(); // keep the single static frame fresh
  }

  setScroll(p: number) {
    this.scroll = p;
    if (this.reduced) this.frame();
  }

  setMouse(x: number, y: number) {
    this.mouse = [x, y];
  }

  private frame = () => {
    const { gl } = this;
    gl.uniform1f(this.uniforms.uTime, (performance.now() - this.t0) / 1000);
    gl.uniform1f(this.uniforms.uScroll, this.scroll);
    gl.uniform2f(this.uniforms.uMouse, this.mouse[0], this.mouse[1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, this.count);
    if (this.running && !this.reduced) this.raf = requestAnimationFrame(this.frame);
  };

  play() {
    if (this.running) return;
    this.running = true;
    if (this.reduced) this.frame();
    else this.raf = requestAnimationFrame(this.frame);
  }

  private pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.pause();
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
