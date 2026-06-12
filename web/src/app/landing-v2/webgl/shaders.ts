// Particle "currents" shaders. Positions live in normalized [0,1]² screen
// space (y down) and are evaluated per-frame on the GPU — no CPU loop.

export const VERT = /* glsl */ `
precision highp float;

attribute float aT;      // 0..1 position along the stream curve
attribute float aStream; // 0 | 1 | 2 — which bezier the particle rides
attribute float aPhase;  // random 0..1, drives wobble/twinkle/amber pick
attribute float aSize;
attribute float aSpeed;
attribute float aAmp;    // lateral wobble amplitude

uniform vec2  uCP[12];   // 3 streams × 4 cubic-bezier control points
uniform float uTime;
uniform float uScroll;   // page dive progress 0..1
uniform float uAspect;
uniform float uDPR;
uniform vec2  uMouse;    // normalized, y down

varying float vBright;
varying float vAmber;
varying float vAlpha;

vec2 bez(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float u = 1.0 - t;
  return u*u*u*p0 + 3.0*u*u*t*p1 + 3.0*u*t*t*p2 + t*t*t*p3;
}

void main() {
  int idx = int(aStream) * 4;
  vec2 p0 = uCP[idx];
  vec2 p1 = uCP[idx + 1];
  vec2 p2 = uCP[idx + 2];
  vec2 p3 = uCP[idx + 3];

  float t = fract(aT + uTime * aSpeed * 0.012);
  vec2 p = bez(p0, p1, p2, p3, t);
  vec2 tang = normalize(bez(p0, p1, p2, p3, min(t + 0.01, 1.0)) - p + 1e-5);
  vec2 nrm = vec2(-tang.y, tang.x);
  p += nrm * sin(aPhase * 6.2831 + t * 12.566 + uTime * 0.25) * aAmp;

  // Parallax: the world slides up as we dive past the currents chapter.
  float par = 0.22 + 0.12 * aStream;
  p.y -= (uScroll - 0.45) * par;

  // Finale: particles settle onto the lakebed as resting glints.
  float settle = smoothstep(0.74, 0.94, uScroll);
  vec2 bed = vec2(p.x * 0.7 + 0.15, 0.80 + 0.16 * fract(aPhase * 7.31));
  p = mix(p, bed, settle);

  // Mouse: water reacts to the hand — gentle push + glow.
  vec2 d = (p - uMouse) * vec2(uAspect, 1.0);
  float push = exp(-dot(d, d) * 42.0);
  p += normalize(d + 1e-4) * push * 0.028 * (1.0 - settle);

  float twinkle = 0.55 + 0.45 * sin(uTime * (0.5 + aSpeed * 0.35) + aPhase * 6.2831);
  float rest = 0.65 + 0.35 * sin(uTime * 0.3 + aPhase * 6.2831);
  vBright = mix(twinkle, rest, settle) + push * 1.4;
  vAmber = step(0.78, fract(aPhase * 13.7)) * settle;

  // Currents only exist below the surface; fade in after the plunge.
  vAlpha = smoothstep(0.10, 0.24, uScroll);

  vec2 clip = vec2(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = aSize * uDPR * (1.0 + push * 1.6 + settle * 0.4);
}
`;

export const FRAG = /* glsl */ `
precision mediump float;

varying float vBright;
varying float vAmber;
varying float vAlpha;

void main() {
  vec2 q = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.05, length(q));
  a *= a * vAlpha;
  vec3 blue = vec3(0.62, 0.78, 1.0);
  vec3 amber = vec3(1.0, 0.72, 0.35);
  vec3 col = mix(blue, amber, vAmber);
  gl_FragColor = vec4(col * vBright * a, a);
}
`;
