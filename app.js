const canvas = document.querySelector("#artboard");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const defaultPoints = [
  { x: 0.16, y: 0.18 },
  { x: 0.72, y: 0.22 },
  { x: 0.58, y: 0.58 },
  { x: 0.3, y: 0.78 },
  { x: 0.86, y: 0.74 },
];
const defaultSizes = [36, 40, 44, 38, 34];
const minBlobCount = 1;
const maxBlobCount = 12;

const presets = [
  {
    name: "Aqua",
    base: ["#f7fbff", "#d7f0ff", "#8ac5ff", "#f8d9ff", "#ffffff"],
  },
  {
    name: "Bloom",
    base: ["#fff9f3", "#ffd7a8", "#ff8aa7", "#9dd7c8", "#f5f7ff"],
  },
  {
    name: "Studio",
    base: ["#f6f6f7", "#bdc7d5", "#7185a0", "#e5cfbd", "#ffffff"],
  },
  {
    name: "Aurora",
    base: ["#eefdf6", "#7adbc4", "#64a7ff", "#d9b5ff", "#fff8e5"],
  },
  {
    name: "Graphite",
    base: ["#eef1f2", "#77828f", "#20252c", "#b7c0c9", "#fff2d8"],
  },
  {
    name: "Candy",
    base: ["#fff8fb", "#ff90c1", "#8aa8ff", "#80ead5", "#fff0b8"],
  },
  {
    name: "Sunset",
    base: ["#fff2e8", "#ffb36f", "#ff6f91", "#8e7dff", "#dff7ff"],
  },
  {
    name: "Sakura",
    base: ["#fff7fb", "#ffc7da", "#ff8fab", "#cdb4db", "#bde0fe"],
  },
  {
    name: "Matcha",
    base: ["#f7fbef", "#d6edb7", "#98d8aa", "#55a37a", "#fff0c9"],
  },
  {
    name: "Nordic",
    base: ["#f4f8fb", "#b9d6e8", "#6f9fc6", "#f2c8b2", "#f8efe6"],
  },
  {
    name: "Citrus",
    base: ["#fffdf2", "#ffe66d", "#ff9f1c", "#2ec4b6", "#cbf3f0"],
  },
  {
    name: "Lavender",
    base: ["#fbf8ff", "#e0c3fc", "#8ec5fc", "#a3ffd6", "#fff4bd"],
  },
  {
    name: "Lagoon",
    base: ["#f2fffb", "#83e6d3", "#4bb3fd", "#246eb9", "#fff3b0"],
  },
  {
    name: "Mono",
    base: ["#fbfbfc", "#dfe4ea", "#aeb8c4", "#66717f", "#f3dfc1"],
  },
];

const state = {
  preset: 3,
  colors: [...presets[3].base],
  points: defaultPoints.map((point) => ({ ...point })),
  sizes: [...defaultSizes],
  seed: Date.now() % 100000,
  motion: 38,
  blur: 92,
  grain: 14,
};

const controls = {
  artboardWrap: document.querySelector("#artboardWrap"),
  handles: document.querySelector("#gradientHandles"),
  presets: document.querySelector("#presets"),
  swatches: document.querySelector("#swatches"),
  ratio: document.querySelector("#ratio"),
  motion: document.querySelector("#motion"),
  blur: document.querySelector("#blur"),
  grain: document.querySelector("#grain"),
  motionValue: document.querySelector("#motionValue"),
  blurValue: document.querySelector("#blurValue"),
  grainValue: document.querySelector("#grainValue"),
  countLabel: document.querySelector("#countLabel"),
  seedLabel: document.querySelector("#seedLabel"),
  canvasMeta: document.querySelector("#canvasMeta"),
  toast: document.querySelector("#toast"),
  copyCss: document.querySelector("#copyCss"),
  download: document.querySelector("#download"),
  randomize: document.querySelector("#randomize"),
  randomPalette: document.querySelector("#randomPalette"),
  addBlob: document.querySelector("#addBlob"),
  removeBlob: document.querySelector("#removeBlob"),
};

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => clampChannel(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

function clampChannel(value) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(255, number));
}

function clampUnit(value) {
  return Math.max(0.02, Math.min(0.98, value));
}

function defaultPointAt(index) {
  if (defaultPoints[index]) return { ...defaultPoints[index] };
  const angle = index * 2.3999632297;
  const radius = 0.22 + (index % 4) * 0.055;
  return {
    x: clampUnit(0.5 + Math.cos(angle) * radius),
    y: clampUnit(0.5 + Math.sin(angle) * radius),
  };
}

function defaultSizeAt(index) {
  return defaultSizes[index % defaultSizes.length];
}

function createPastelColor(index) {
  const hue = (index * 53 + state.seed) % 360;
  return hslToHex(hue, 82, 76);
}

function expandPalette(base, count, random = mulberry32(state.seed + base.length)) {
  return Array.from({ length: count }, (_, index) => {
    if (base[index]) return base[index];
    const source = hexToRgb(base[index % base.length]);
    const mix = 0.2 + random() * 0.2;
    return rgbToHex({
      r: source.r + (255 - source.r) * mix,
      g: source.g + (255 - source.g) * mix,
      b: source.b + (255 - source.b) * mix,
    });
  });
}

function generateRandomPalette(count, random = mulberry32(state.seed)) {
  const baseHue = Math.floor(random() * 360);
  const modes = [
    [0, 24, 52, 184, 212],
    [0, 36, 72, 128, 196],
    [0, 18, 156, 198, 244],
    [0, 42, 96, 180, 300],
  ];
  const offsets = modes[Math.floor(random() * modes.length)];
  return Array.from({ length: count }, (_, index) => {
    const hue = (baseHue + offsets[index % offsets.length] + Math.floor(index / offsets.length) * 17) % 360;
    const saturation = 58 + Math.floor(random() * 28);
    const lightness = 68 + Math.floor(random() * 14);
    return hslToHex(hue, saturation, lightness);
  });
}

function hslToHex(h, s, l) {
  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return rgbToHex({
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  });
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showToast(message) {
  controls.toast.textContent = message;
  controls.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => controls.toast.classList.remove("show"), 1600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-999px";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

function updateCanvasRatio() {
  const [width, height] = controls.ratio.value.split("x").map(Number);
  canvas.width = width;
  canvas.height = height;
  canvas.style.aspectRatio = `${width} / ${height}`;
  controls.artboardWrap.style.aspectRatio = `${width} / ${height}`;
  controls.artboardWrap.style.setProperty("--canvas-ratio", width / height);
  controls.canvasMeta.textContent = `${width} x ${height}`;
  positionHandles();
}

function buildBlobs(random, palette) {
  const radiusBoost = (state.motion / 100) * 0.16;
  return palette.map((color, index) => ({
    x: state.points[index].x,
    y: state.points[index].y,
    r: state.sizes[index] / 100 + radiusBoost,
    color,
    alpha: 0.6 + random() * 0.18,
  }));
}

function drawGradient() {
  const palette = state.colors;
  const random = mulberry32(state.seed);
  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);

  const baseGradient = ctx.createLinearGradient(0, 0, width, height);
  baseGradient.addColorStop(0, palette[0]);
  baseGradient.addColorStop(0.45, palette[1] ?? palette[0]);
  baseGradient.addColorStop(1, palette.at(-1) ?? palette[0]);
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = `blur(${state.blur}px) saturate(1.25)`;

  for (const blob of buildBlobs(random, palette)) {
    const x = blob.x * width;
    const y = blob.y * height;
    const radius = blob.r * Math.max(width, height);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, rgba(blob.color, blob.alpha));
    gradient.addColorStop(0.42, rgba(blob.color, blob.alpha * 0.55));
    gradient.addColorStop(1, rgba(blob.color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  const polish = ctx.createLinearGradient(0, 0, 0, height);
  polish.addColorStop(0, "rgba(255,255,255,0.16)");
  polish.addColorStop(0.48, "rgba(255,255,255,0)");
  polish.addColorStop(1, "rgba(20,24,31,0.08)");
  ctx.fillStyle = polish;
  ctx.fillRect(0, 0, width, height);

  drawGrain(width, height);
  controls.seedLabel.textContent = `#${state.seed}`;
}

function drawGrain(width, height) {
  if (state.grain === 0) return;
  const density = Math.round((width * height) / 220);
  const image = ctx.getImageData(0, 0, width, height);
  const random = mulberry32(state.seed + 911);
  const strength = state.grain / 100;

  for (let i = 0; i < density; i += 1) {
    const pixel = Math.floor(random() * width * height) * 4;
    const shade = (random() - 0.5) * 255 * strength;
    image.data[pixel] = clamp(image.data[pixel] + shade);
    image.data[pixel + 1] = clamp(image.data[pixel + 1] + shade);
    image.data[pixel + 2] = clamp(image.data[pixel + 2] + shade);
  }

  ctx.putImageData(image, 0, 0);
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function renderPresets() {
  controls.presets.innerHTML = "";
  presets.forEach((preset, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `preset${index === state.preset ? " active" : ""}`;
    button.style.setProperty(
      "--preset-bg",
      `radial-gradient(circle at 24% 24%, ${preset.base[1]}, transparent 42%),
      radial-gradient(circle at 78% 28%, ${preset.base[2]}, transparent 38%),
      radial-gradient(circle at 55% 82%, ${preset.base[3]}, transparent 46%),
      ${preset.base[0]}`,
    );
    button.innerHTML = `<span>${preset.name}</span>`;
    button.addEventListener("click", () => {
      state.preset = index;
      state.seed = Math.floor(Math.random() * 99999);
      state.colors = expandPalette(preset.base, state.colors.length);
      renderPresets();
      renderSwatches();
      renderHandles();
      updateCountControls();
      drawGradient();
    });
    controls.presets.append(button);
  });
}

function renderSwatches() {
  controls.swatches.innerHTML = "";
  state.colors.forEach((color, index) => {
    const { r, g, b } = hexToRgb(color);
    const editor = document.createElement("div");
    editor.className = "color-editor";
    editor.style.setProperty("--swatch", color);
    editor.innerHTML = `
      <label class="color-chip">
        <input type="color" value="${color}" aria-label="颜色 ${index + 1}" />
      </label>
      <div class="color-body">
        <div class="rgb-fields" aria-label="颜色 ${index + 1} RGB">
          <label><span>R</span><input type="number" min="0" max="255" value="${r}" inputmode="numeric" /></label>
          <label><span>G</span><input type="number" min="0" max="255" value="${g}" inputmode="numeric" /></label>
          <label><span>B</span><input type="number" min="0" max="255" value="${b}" inputmode="numeric" /></label>
        </div>
        <label class="size-field">
          <span>大小</span>
          <input type="range" min="16" max="72" value="${state.sizes[index]}" aria-label="颜色 ${index + 1} 大小" />
          <output>${state.sizes[index]}</output>
        </label>
      </div>
    `;

    const colorPicker = editor.querySelector('input[type="color"]');
    const rgbInputs = [...editor.querySelectorAll('input[type="number"]')];
    const sizeInput = editor.querySelector('input[type="range"]');
    const sizeOutput = editor.querySelector("output");

    colorPicker.addEventListener("input", () => {
      state.colors[index] = colorPicker.value;
      editor.style.setProperty("--swatch", colorPicker.value);
      const nextRgb = hexToRgb(colorPicker.value);
      rgbInputs[0].value = nextRgb.r;
      rgbInputs[1].value = nextRgb.g;
      rgbInputs[2].value = nextRgb.b;
      updateHandleColor(index);
      drawGradient();
    });

    rgbInputs.forEach((input) => {
      input.addEventListener("input", () => {
        const nextColor = rgbToHex({
          r: rgbInputs[0].value,
          g: rgbInputs[1].value,
          b: rgbInputs[2].value,
        });
        state.colors[index] = nextColor;
        colorPicker.value = nextColor;
        editor.style.setProperty("--swatch", nextColor);
        updateHandleColor(index);
        drawGradient();
      });
    });

    sizeInput.addEventListener("input", () => {
      state.sizes[index] = Number(sizeInput.value);
      sizeOutput.textContent = sizeInput.value;
      updateHandleSize(index);
      drawGradient();
    });

    controls.swatches.append(editor);
  });
}

function renderHandles() {
  controls.handles.innerHTML = "";
  state.points.forEach((point, index) => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "gradient-handle";
    handle.dataset.index = String(index);
    handle.style.setProperty("--swatch", state.colors[index]);
    handle.style.setProperty("--handle-size", `${14 + state.sizes[index] * 0.28}px`);
    handle.setAttribute("aria-label", `拖动颜色 ${index + 1} 位置`);
    controls.handles.append(handle);
  });
  positionHandles();
}

function positionHandles() {
  controls.handles?.querySelectorAll(".gradient-handle").forEach((handle) => {
    const point = state.points[Number(handle.dataset.index)];
    handle.style.left = `${point.x * 100}%`;
    handle.style.top = `${point.y * 100}%`;
  });
}

function updateHandleColor(index) {
  const handle = controls.handles.querySelector(`[data-index="${index}"]`);
  handle?.style.setProperty("--swatch", state.colors[index]);
}

function updateHandleSize(index) {
  const handle = controls.handles.querySelector(`[data-index="${index}"]`);
  handle?.style.setProperty("--handle-size", `${14 + state.sizes[index] * 0.28}px`);
}

function updateCountControls() {
  controls.countLabel.textContent = `${state.colors.length}/${maxBlobCount}`;
  controls.removeBlob.disabled = state.colors.length <= minBlobCount;
  controls.addBlob.disabled = state.colors.length >= maxBlobCount;
}

function addDiffusion() {
  if (state.colors.length >= maxBlobCount) return;
  const index = state.colors.length;
  state.colors.push(createPastelColor(index));
  state.points.push(defaultPointAt(index));
  state.sizes.push(38);
  renderSwatches();
  renderHandles();
  updateCountControls();
  drawGradient();
}

function removeDiffusion() {
  if (state.colors.length <= minBlobCount) return;
  state.colors.pop();
  state.points.pop();
  state.sizes.pop();
  renderSwatches();
  renderHandles();
  updateCountControls();
  drawGradient();
}

function randomizePaletteOnly() {
  state.seed = Math.floor(Math.random() * 99999);
  state.preset = -1;
  state.colors = generateRandomPalette(state.colors.length, mulberry32(state.seed));
  renderPresets();
  renderSwatches();
  renderHandles();
  drawGradient();
}

function buildCssSnippet() {
  const palette = state.colors;
  const endColor = palette.at(-1) ?? palette[0];
  return `background:
  ${state.points
    .map((point, index) => {
      const radius = Math.round(state.sizes[index] * 1.08);
      return `radial-gradient(circle at ${Math.round(point.x * 100)}% ${Math.round(point.y * 100)}%, ${palette[index]} 0, transparent ${radius}%)`;
    })
    .join(",\n  ")},
  linear-gradient(135deg, ${palette[0]}, ${endColor});`;
}

function setPointFromPointer(event, index) {
  const rect = canvas.getBoundingClientRect();
  state.points[index] = {
    x: clampUnit((event.clientX - rect.left) / rect.width),
    y: clampUnit((event.clientY - rect.top) / rect.height),
  };
  positionHandles();
  drawGradient();
}

function bindControls() {
  controls.ratio.addEventListener("change", () => {
    updateCanvasRatio();
    drawGradient();
  });

  for (const key of ["motion", "blur", "grain"]) {
    controls[key].addEventListener("input", (event) => {
      state[key] = Number(event.target.value);
      controls[`${key}Value`].textContent = event.target.value;
      drawGradient();
    });
  }

  controls.randomize.addEventListener("click", () => {
    state.seed = Math.floor(Math.random() * 99999);
    const random = mulberry32(state.seed);
    state.preset = -1;
    state.colors = generateRandomPalette(state.colors.length, random);
    state.points = state.colors.map(() => ({
      x: 0.12 + random() * 0.76,
      y: 0.14 + random() * 0.72,
    }));
    state.sizes = state.colors.map((_, index) => 26 + Math.round(random() * 34) + (index % 2) * 4);
    renderPresets();
    renderSwatches();
    renderHandles();
    updateCountControls();
    drawGradient();
  });

  controls.randomPalette.addEventListener("click", randomizePaletteOnly);
  controls.addBlob.addEventListener("click", addDiffusion);
  controls.removeBlob.addEventListener("click", removeDiffusion);

  controls.handles.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".gradient-handle");
    if (!handle) return;
    const index = Number(handle.dataset.index);
    handle.setPointerCapture(event.pointerId);
    setPointFromPointer(event, index);

    const move = (moveEvent) => setPointFromPointer(moveEvent, index);
    const up = () => {
      handle.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });

  controls.copyCss.addEventListener("click", async () => {
    const css = buildCssSnippet();
    if (window.webkit?.messageHandlers?.copyCSS) {
      window.webkit.messageHandlers.copyCSS.postMessage(css);
      showToast("CSS 已复制");
      return;
    }
    const copied = await copyText(css);
    showToast(copied ? "CSS 已复制" : "复制被浏览器拦截");
  });

  controls.download.addEventListener("click", () => {
    if (window.webkit?.messageHandlers?.savePNG) {
      window.webkit.messageHandlers.savePNG.postMessage({
        filename: `diffusion-gradient-${state.seed}.png`,
        dataUrl: canvas.toDataURL("image/png"),
      });
      showToast("选择保存位置");
      return;
    }
    const link = document.createElement("a");
    link.download = `diffusion-gradient-${state.seed}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("PNG 已生成");
  });
}

updateCanvasRatio();
renderPresets();
renderSwatches();
renderHandles();
updateCountControls();
bindControls();
drawGradient();
