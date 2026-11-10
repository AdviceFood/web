// js/background-effect.js
import { shaderCode } from "./shader-code.js";

function createFrame(canvas, context, format) {
  return {
    state: {},
    params: {
      detail: 1.78,
      intensity: 4.29,
      zoom: 72,
      rotationSpeed: 100,
      morphSpeed: 5,
      material: 0,
      gradientBalance: 0,
      warp: 0.26,
      twist: 0.04,
      gradientMethod: 0,
      gradient: {
        stops: [
          { position: 0, color: { r: 0.1, g: 0.55, b: 0.3, a: 1 } },
          { position: 0.5, color: { r: 0.35, g: 0.85, b: 0.45, a: 1 } },
          { position: 1, color: { r: 0.05, g: 0.35, b: 0.2, a: 1 } },
        ],
      },
    },
    time: 0,
    output: {
      get width() {
        return canvas.width;
      },
      get height() {
        return canvas.height;
      },
      format,
      _context: context,
    },
  };
}

function setup(device, frame) {
  frame.state.shaderModule = device.createShaderModule({ code: shaderCode });

  const faces = [
    { right: [0, 0, -1], up: [0, 1, 0] },
    { right: [0, 0, 1], up: [0, 1, 0] },
    { right: [1, 0, 0], up: [0, 0, -1] },
    { right: [1, 0, 0], up: [0, 0, 1] },
    { right: [1, 0, 0], up: [0, 1, 0] },
    { right: [-1, 0, 0], up: [0, 1, 0] },
  ];
  const resolution = 32;
  const verticesPerFace = (resolution + 1) * (resolution + 1);
  const vertexCount = faces.length * verticesPerFace;
  const triangleCount = faces.length * resolution * resolution * 2;
  const vertices = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(triangleCount * 3);
  let vertexOffset = 0;
  let indexOffset = 0;

  for (let f = 0; f < faces.length; f += 1) {
    const right = faces[f].right;
    const up = faces[f].up;
    const forward = [
      right[1] * up[2] - right[2] * up[1],
      right[2] * up[0] - right[0] * up[2],
      right[0] * up[1] - right[1] * up[0],
    ];
    const baseIndex = vertexOffset / 3;

    for (let row = 0; row <= resolution; row += 1) {
      const v = (row / resolution) * 2 - 1;
      for (let column = 0; column <= resolution; column += 1) {
        const u = (column / resolution) * 2 - 1;
        const x = forward[0] + right[0] * u + up[0] * v;
        const y = forward[1] + right[1] * u + up[1] * v;
        const z = forward[2] + right[2] * u + up[2] * v;
        const x2 = x * x,
          y2 = y * y,
          z2 = z * z;
        vertices[vertexOffset] =
          x * Math.sqrt(1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3);
        vertices[vertexOffset + 1] =
          y * Math.sqrt(1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3);
        vertices[vertexOffset + 2] =
          z * Math.sqrt(1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3);
        vertexOffset += 3;
      }
    }

    const rowSize = resolution + 1;
    for (let row = 0; row < resolution; row += 1) {
      for (let column = 0; column < resolution; column += 1) {
        const a = baseIndex + row * rowSize + column;
        const b = a + 1;
        const c = a + rowSize + 1;
        const d = a + rowSize;
        indices[indexOffset] = a;
        indices[indexOffset + 1] = b;
        indices[indexOffset + 2] = c;
        indices[indexOffset + 3] = a;
        indices[indexOffset + 4] = c;
        indices[indexOffset + 5] = d;
        indexOffset += 6;
      }
    }
  }

  frame.state.vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(frame.state.vertexBuffer.getMappedRange()).set(vertices);
  frame.state.vertexBuffer.unmap();

  frame.state.indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint32Array(frame.state.indexBuffer.getMappedRange()).set(indices);
  frame.state.indexBuffer.unmap();
  frame.state.indexCount = indices.length;

  frame.state.uniformBuf = device.createBuffer({
    size: 224,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  frame.state.uniformData = new Float32Array(56);
  frame.state.vertexBuffers = [
    {
      arrayStride: 12,
      attributes: [{ shaderLocation: 0, format: "float32x3", offset: 0 }],
    },
  ];

  frame.state.defaultGradientStops = [
    { position: 0, color: { r: 1, g: 0.9137254902, b: 0.6196078431, a: 1 } },
    { position: 0.5, color: { r: 0.5058823529, g: 0.4705882353, b: 1, a: 1 } },
    { position: 1, color: { r: 1, g: 0, b: 0.6078431373, a: 1 } },
  ];

  frame.state.outputTexture = null;
  frame.state.outputView = null;
  frame.state.zoomAspect = Number.NaN;
  frame.state.minimumZoom = 0.5;
  frame.state.pipelineFormat = null;
  frame.state.pipeline = null;
  frame.state.backdropPipeline = null;
  frame.state.bindGroup = null;
  frame.state.backdropBindGroup = null;
  frame.state.depthTexture = null;
  frame.state.msaaTexture = null;
  frame.state.msaaView = null;
  frame.state.depthView = null;
  frame.state.attachmentWidth = 0;
  frame.state.attachmentHeight = 0;
  frame.state.attachmentFormat = null;
}

function render(device, frame) {
  const s = frame.state;
  const sampleCount = 1;

  if (s.pipelineFormat !== frame.output.format) {
    s.pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: s.shaderModule,
        entryPoint: "vs_main",
        buffers: s.vertexBuffers,
      },
      fragment: {
        module: s.shaderModule,
        entryPoint: "fs_main",
        targets: [{ format: frame.output.format }],
      },
      primitive: {
        topology: "triangle-list",
        frontFace: "ccw",
        cullMode: "back",
      },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
      multisample: { count: sampleCount },
    });
    s.backdropPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: s.shaderModule, entryPoint: "vs_backdrop" },
      fragment: {
        module: s.shaderModule,
        entryPoint: "fs_backdrop",
        targets: [{ format: frame.output.format }],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: false,
        depthCompare: "always",
      },
      multisample: { count: sampleCount },
    });
    s.pipelineFormat = frame.output.format;
    s.bindGroup = null;
    s.backdropBindGroup = null;
  }

  if (
    !s.depthTexture ||
    !s.msaaTexture ||
    s.attachmentWidth !== frame.output.width ||
    s.attachmentHeight !== frame.output.height ||
    s.attachmentFormat !== frame.output.format
  ) {
    if (s.depthTexture) s.depthTexture.destroy();
    if (s.msaaTexture) s.msaaTexture.destroy();

    s.msaaTexture = device.createTexture({
      size: {
        width: frame.output.width,
        height: frame.output.height,
        depthOrArrayLayers: 1,
      },
      format: frame.output.format,
      sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    s.depthTexture = device.createTexture({
      size: {
        width: frame.output.width,
        height: frame.output.height,
        depthOrArrayLayers: 1,
      },
      format: "depth24plus",
      sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    s.msaaView = s.msaaTexture.createView();
    s.depthView = s.depthTexture.createView();
    s.attachmentWidth = frame.output.width;
    s.attachmentHeight = frame.output.height;
    s.attachmentFormat = frame.output.format;
  }

  const width = frame.output.width;
  const height = Math.max(frame.output.height, 1);
  const aspect = width / height;
  const maximumZoom = 10;

  if (s.zoomAspect !== aspect) {
    const diagonal = Math.sqrt(1 + aspect * aspect);
    const safeRadius = 0.72;
    const cameraDistance = 3;
    const baseFocalLength = 1.73;
    const targetCoverZoom = 4;
    const targetFocalLength = baseFocalLength * targetCoverZoom;
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
        cameraDistance * cameraDistance -
          conservativeRadius * conservativeRadius,
      ),
    );
    const unclampedMinimumCoverZoom =
      ((diagonal * perspectiveDepth) / (baseFocalLength * conservativeRadius)) *
      1.12;
    const minimumCoverZoom = Math.min(
      maximumZoom,
      Math.max(0.5, unclampedMinimumCoverZoom),
    );
    const zoomOutFactor = 0.65;
    s.minimumZoom = Math.min(
      maximumZoom,
      Math.max(0.5, minimumCoverZoom * zoomOutFactor),
    );
    s.zoomAspect = aspect;
  }

  const params = frame.params || {};
  const gradient = params.gradient;
  const stops =
    gradient && Array.isArray(gradient.stops) && gradient.stops.length > 0
      ? gradient.stops
      : s.defaultGradientStops;
  const stopCount = Math.min(8, stops.length);
  const detail = params.detail ?? 1.78;
  const intensity = params.intensity ?? 4.29;
  const zoomPercent = params.zoom ?? 72;
  const clampedZoomPercent = Math.min(100, Math.max(0, zoomPercent));
  const zoomProgress = clampedZoomPercent / 100;
  const minimumZoom = s.minimumZoom;
  const unclampedZoom =
    minimumZoom * Math.pow(maximumZoom / minimumZoom, zoomProgress);
  const zoom = Math.min(maximumZoom, Math.max(minimumZoom, unclampedZoom));

  const rotationSpeedPercent = params.rotationSpeed ?? 12;
  const clampedRotationSpeedPercent = Math.min(
    100,
    Math.max(0, rotationSpeedPercent),
  );
  const rotationSpeed = Math.min(
    0.25,
    (clampedRotationSpeedPercent / 100) * 0.25,
  );
  const morphSpeed = params.morphSpeed ?? 3.74;
  const material = params.material ?? 0;
  const shading = material === 0 ? 0 : 0.5;
  const balancePercent = params.gradientBalance ?? 0;
  const balance = Math.min(100, Math.max(-100, balancePercent)) / 100;
  const warp = params.warp ?? 0.26;
  const twist = params.twist ?? 0.04;
  const gradientMethod = params.gradientMethod ?? 0;

  s.uniformData[0] = detail;
  s.uniformData[1] = (frame.time ?? 0) * 0.001;
  s.uniformData[2] = aspect;
  s.uniformData[3] = stopCount;
  s.uniformData[44] = zoom;
  s.uniformData[45] = morphSpeed;
  s.uniformData[46] = material;
  s.uniformData[47] = rotationSpeed;
  s.uniformData[48] = balance;
  s.uniformData[49] = shading;
  s.uniformData[50] = warp;
  s.uniformData[51] = intensity;
  s.uniformData[52] = twist;
  s.uniformData[53] = gradientMethod;

  for (let i = 0; i < stopCount; i += 1) {
    const stop = stops[i];
    const color =
      stop && stop.color ? stop.color : { r: 0.2, g: 0.5, b: 1, a: 1 };
    const colorOffset = 4 + i * 4;
    s.uniformData[colorOffset] = color.r;
    s.uniformData[colorOffset + 1] = color.g;
    s.uniformData[colorOffset + 2] = color.b;
    s.uniformData[colorOffset + 3] = color.a;
    s.uniformData[36 + i] = stop ? stop.position : 0;
  }

  device.queue.writeBuffer(s.uniformBuf, 0, s.uniformData);

  if (!s.bindGroup) {
    s.bindGroup = device.createBindGroup({
      layout: s.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: s.uniformBuf } }],
    });
  }
  if (!s.backdropBindGroup) {
    s.backdropBindGroup = device.createBindGroup({
      layout: s.backdropPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: s.uniformBuf } }],
    });
  }

  const currentTexture = frame.output._context.getCurrentTexture();
  const currentView = currentTexture.createView();

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: s.msaaView,
        resolveTarget: currentView,
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        storeOp: "discard",
      },
    ],
    depthStencilAttachment: {
      view: s.depthView,
      depthLoadOp: "clear",
      depthClearValue: 1,
      depthStoreOp: "discard",
    },
  });
  pass.setPipeline(s.backdropPipeline);
  pass.setBindGroup(0, s.backdropBindGroup);
  pass.draw(3);
  pass.setPipeline(s.pipeline);
  pass.setBindGroup(0, s.bindGroup);
  pass.setVertexBuffer(0, s.vertexBuffer);
  pass.setIndexBuffer(s.indexBuffer, "uint32");
  pass.drawIndexed(s.indexCount);
  pass.end();
  device.queue.submit([encoder.finish()]);
}

async function main() {
  const canvas = document.getElementById("gpu-canvas");
  const fallback = document.getElementById("fallback");

  if (!navigator.gpu) {
    fallback.style.display = "flex";
    canvas.style.display = "none";
    return;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    fallback.style.display = "flex";
    canvas.style.display = "none";
    return;
  }
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "premultiplied" });

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  resizeCanvas();
  const frame = createFrame(canvas, context, format);
  setup(device, frame);

  const start = performance.now();
  function loop() {
    resizeCanvas();
    frame.time = performance.now() - start;
    render(device, frame);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.__frame = frame;
}

window.addEventListener("load", () => {
  main();
});
