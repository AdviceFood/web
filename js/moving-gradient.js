// Moving gradient — порт Figma Shaders плагина на чистый WebGPU + <canvas>.
// Шейдер (WGSL) перенесён из main.ts без изменений.
//
// Использование:
//   import { createMovingGradient } from "./moving-gradient.js"
//   const fx = await createMovingGradient(canvas, { zoom: 72 })
//   if (!fx) { /* WebGPU недоступен — показать запасной фон */ }
//   fx.setParams({ material: 2 })   // менять параметры на лету
//   fx.stop() / fx.start() / fx.destroy()

const SHADER = `struct Uniforms {
  detail: f32,
  time: f32,
  aspectRatio: f32,
  gradientStopCount: f32,
  colors: array<vec4f, 8>,
  stops: array<vec4f, 2>,
  zoom: f32,
  morphSpeed: f32,
  material: f32,
  rotationSpeed: f32,
  gradientBalance: f32,
  shading: f32,
  warp: f32,
  intensity: f32,
  twist: f32,
  gradientMethod: f32,
  pad0: f32,
  pad1: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsIn {
  @location(0) position: vec3f,
}

struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) baseDirection: vec3f,
  @location(1) worldPosition: vec3f,
}

struct BackdropOut {
  @builtin(position) position: vec4f,
  @location(0) screenUv: vec2f,
}

fn hash33(p: vec3f) -> vec3f {
  let q = vec3f(
    dot(p, vec3f(127.1, 311.7, 74.7)),
    dot(p, vec3f(269.5, 183.3, 246.1)),
    dot(p, vec3f(113.5, 271.9, 124.6))
  );
  return fract(sin(q) * 43758.5453) * 2.0 - 1.0;
}

fn smootherCurve(t: vec3f) -> vec3f {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

fn gradDot(cell: vec3f, offset: vec3f, local: vec3f) -> f32 {
  return dot(hash33(cell + offset), local - offset);
}

fn perlin3(p: vec3f) -> f32 {
  let cell = floor(p);
  let local = fract(p);
  let w = smootherCurve(local);

  let n000 = gradDot(cell, vec3f(0.0, 0.0, 0.0), local);
  let n100 = gradDot(cell, vec3f(1.0, 0.0, 0.0), local);
  let n010 = gradDot(cell, vec3f(0.0, 1.0, 0.0), local);
  let n110 = gradDot(cell, vec3f(1.0, 1.0, 0.0), local);
  let n001 = gradDot(cell, vec3f(0.0, 0.0, 1.0), local);
  let n101 = gradDot(cell, vec3f(1.0, 0.0, 1.0), local);
  let n011 = gradDot(cell, vec3f(0.0, 1.0, 1.0), local);
  let n111 = gradDot(cell, vec3f(1.0, 1.0, 1.0), local);

  let nx00 = mix(n000, n100, w.x);
  let nx10 = mix(n010, n110, w.x);
  let nx01 = mix(n001, n101, w.x);
  let nx11 = mix(n011, n111, w.x);
  let nxy0 = mix(nx00, nx10, w.y);
  let nxy1 = mix(nx01, nx11, w.y);

  return mix(nxy0, nxy1, w.z) * 1.1547;
}

fn rotateOctave(p: vec3f) -> vec3f {
  return vec3f(
     0.00 * p.x + 0.80 * p.y + 0.60 * p.z,
    -0.80 * p.x + 0.36 * p.y - 0.48 * p.z,
    -0.60 * p.x - 0.48 * p.y + 0.64 * p.z
  );
}

fn fbm(p: vec3f) -> f32 {
  var q = p;
  var total = 0.0;
  var amplitude = 1.0;
  var weight = 0.0;

  for (var i = 0; i < 3; i = i + 1) {
    total = total + perlin3(q) * amplitude;
    weight = weight + amplitude;
    q = rotateOctave(q) * 2.02 + vec3f(3.7, 1.9, 6.3);
    amplitude = amplitude * 0.48;
  }

  return total / max(weight, 0.0001);
}

fn warpVector(p: vec3f) -> vec3f {
  return vec3f(
    perlin3(p),
    perlin3(p + vec3f(5.2, 1.3, 2.8)),
    perlin3(p + vec3f(1.7, 9.2, 4.4))
  );
}

fn wrapPhase(phase: f32) -> f32 {
  let tau = 6.28318530718;
  return phase - floor(phase / tau) * tau;
}

fn curvedDomainMotion(
  morphTime: f32,
  rates: vec3f,
  phases: vec3f
) -> vec3f {
  return vec3f(
    sin(wrapPhase(morphTime * rates.x + phases.x)),
    sin(wrapPhase(morphTime * rates.y + phases.y)),
    cos(wrapPhase(morphTime * rates.z + phases.z))
  );
}

fn primaryDomainMotion(morphTime: f32) -> vec3f {
  let primaryDirection = normalize(vec3f(0.73, -0.41, 0.55));
  let secondaryDirection = normalize(vec3f(-0.28, 0.91, 0.31));
  let primaryDrift = primaryDirection * morphTime * 0.105;
  let secondaryDrift = secondaryDirection * morphTime * 0.023;
  let curve = curvedDomainMotion(
    morphTime,
    vec3f(0.071, 0.043, 0.029),
    vec3f(0.0, 1.73, 4.11)
  ) * 0.16;
  return primaryDrift + secondaryDrift + curve;
}

fn warpDomainMotion(morphTime: f32) -> vec3f {
  let primaryDirection = normalize(vec3f(-0.46, 0.38, 0.80));
  let secondaryDirection = normalize(vec3f(0.84, 0.51, -0.18));
  let primaryDrift = primaryDirection * morphTime * 0.137;
  let secondaryDrift = secondaryDirection * morphTime * 0.031;
  let curve = curvedDomainMotion(
    morphTime,
    vec3f(0.089, 0.053, 0.034),
    vec3f(2.21, 5.07, 0.83)
  ) * 0.12;
  return primaryDrift + secondaryDrift + curve;
}

fn gradientDomainMotion(morphTime: f32) -> vec3f {
  let primaryDirection = normalize(vec3f(0.32, 0.76, -0.57));
  let secondaryDirection = normalize(vec3f(-0.88, 0.17, -0.44));
  let primaryDrift = primaryDirection * morphTime * 0.079;
  let secondaryDrift = secondaryDirection * morphTime * 0.019;
  let curve = curvedDomainMotion(
    morphTime,
    vec3f(0.061, 0.037, 0.023),
    vec3f(4.37, 0.91, 2.68)
  ) * 0.19;
  return primaryDrift + secondaryDrift + curve;
}

fn heightField(direction: vec3f, detail: f32) -> f32 {
  let detailLevel = clamp(detail / 5.0, 0.0, 1.0);
  let frequency = mix(1.05, 3.4, detailLevel);
  let morphTime = u.time * max(u.morphSpeed, 0.0);
  let primaryMotion = primaryDomainMotion(morphTime);
  let warpMotion = warpDomainMotion(morphTime);
  let p = direction * frequency +
    vec3f(1.7, 3.1, 5.3) +
    primaryMotion;
  let warp = warpVector(
    p * 0.55 +
    warpMotion * 0.42 +
    vec3f(0.7, -1.1, 0.4)
  ) * u.warp;
  return fbm(p + warp);
}

fn displacementAmount(detail: f32) -> f32 {
  let amount = clamp(detail, 0.0, 1.0);
  let easedAmount = amount * amount * (3.0 - 2.0 * amount);
  return easedAmount * 0.30 * clamp(u.intensity, 0.0, 5.0);
}

fn surfacePoint(direction: vec3f, detail: f32) -> vec3f {
  let height = heightField(direction, detail);
  let displacedRadius = 1.0 + height * displacementAmount(detail);
  let safeRadius = max(displacedRadius, 0.72);
  return direction * safeRadius;
}

fn rotateAroundAxis(p: vec3f, axis: vec3f, angle: f32) -> vec3f {
  let c = cos(angle);
  let s = sin(angle);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

fn twistAxis() -> vec3f {
  return normalize(vec3f(-0.68, 0.54, 0.49));
}

fn torsionAngle(direction: vec3f) -> f32 {
  let axis = twistAxis();
  let axial = clamp(dot(direction, axis), -1.0, 1.0);
  let smoothAxial = axial * (1.5 - 0.5 * axial * axial);
  return smoothAxial * clamp(u.twist, 0.0, 7.0);
}

fn twistedSurfacePoint(direction: vec3f, detail: f32) -> vec3f {
  let axis = twistAxis();
  let point = surfacePoint(direction, detail);
  return rotateAroundAxis(point, axis, torsionAngle(direction));
}

fn twistedFieldNormal(direction: vec3f, detail: f32) -> vec3f {
  var reference = vec3f(0.0, 1.0, 0.0);
  if (abs(direction.y) > 0.9) {
    reference = vec3f(1.0, 0.0, 0.0);
  }

  let tangent = normalize(cross(reference, direction));
  let bitangent = normalize(cross(direction, tangent));
  let epsilon = 0.02;

  let tA = twistedSurfacePoint(
    normalize(direction - tangent * epsilon),
    detail
  );
  let tB = twistedSurfacePoint(
    normalize(direction + tangent * epsilon),
    detail
  );
  let bA = twistedSurfacePoint(
    normalize(direction - bitangent * epsilon),
    detail
  );
  let bB = twistedSurfacePoint(
    normalize(direction + bitangent * epsilon),
    detail
  );

  var normal = normalize(cross(tB - tA, bB - bA));
  let outward = normalize(twistedSurfacePoint(direction, detail));
  if (dot(normal, outward) < 0.0) {
    normal = -normal;
  }
  return normal;
}

fn spreadCoordinate(raw: f32) -> f32 {
  let gain = 3.0;
  return clamp((raw - 0.5) * gain + 0.5, 0.0, 1.0);
}

fn objectGradientCoordinate(
  method: i32,
  direction: vec3f,
  field: f32,
  morphTime: f32
) -> f32 {
  if (method == 1) {
    let gradientMotion = gradientDomainMotion(morphTime);
    let gradientWarpMotion = warpDomainMotion(morphTime * 0.71);
    let p = direction * 1.18 +
      vec3f(-2.4, 4.1, 1.6) +
      gradientMotion;
    let broadWarp = warpVector(
      p * 0.42 +
      vec3f(3.2, -1.7, 2.5) +
      gradientWarpMotion * 0.19
    ) * 0.16;
    return spreadCoordinate(fbm(p + broadWarp) * 0.5 + 0.5);
  }

  return spreadCoordinate(field * 0.5 + 0.5);
}

fn srgbToLinear(c: vec3f) -> vec3f {
  let v = max(c, vec3f(0.0));
  let cutoff = step(vec3f(0.04045), v);
  let low = v / 12.92;
  let high = pow((v + 0.055) / 1.055, vec3f(2.4));
  return mix(low, high, cutoff);
}

fn linearToSrgb(c: vec3f) -> vec3f {
  let v = max(c, vec3f(0.0));
  let cutoff = step(vec3f(0.0031308), v);
  let low = v * 12.92;
  let high = 1.055 * pow(v, vec3f(1.0 / 2.4)) - 0.055;
  return mix(low, high, cutoff);
}

fn linearToOklab(c: vec3f) -> vec3f {
  let l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  let m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  let s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

  let lc = pow(max(l, 0.0), 1.0 / 3.0);
  let mc = pow(max(m, 0.0), 1.0 / 3.0);
  let sc = pow(max(s, 0.0), 1.0 / 3.0);

  return vec3f(
    0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
    1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
    0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc
  );
}

fn oklabToLinear(c: vec3f) -> vec3f {
  let lc = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  let mc = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  let sc = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

  let l = lc * lc * lc;
  let m = mc * mc * mc;
  let s = sc * sc * sc;

  return vec3f(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

fn stopPosition(index: i32) -> f32 {
  if (index < 4) {
    return u.stops[0][index];
  }
  return u.stops[1][index - 4];
}

fn gradientAt(t: f32) -> vec4f {
  let count = clamp(i32(u.gradientStopCount + 0.5), 1, 8);
  if (count == 1) {
    return u.colors[0];
  }

  var lowIndex = 0;
  for (var i = 0; i < 7; i = i + 1) {
    if (i >= count - 1) {
      break;
    }
    if (t >= stopPosition(i)) {
      lowIndex = i;
    }
  }
  let highIndex = lowIndex + 1;

  let start = stopPosition(lowIndex);
  let end = stopPosition(highIndex);
  var amount = clamp((t - start) / max(end - start, 0.0001), 0.0, 1.0);
  amount = amount * amount * (3.0 - 2.0 * amount);

  let a = u.colors[lowIndex];
  let b = u.colors[highIndex];

  let labA = linearToOklab(srgbToLinear(a.rgb));
  let labB = linearToOklab(srgbToLinear(b.rgb));
  let blended = linearToSrgb(oklabToLinear(mix(labA, labB, amount)));

  return vec4f(blended, mix(a.a, b.a, amount));
}

fn balanceRemap(coordinate: f32) -> f32 {
  let balance = clamp(u.gradientBalance, -1.0, 1.0);
  let balanceExponent = pow(4.0, balance);
  return pow(clamp(coordinate, 0.0, 1.0), 1.0 / balanceExponent);
}

fn rotateX(p: vec3f, angle: f32) -> vec3f {
  let c = cos(angle);
  let s = sin(angle);
  return vec3f(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

fn animatedOrientation(p: vec3f, rotationTime: f32) -> vec3f {
  let axisA = normalize(vec3f(0.36, 0.81, 0.46));
  let axisB = normalize(vec3f(-0.71, 0.29, 0.64));
  let axisC = normalize(vec3f(0.58, -0.69, 0.43));

  let angleA = wrapPhase(rotationTime * 0.287);
  let angleB = wrapPhase(rotationTime * 0.2236068);
  let angleC = wrapPhase(rotationTime * 0.1732051);

  var oriented = rotateAroundAxis(p, axisA, angleA);
  oriented = rotateAroundAxis(oriented, axisB, angleB);
  oriented = rotateAroundAxis(oriented, axisC, angleC);
  return rotateX(oriented, -0.24);
}

fn coverSphereScale(aspect: f32) -> f32 {
  let safeRadius = 0.72;
  let cameraDistance = 3.0;
  let targetZoom = 4.0;
  let baseFocalLength = 1.73;
  let diagonal = sqrt(1.0 + aspect * aspect);
  let targetFocalLength = baseFocalLength * targetZoom;
  let requiredRadius = cameraDistance * diagonal /
    sqrt(
      targetFocalLength * targetFocalLength +
      diagonal * diagonal
    );
  return max(0.82, requiredRadius / safeRadius);
}

@vertex fn vs_backdrop(@builtin(vertex_index) index: u32) -> BackdropOut {
  let positions = array(
    vec2f(-1.0, -3.0),
    vec2f(-1.0, 1.0),
    vec2f(3.0, 1.0)
  );

  let p = positions[index];

  var out: BackdropOut;
  out.position = vec4f(p, 0.5, 1.0);
  out.screenUv = vec2f(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  return out;
}

@fragment fn fs_backdrop(in: BackdropOut) -> @location(0) vec4f {
  let aspect = max(u.aspectRatio, 0.001);
  let axis = normalize(vec2f(0.62 * aspect, 0.78));
  let centered = vec2f(
    (in.screenUv.x - 0.5) * aspect,
    in.screenUv.y - 0.5
  );
  let extent = abs(axis.x) * aspect * 0.5 + abs(axis.y) * 0.5;
  let raw = dot(centered, axis) / max(extent * 2.0, 0.0001) + 0.5;
  return gradientAt(balanceRemap(raw));
}

@vertex fn vs_main(in: VsIn) -> VsOut {
  let detail = clamp(u.detail, 0.0, 5.0);
  let rotationTime = u.time * max(u.rotationSpeed, 0.0);
  let aspect = max(u.aspectRatio, 0.001);
  let zoom = clamp(u.zoom, 0.5, 10.0);

  let baseDirection = normalize(in.position);
  let objectPosition = twistedSurfacePoint(baseDirection, detail);
  let rotatedPosition = animatedOrientation(objectPosition, rotationTime);

  let sphereScale = coverSphereScale(aspect);
  let worldPosition = rotatedPosition * sphereScale;
  let cameraDistance = 3.0;
  let viewPosition = worldPosition + vec3f(0.0, 0.0, -cameraDistance);

  let focalLength = 1.73 * zoom;
  let nearPlane = 0.1;
  let farPlane = 10.0;
  let depthA = farPlane / (nearPlane - farPlane);
  let depthB = nearPlane * farPlane / (nearPlane - farPlane);

  var out: VsOut;
  out.position = vec4f(
    viewPosition.x * focalLength / aspect,
    viewPosition.y * focalLength,
    depthA * viewPosition.z + depthB,
    -viewPosition.z
  );
  out.baseDirection = baseDirection;
  out.worldPosition = worldPosition;
  return out;
}

@fragment fn fs_main(in: VsOut) -> @location(0) vec4f {
  let detail = clamp(u.detail, 0.0, 5.0);
  let rotationTime = u.time * max(u.rotationSpeed, 0.0);
  let morphTime = u.time * max(u.morphSpeed, 0.0);
  let material = i32(u.material + 0.5);
  let shading = clamp(u.shading, 0.0, 1.0);
  let gradientMethod = clamp(i32(u.gradientMethod + 0.5), 0, 2);

  let direction = normalize(in.baseDirection);
  var field = 0.0;
  if (gradientMethod == 0 || material == 4) {
    field = heightField(direction, detail);
  }

  var normal = vec3f(0.0, 0.0, 1.0);
  var viewDirection = vec3f(0.0, 0.0, 1.0);
  var facing = 0.0;
  if (gradientMethod == 2 || material != 0) {
    let objectNormal = twistedFieldNormal(direction, detail);
    normal = normalize(animatedOrientation(objectNormal, rotationTime));
    viewDirection = normalize(vec3f(0.0, 0.0, 3.0) - in.worldPosition);
    facing = max(dot(normal, viewDirection), 0.0);
  }

  var gradientCoordinate = 0.0;
  if (gradientMethod == 2) {
    gradientCoordinate = 1.0 - facing;
  } else {
    gradientCoordinate = objectGradientCoordinate(
      gradientMethod,
      direction,
      field,
      morphTime
    );
  }

  let t = balanceRemap(gradientCoordinate);
  let baseColor = gradientAt(t);

  if (material == 0) {
    return baseColor;
  }

  let keyDirection = normalize(vec3f(-0.45, 0.7, 0.65));
  let fillDirection = normalize(vec3f(0.5, -0.3, 0.4));
  let halfDirection = normalize(keyDirection + viewDirection);

  let key = max(dot(normal, keyDirection), 0.0);
  let fill = max(dot(normal, fillDirection), 0.0) * 0.22;
  let highlight = max(dot(normal, halfDirection), 0.0);

  if (material == 4) {
    let fresnel = pow(1.0 - facing, 3.0);
    let dispersion = 0.025 + fresnel * 0.075;

    let redSample = gradientAt(clamp(t + dispersion, 0.0, 1.0));
    let greenSample = gradientAt(t);
    let blueSample = gradientAt(clamp(t - dispersion, 0.0, 1.0));
    let refractedColor = vec3f(
      redSample.r,
      greenSample.g,
      blueSample.b
    );

    let filmPhase = (
      (1.0 - facing) * 18.0 +
      field * 7.0 +
      morphTime * 0.18
    );
    let filmColor = 0.5 + 0.5 * cos(vec3f(
      filmPhase,
      filmPhase + 2.094,
      filmPhase + 4.188
    ));

    let reflectionDirection = reflect(-viewDirection, normal);
    let skyAmount = clamp(reflectionDirection.y * 0.5 + 0.5, 0.0, 1.0);
    let environmentColor = mix(
      vec3f(0.08, 0.04, 0.16),
      vec3f(0.42, 0.72, 1.0),
      skyAmount
    );

    let glassHighlight = pow(highlight, 120.0);
    let transmission = refractedColor * (0.28 + facing * 0.48);
    let iridescence = filmColor * (0.13 + fresnel * 0.38);
    let reflection = environmentColor * (0.12 + fresnel * 0.7);
    let glassColor = transmission + iridescence + reflection +
      vec3f(glassHighlight * 0.95);

    let glassAlpha = clamp(
      baseColor.a * (0.38 + fresnel * 0.48),
      0.0,
      1.0
    );
    let shadedGlassColor = mix(baseColor.rgb, glassColor, shading);
    let shadedGlassAlpha = mix(baseColor.a, glassAlpha, shading);
    return vec4f(shadedGlassColor, shadedGlassAlpha);
  }

  var ambientAmount = 0.42;
  var diffuseAmount = 0.58;
  var specularAmount = 0.05;
  var specularPower = 8.0;
  var rimAmount = 0.04;
  var rimPower = 3.0;
  var metallic = 0.0;

  if (material == 1) {
    ambientAmount = 0.40;
    diffuseAmount = 0.60;
    specularAmount = 0.14;
    specularPower = 22.0;
    rimAmount = 0.07;
    rimPower = 2.8;
  } else if (material == 2) {
    ambientAmount = 0.34;
    diffuseAmount = 0.60;
    specularAmount = 0.42;
    specularPower = 72.0;
    rimAmount = 0.12;
    rimPower = 2.2;
  } else if (material == 3) {
    ambientAmount = 0.26;
    diffuseAmount = 0.46;
    specularAmount = 0.66;
    specularPower = 54.0;
    rimAmount = 0.18;
    rimPower = 1.8;
    metallic = 0.85;
  }

  let specular = pow(highlight, specularPower) * specularAmount;
  let rim = pow(1.0 - facing, rimPower) * rimAmount;
  let diffuseColor = baseColor.rgb *
    (ambientAmount + (key + fill) * diffuseAmount);
  let dielectricReflection = vec3f(specular + rim);
  let metalReflection = baseColor.rgb * (specular + rim * 1.25);
  let reflection = mix(
    dielectricReflection,
    metalReflection,
    metallic
  );
  let litColor = diffuseColor + reflection;
  let finalColor = mix(baseColor.rgb, litColor, shading);

  return vec4f(finalColor, baseColor.a);
}
`;

export const DEFAULT_PARAMS = {
  detail: 1.78, // 0..5
  intensity: 4.29, // 0..5
  twist: 0.04, // 0..7
  warp: 0.26, // 0..1.5  (Flow)
  zoom: 72, // 0..100 %
  rotationSpeed: 12, // 0..100 %
  morphSpeed: 3.74, // 0..5
  material: 0, // 0 None, 1 Satin, 2 Glossy, 3 Metallic, 4 Iridescent
  gradientBalance: 0, // -100..100 %
  gradientMethod: 0, // 0 Height, 1 Noise, 2 Facing
  gradient: {
    stops: [
      { position: 0, color: { r: 1, g: 0.9137254902, b: 0.6196078431, a: 1 } },
      {
        position: 0.5,
        color: { r: 0.5058823529, g: 0.4705882353, b: 1, a: 1 },
      },
      { position: 1, color: { r: 1, g: 0, b: 0.6078431373, a: 1 } },
    ],
  },
};

const SAMPLE_COUNT = 4;
const DEPTH_FORMAT = "depth24plus";
const MAXIMUM_ZOOM = 10;

// Цвет можно задавать как {r,g,b,a} (0..1, sRGB) или строкой "#rgb" / "#rrggbb" / "#rrggbbaa"
function parseColor(c) {
  if (typeof c !== "string") return { r: c.r, g: c.g, b: c.b, a: c.a ?? 1 };
  let h = c.replace("#", "");
  if (h.length <= 4)
    h = h
      .split("")
      .map((x) => x + x)
      .join("");
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length >= 8 ? n(6) : 1 };
}

// Сфера из 6 граней куба (cube-sphere), 112x112 квадов на грань
function buildSphere() {
  const faces = [
    { right: [0, 0, -1], up: [0, 1, 0] },
    { right: [0, 0, 1], up: [0, 1, 0] },
    { right: [1, 0, 0], up: [0, 0, -1] },
    { right: [1, 0, 0], up: [0, 0, 1] },
    { right: [1, 0, 0], up: [0, 1, 0] },
    { right: [-1, 0, 0], up: [0, 1, 0] },
  ];
  const resolution = 112;
  const verticesPerFace = (resolution + 1) * (resolution + 1);
  const vertices = new Float32Array(faces.length * verticesPerFace * 3);
  const indices = new Uint32Array(faces.length * resolution * resolution * 6);
  let vo = 0;
  let io = 0;

  for (const { right, up } of faces) {
    const forward = [
      right[1] * up[2] - right[2] * up[1],
      right[2] * up[0] - right[0] * up[2],
      right[0] * up[1] - right[1] * up[0],
    ];
    const baseIndex = vo / 3;

    for (let row = 0; row <= resolution; row++) {
      const v = (row / resolution) * 2 - 1;
      for (let col = 0; col <= resolution; col++) {
        const u = (col / resolution) * 2 - 1;
        const x = forward[0] + right[0] * u + up[0] * v;
        const y = forward[1] + right[1] * u + up[1] * v;
        const z = forward[2] + right[2] * u + up[2] * v;
        const x2 = x * x,
          y2 = y * y,
          z2 = z * z;
        vertices[vo++] = x * Math.sqrt(1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3);
        vertices[vo++] = y * Math.sqrt(1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3);
        vertices[vo++] = z * Math.sqrt(1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3);
      }
    }

    const rowSize = resolution + 1;
    for (let row = 0; row < resolution; row++) {
      for (let col = 0; col < resolution; col++) {
        const a = baseIndex + row * rowSize + col;
        const b = a + 1;
        const c = a + rowSize + 1;
        const d = a + rowSize;
        indices.set([a, b, c, a, c, d], io);
        io += 6;
      }
    }
  }
  return { vertices, indices };
}

// Минимальный зум, при котором сфера закрывает весь кадр (зависит от пропорций)
function computeMinimumZoom(aspect) {
  const diagonal = Math.sqrt(1 + aspect * aspect);
  const safeRadius = 0.72;
  const cameraDistance = 3;
  const baseFocalLength = 1.73;
  const targetFocalLength = baseFocalLength * 4;
  const requiredRadius =
    (cameraDistance * diagonal) /
    Math.sqrt(targetFocalLength * targetFocalLength + diagonal * diagonal);
  const sphereScale = Math.max(0.82, requiredRadius / safeRadius);
  const conservativeRadius = Math.min(
    cameraDistance - 0.001,
    sphereScale * safeRadius,
  );
  const perspectiveDepth = Math.sqrt(
    Math.max(
      0.0001,
      cameraDistance * cameraDistance - conservativeRadius * conservativeRadius,
    ),
  );
  const coverZoom =
    ((diagonal * perspectiveDepth) / (baseFocalLength * conservativeRadius)) *
    1.12;
  const minimumCoverZoom = Math.min(MAXIMUM_ZOOM, Math.max(0.5, coverZoom));
  return Math.min(MAXIMUM_ZOOM, Math.max(0.5, minimumCoverZoom * 0.65));
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Partial<typeof DEFAULT_PARAMS>} [userParams]
 * @param {{maxDpr?: number, alphaMode?: "premultiplied"|"opaque", pauseWhenHidden?: boolean, autoStart?: boolean}} [options]
 * @returns {Promise<null | {setParams, start, stop, renderFrame, destroy}>}
 *   null — если WebGPU недоступен
 */
export async function createMovingGradient(
  canvas,
  userParams = {},
  options = {},
) {
  const {
    maxDpr = 2,
    alphaMode = "premultiplied",
    pauseWhenHidden = true,
    autoStart = true,
  } = options;

  if (!navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;
  const device = await adapter.requestDevice();

  const context = canvas.getContext("webgpu");
  if (!context) return null;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode });

  // --- шейдер ---
  const shaderModule = device.createShaderModule({ code: SHADER });

  // --- геометрия ---
  const { vertices, indices } = buildSphere();
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);
  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  // --- uniforms: 56 float = 224 байта (раскладка совпадает со struct Uniforms в WGSL) ---
  const uniformData = new Float32Array(56);
  const uniformBuf = device.createBuffer({
    size: 224,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- пайплайны ---
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, format: "float32x3", offset: 0 }],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
      frontFace: "ccw",
      cullMode: "back",
    },
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: true,
      depthCompare: "less",
    },
    multisample: { count: SAMPLE_COUNT },
  });

  const backdropPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: shaderModule, entryPoint: "vs_backdrop" },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_backdrop",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
    depthStencil: {
      format: DEPTH_FORMAT,
      depthWriteEnabled: false,
      depthCompare: "always",
    },
    multisample: { count: SAMPLE_COUNT },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuf } }],
  });
  const backdropBindGroup = device.createBindGroup({
    layout: backdropPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuf } }],
  });

  // --- параметры ---
  let params = { ...DEFAULT_PARAMS, ...userParams };

  // --- вложения (MSAA + глубина), пересоздаются при смене размера ---
  let msaaTexture = null;
  let depthTexture = null;
  let msaaView = null;
  let depthView = null;
  let zoomAspect = NaN;
  let minimumZoom = 0.5;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h && msaaTexture) return;
    canvas.width = w;
    canvas.height = h;
    msaaTexture?.destroy();
    depthTexture?.destroy();
    msaaTexture = device.createTexture({
      size: { width: w, height: h },
      format,
      sampleCount: SAMPLE_COUNT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    depthTexture = device.createTexture({
      size: { width: w, height: h },
      format: DEPTH_FORMAT,
      sampleCount: SAMPLE_COUNT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    msaaView = msaaTexture.createView();
    depthView = depthTexture.createView();
  }

  function writeUniforms(timeSeconds) {
    const aspect = canvas.width / Math.max(canvas.height, 1);
    if (zoomAspect !== aspect) {
      minimumZoom = computeMinimumZoom(aspect);
      zoomAspect = aspect;
    }

    const p = params;
    const stops = (
      p.gradient?.stops?.length
        ? p.gradient.stops
        : DEFAULT_PARAMS.gradient.stops
    )
      .map((s) => ({ position: s.position, color: parseColor(s.color) }))
      .sort((a, b) => a.position - b.position);
    const stopCount = Math.min(8, stops.length);

    const zoomProgress = Math.min(100, Math.max(0, p.zoom)) / 100;
    const zoom = Math.min(
      MAXIMUM_ZOOM,
      Math.max(
        minimumZoom,
        minimumZoom * Math.pow(MAXIMUM_ZOOM / minimumZoom, zoomProgress),
      ),
    );
    const rotationSpeed = Math.min(
      0.25,
      Math.max(0, (Math.min(100, Math.max(0, p.rotationSpeed)) / 100) * 0.25),
    );
    const balance = Math.min(100, Math.max(-100, p.gradientBalance)) / 100;

    const u = uniformData;
    u[0] = p.detail;
    u[1] = timeSeconds;
    u[2] = aspect;
    u[3] = stopCount;
    u[44] = zoom;
    u[45] = p.morphSpeed;
    u[46] = p.material;
    u[47] = rotationSpeed;
    u[48] = balance;
    u[49] = p.material === 0 ? 0 : 0.5; // shading
    u[50] = p.warp;
    u[51] = p.intensity;
    u[52] = p.twist;
    u[53] = p.gradientMethod;

    for (let i = 0; i < stopCount; i++) {
      const { color, position } = stops[i];
      const o = 4 + i * 4;
      u[o] = color.r;
      u[o + 1] = color.g;
      u[o + 2] = color.b;
      u[o + 3] = color.a;
      u[36 + i] = position;
    }
    device.queue.writeBuffer(uniformBuf, 0, u);
  }

  const t0 = performance.now();

  function renderFrame(now = performance.now()) {
    resize();
    writeUniforms((now - t0) * 0.001);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: msaaView,
          resolveTarget: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          storeOp: "discard",
        },
      ],
      depthStencilAttachment: {
        view: depthView,
        depthLoadOp: "clear",
        depthClearValue: 1,
        depthStoreOp: "discard",
      },
    });
    pass.setPipeline(backdropPipeline);
    pass.setBindGroup(0, backdropBindGroup);
    pass.draw(3);
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint32");
    pass.drawIndexed(indices.length);
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  // --- цикл анимации ---
  let rafId = 0;
  let running = false;
  let visible = true;
  let destroyed = false;

  const loop = (now) => {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    if (visible) renderFrame(now);
  };

  let observer = null;
  if (pauseWhenHidden && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    observer.observe(canvas);
  }

  function start() {
    if (running || destroyed) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }
  function destroy() {
    stop();
    destroyed = true;
    observer?.disconnect();
    msaaTexture?.destroy();
    depthTexture?.destroy();
    vertexBuffer.destroy();
    indexBuffer.destroy();
    uniformBuf.destroy();
    context.unconfigure();
    device.destroy();
  }
  function setParams(patch) {
    params = { ...params, ...patch };
    if (!running && !destroyed) renderFrame(); // если анимация остановлена — перерисовать кадр
  }

  device.lost.then(() => {
    running = false;
  });

  if (autoStart) start();
  else renderFrame();

  return { setParams, start, stop, renderFrame, destroy };
}
