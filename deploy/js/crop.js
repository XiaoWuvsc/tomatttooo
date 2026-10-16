/* ============================================
   tomatttooo · 画幅裁切工具
   按比例裁切 + 拖动取景框 + 九宫格定位 + 实时预览
   全部本地处理
   ============================================ */

const $ = (id) => document.getElementById(id);

const RATIOS = [
  { key: "orig", label: "原图", w: 0, h: 0 },
  { key: "1:1", label: "1:1", w: 1, h: 1 },
  { key: "4:3", label: "4:3", w: 4, h: 3 },
  { key: "3:2", label: "3:2", w: 3, h: 2 },
  { key: "16:9", label: "16:9", w: 16, h: 9 },
  { key: "9:16", label: "9:16", w: 9, h: 16 },
  { key: "4:5", label: "4:5", w: 4, h: 5 },
  { key: "5:4", label: "5:4", w: 5, h: 4 },
  { key: "2.35:1", label: "2.35:1", w: 2.35, h: 1 },
];

const state = {
  img: null,
  imgW: 0,
  imgH: 0,
  ratio: "1:1",
  gx: 0.5,
  gy: 0.5,
  offX: null,   // 拖动后的自由位置（像素）
  offY: null,
  zoom: 100,    // 裁切范围 %
  scaleOpt: "orig",
  format: "jpg",
};

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function currentRatio() {
  return RATIOS.find((r) => r.key === state.ratio) || RATIOS[0];
}

function cropRect() {
  const W = state.imgW, H = state.imgH;
  const r = currentRatio();
  if (!r.w) return { x: 0, y: 0, w: W, h: H };
  const target = r.w / r.h;
  let cw = W, ch = cw / target;
  if (ch > H) {
    ch = H;
    cw = ch * target;
  }
  cw *= state.zoom / 100;
  ch *= state.zoom / 100;
  const x = state.offX != null ? clamp(state.offX, 0, W - cw) : (W - cw) * state.gx;
  const y = state.offY != null ? clamp(state.offY, 0, H - ch) : (H - ch) * state.gy;
  return { x, y, w: cw, h: ch };
}

function render() {
  if (!state.img) return;
  canvas.width = state.imgW;
  canvas.height = state.imgH;
  ctx.drawImage(state.img, 0, 0);
  const r = cropRect();
  if (!currentRatio().w) {
    updateInfo(r);
    return;
  }
  // 取景框外的暗化
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, state.imgW, r.y);
  ctx.fillRect(0, r.y + r.h, state.imgW, state.imgH - r.y - r.h);
  ctx.fillRect(0, r.y, r.x, r.h);
  ctx.fillRect(r.x + r.w, r.y, state.imgW - r.x - r.w, r.h);
  // 三分线
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(r.x + (r.w / 3) * i, r.y);
    ctx.lineTo(r.x + (r.w / 3) * i, r.y + r.h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + (r.h / 3) * i);
    ctx.lineTo(r.x + r.w, r.y + (r.h / 3) * i);
    ctx.stroke();
  }
  // 取景框
  ctx.strokeStyle = "#ff6347";
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  // 四角手柄
  ctx.fillStyle = "#ff6347";
  const hs = 6;
  [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].forEach(([cx, cy]) => {
    ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
  });
  // 尺寸标签
  const label = `${Math.round(r.w)} × ${Math.round(r.h)}`;
  ctx.font = "600 13px Inter, sans-serif";
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(13,13,13,0.8)";
  ctx.fillRect(r.x, r.y, tw + 16, 26);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(label, r.x + 8, r.y + 13);
  updateInfo(r);
}

function updateInfo(r) {
  const s = exportScale();
  const w = Math.max(1, Math.round(r.w * s));
  const h = Math.max(1, Math.round(r.h * s));
  $("crop-info").textContent = `裁切 ${Math.round(r.w)}×${Math.round(r.h)} → 导出 ${w}×${h}`;
}

function exportScale() {
  if (state.scaleOpt === "orig") return 1;
  const t = +state.scaleOpt;
  return Math.min(1, t / Math.max(state.imgW, state.imgH));
}

function exportImage() {
  if (!state.img) return;
  const r = cropRect();
  const s = exportScale();
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(r.w * s));
  c.height = Math.max(1, Math.round(r.h * s));
  const cctx = c.getContext("2d");
  cctx.imageSmoothingEnabled = true;
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(state.img, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
  const mime = state.format === "png" ? "image/png" : "image/jpeg";
  c.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tomatttooo-crop-${c.width}x${c.height}.${state.format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, mime, 1.0);
}

/* ---------- 拖动取景框 ---------- */

let dragging = false;
let grabDX = 0, grabDY = 0;

function eventPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
}

function inRect(p, r, tol = 6) {
  return p.x >= r.x - tol && p.x <= r.x + r.w + tol && p.y >= r.y - tol && p.y <= r.y + r.h + tol;
}

function bindDrag() {
  const hasPointer = "PointerEvent" in window;
  const pDown = hasPointer ? "pointerdown" : "mousedown";
  const pMove = hasPointer ? "pointermove" : "mousemove";
  const pUps = hasPointer ? ["pointerup", "pointercancel"] : ["mouseup", "mouseleave"];

  canvas.addEventListener(pDown, (e) => {
    if (!state.img || !currentRatio().w) return;
    if (window.__zoomedIn && window.__zoomedIn()) return; // 放大状态下拖动用于平移预览
    const p = eventPos(e);
    if (!p) return;
    const r = cropRect();
    if (!inRect(p, r)) return;
    dragging = true;
    grabDX = p.x - r.x;
    grabDY = p.y - r.y;
    if (hasPointer && canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    e.preventDefault();
  });

  canvas.addEventListener(pMove, (e) => {
    const p = eventPos(e);
    if (!p || !state.img) return;
    if (window.__zoomedIn && window.__zoomedIn()) return;
    if (dragging) {
      const r = cropRect();
      state.offX = clamp(p.x - grabDX, 0, state.imgW - r.w);
      state.offY = clamp(p.y - grabDY, 0, state.imgH - r.h);
      render();
    } else {
      // 悬停提示
      canvas.style.cursor = currentRatio().w && inRect(p, cropRect()) ? "move" : "default";
    }
  });

  const end = () => {
    dragging = false;
    canvas.style.cursor = "default";
  };
  pUps.forEach((ev) => canvas.addEventListener(ev, end));
}

/* ---------- 界面 ---------- */

function buildChips() {
  const wrap = $("ratio-chips");
  RATIOS.forEach((r) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "t-chip" + (r.key === state.ratio ? " is-active" : "");
    b.dataset.ratio = r.key;
    b.textContent = r.label;
    b.addEventListener("click", () => {
      state.ratio = r.key;
      state.offX = state.offY = null;
      document.querySelectorAll("#ratio-chips .t-chip").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.ratio === r.key)
      );
      render();
    });
    wrap.appendChild(b);
  });
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    state.img = im;
    state.imgW = im.naturalWidth;
    state.imgH = im.naturalHeight;
    state.offX = state.offY = null;
    $("stage").classList.add("has-image");
    $("controls").hidden = false;
    $("btn-export").disabled = false;
    render();
  };
  im.src = url;
}

function bind() {
  const drop = $("drop");
  drop.addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", (e) => {
    loadFile(e.target.files[0]);
    e.target.value = "";
  });
  ["dragover", "dragenter"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("is-over");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("is-over");
    })
  );
  drop.addEventListener("drop", (e) => loadFile(e.dataTransfer.files[0]));

  document.querySelectorAll(".posgrid button").forEach((b) =>
    b.addEventListener("click", () => {
      state.gx = +b.dataset.gx;
      state.gy = +b.dataset.gy;
      state.offX = state.offY = null;
      document.querySelectorAll(".posgrid button").forEach((x) => x.classList.remove("is-active"));
      b.classList.add("is-active");
      render();
    })
  );

  $("crop-zoom").addEventListener("input", (e) => {
    state.zoom = +e.target.value;
    $("out-zoom").textContent = state.zoom + "%";
    if (state.offX != null || state.offY != null) {
      state.offX = null;
      state.offY = null;
    }
    render();
  });

  $("wm-scale").addEventListener("change", (e) => {
    state.scaleOpt = e.target.value;
    render();
  });
  $("wm-format").addEventListener("change", (e) => {
    state.format = e.target.value;
  });
  $("btn-export").addEventListener("click", exportImage);
  $("year").textContent = new Date().getFullYear();
  bindDrag();
}

document.addEventListener("DOMContentLoaded", () => {
  bind();
  buildChips();
});
