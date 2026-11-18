// A lens for the WebGL shot: single-pass depth of field, scatter-as-gather
// over a golden-angle spiral (after Dennis Gustafsson's "Bokeh depth of field
// in a single pass"). postprocessing's DepthOfFieldEffect haloed type and
// edges; this one keeps a sharp subject sharp and lets blur fall over it
// only from the foreground.
import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'

const fragment = /* glsl */ `
uniform float focus;
uniform float aperture;
uniform float maxBlur;

const float GOLDEN_ANGLE = 2.39996323;
const float RAD_SCALE = 1.1;

float distanceAt(const in float d) {
  return -getViewZ(d);
}

// Blur radius in pixels for a view distance
float cocAt(const in float z) {
  return clamp(abs(1.0 / focus - 1.0 / z) * aperture * resolution.y, 0.0, maxBlur);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  float centerZ = distanceAt(depth);
  float centerSize = cocAt(centerZ);
  vec3 color = inputColor.rgb;
  float total = 1.0;
  float radius = RAD_SCALE;
  for (int i = 0; i < 160; i++) {
    if (radius >= maxBlur) break;
    float angle = float(i) * GOLDEN_ANGLE;
    vec2 tc = uv + vec2(cos(angle), sin(angle)) * texelSize * radius;
    vec3 sampleColor = texture2D(inputBuffer, tc).rgb;
    float sampleZ = distanceAt(readDepth(tc));
    float sampleSize = cocAt(sampleZ);
    // Behind the pixel: it can't blur over something nearer and sharper
    if (sampleZ > centerZ) sampleSize = clamp(sampleSize, 0.0, centerSize * 2.0);
    float m = smoothstep(radius - 0.5, radius + 0.5, sampleSize);
    color += mix(color / total, sampleColor, m);
    total += 1.0;
    radius += RAD_SCALE / radius;
  }
  outputColor = vec4(color / total, inputColor.a);
}
`

export class LensBlurEffect extends Effect {
  constructor() {
    super('LensBlurEffect', fragment, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ['focus', new Uniform(3)],
        ['aperture', new Uniform(0.02)],
        ['maxBlur', new Uniform(14)],
      ]),
    })
  }

  set focus(value: number) {
    const u = this.uniforms.get('focus')
    if (u) u.value = value
  }

  set maxBlur(value: number) {
    const u = this.uniforms.get('maxBlur')
    if (u) u.value = value
  }

  set aperture(value: number) {
    const u = this.uniforms.get('aperture')
    if (u) u.value = value
  }
}
