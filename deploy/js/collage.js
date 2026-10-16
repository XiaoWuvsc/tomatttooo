/* ============================================
   tomatttooo · 拼图工具
   多图拼一张：多种布局 + 间距 + 背景色，导出高清 JPG
   ============================================ */

const $ = (id) => document.getElementById(id);

const state = {
  items: [],      // { id, img, base }
  layout: "2x2",
  gap: 12,
  bg: "#ffffff",
  fit: "contain", // 默认完整显示（不裁切）
  nextId: 1,
};

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

const LAYOUTS = {
  "2x1": { cols: 2, rows: 1 },
  "1x2": { cols: 1, rows: 2 },
  "2x2": { cols: 2, rows: 2 },
  "2x3": { cols: 2, rows: 3 },
  "3x3": { cols: 3, rows: 3 },
  "1x3": { cols: 1, rows: 3 },
};

const CELL = 1080; // 导出时每格边长

/* ---------- 渲染 ---------- */

function drawCollage(c, cellSize) {
  // 长图拼接：上下叠放，每张保持原比例全宽显示（无边框、无裁切）
  if (state.layout === "stack") {
    const gapRatio = state.gap / 100;
    // 照片很多时画布高度会超出浏览器上限，按总高度自适应缩小
    const rel = state.items.reduce(
      (s, it) => s + it.img.naturalHeight / it.img.naturalWidth,
      0
    );
    const gapRel = gapRatio * (state.items.length + 1);
    let cw = cellSize;
    const needH = cw * rel + cw * gapRel;
    const maxH = 16000; // 兼容各浏览器画布高度上限（保守取 16000）
    if (needH > maxH) cw = Math.max(40, Math.floor(maxH / (rel + gapRel)));

    const gap = Math.round(gapRatio * cw);
    const W = cw + gap * 2;
    const heights = state.items.map((it) =>
      Math.round((cw * it.img.naturalHeight) / it.img.naturalWidth)
    );
    const H = heights.reduce((s, h) => s + h, 0) + gap * (state.items.length + 1);
    c.canvas.width = W;
    c.canvas.height = H;
    c.fillStyle = state.bg;
    c.fillRect(0, 0, W, H);
    let y = gap;
    state.items.forEach((it, i) => {
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "high";
      c.drawImage(it.img, gap, y, cw, heights[i]);
      y += heights[i] + gap;
    });
    return { W, H };
  }

  const L = LAYOUTS[state.layout] || LAYOUTS["2x2"];
  const gap = Math.round((state.gap / 100) * cellSize);
  const W = L.cols * cellSize + gap * (L.cols + 1);
  const H = L.rows * cellSize + gap * (L.rows + 1);
  c.canvas.width = W;
  c.canvas.height = H;

  c.fillStyle = state.bg;
  c.fillRect(0, 0, W, H);
  if (!state.items.length) return { W, H };

  for (let i = 0; i < L.cols * L.rows; i++) {
    const img = state.items[i % state.items.length].img;
    const col = i % L.cols;
    const row = Math.floor(i / L.cols);
    const x = gap + col * (cellSize + gap);
    const y = gap + row * (cellSize + gap);
    // 填充方式：contain 完整显示（不裁切）/ cover 裁切填满
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = state.fit === "cover"
      ? Math.max(cellSize / iw, cellSize / ih)
      : Math.min(cellSize / iw, cellSize / ih);
    const dw = iw * s, dh = ih * s;
    c.save();
    c.beginPath();
    c.rect(x, y, cellSize, cellSize);
    c.clip();
    c.drawImage(img, x + (cellSize - dw) / 2, y + (cellSize - dh) / 2, dw, dh);
    c.restore();
  }
  return { W, H };
}

function renderPreview() {
  if (!state.items.length) return;
  const maxW = 680;
  const L = LAYOUTS[state.layout] || LAYOUTS["2x2"];
  let cellSize;
  if (state.layout === "stack") {
    // 预览长图限高：照片很多时缩小预览格宽
    const rel = state.items.reduce(
      (s, it) => s + it.img.naturalHeight / it.img.naturalWidth,
      0
    );
    const gapRel = (state.gap / 100) * (state.items.length + 1);
    cellSize = Math.min(520, maxW - 40, Math.max(60, Math.floor(2600 / (rel + gapRel))));
  } else {
    cellSize = Math.floor((maxW - 40) / (L.cols + 0.35));
  }
  drawCollage(ctx, Math.min(cellSize, 260));
  $("stage").classList.add("has-image");
}

/* ---------- 导出 ---------- */

function exportImage() {
  if (!state.items.length) return;
  const off = document.createElement("canvas");
  drawCollage(off.getContext("2d"), CELL);
  off.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tomatttooo-拼图-${state.layout}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/jpeg", 1.0);
}

/* ---------- 列表与导入 ---------- */

const isImage = (file) =>
  file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || "");

function renderFileList() {
  const wrap = $("filelist");
  wrap.innerHTML = "";
  state.items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "file-item";

    const thumb = document.createElement("canvas");
    const s = 52;
    thumb.width = s;
    thumb.height = s;
    const tx = thumb.getContext("2d");
    const tiw = item.img.naturalWidth || item.img.width;
    const tih = item.img.naturalHeight || item.img.height;
    const tsc = Math.max(s / tiw, s / tih);
    const tdw = tiw * tsc, tdh = tih * tsc;
    tx.drawImage(item.img, (s - tdw) / 2, (s - tdh) / 2, tdw, tdh);

    const name = document.createElement("b");
    name.textContent = item.base;

    const del = document.createElement("button");
    del.className = "file-del";
    del.type = "button";
    del.textContent = "✕";
    del.title = "删除这张";
    del.addEventListener("click", () => {
      state.items = state.items.filter((i) => i.id !== item.id);
      renderFileList();
      renderPreview();
      if (!state.items.length) {
        $("actions").hidden = true;
        $("stage").classList.remove("has-image");
      }
    });

    // 拖动排序
    div.draggable = true;
    div.addEventListener("dragstart", (e) => {
      dragId = item.id;
      div.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", String(item.id)); } catch (err) { /* 忽略 */ }
    });
    div.addEventListener("dragend", () => {
      dragId = null;
      document.querySelectorAll(".file-item").forEach((x) =>
        x.classList.remove("is-dragging", "drag-over")
      );
    });
    div.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (dragId !== null && dragId !== item.id) div.classList.add("drag-over");
    });
    div.addEventListener("dragleave", () => div.classList.remove("drag-over"));
    div.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragId === null || dragId === item.id) return;
      const from = state.items.findIndex((i) => i.id === dragId);
      const to = state.items.findIndex((i) => i.id === item.id);
      if (from < 0 || to < 0) return;
      const [moved] = state.items.splice(from, 1);
      state.items.splice(to, 0, moved);
      dragId = null;
      renderFileList();
      renderPreview();
    });

    div.append(thumb, name, del);
    wrap.appendChild(div);
  });

  const notice = $("upload-notice");
  if (state.items.length) {
    notice.textContent = `已添加 ${state.items.length} 张，按顺序填充格子（不足自动循环）`;
    notice.hidden = false;
    $("opts").hidden = false;
    $("actions").hidden = false;
  } else {
    notice.hidden = true;
    $("opts").hidden = true;
  }
}

let dragId = null;

function addFiles(files) {
  const list = [...files].filter(isImage);
  if (!list.length) {
    const notice = $("upload-notice");
    notice.textContent = "没识别到图片文件（支持 JPG / PNG / WebP / GIF / BMP）";
    notice.hidden = false;
    return;
  }
  list.forEach((file) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      state.items.push({
        id: state.nextId++,
        img: im,
        base: (file.name || "photo").replace(/\.[^.]+$/, ""),
      });
      renderFileList();
      renderPreview();
    };
    im.src = url;
  });
}

function bind() {
  const drop = $("drop");
  drop.addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", (e) => {
    addFiles(e.target.files);
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
  drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
  ["dragover", "drop"].forEach((ev) =>
    window.addEventListener(ev, (e) => e.preventDefault())
  );
  window.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  document.querySelectorAll("#layout-chips .t-chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.layout = b.dataset.layout;
      document.querySelectorAll("#layout-chips .t-chip").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.layout === state.layout)
      );
      renderPreview();
    })
  );
  document.querySelectorAll("#bg-chips .t-chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.bg = b.dataset.bg;
      document.querySelectorAll("#bg-chips .t-chip").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.bg === state.bg)
      );
      renderPreview();
    })
  );
  document.querySelectorAll("#fit-chips .t-chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.fit = b.dataset.fit;
      document.querySelectorAll("#fit-chips .t-chip").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.fit === state.fit)
      );
      renderPreview();
    })
  );
  $("gap").addEventListener("input", (e) => {
    state.gap = +e.target.value;
    $("out-gap").textContent = state.gap;
    renderPreview();
  });

  $("btn-export").addEventListener("click", exportImage);
  $("btn-clear").addEventListener("click", () => {
    state.items = [];
    $("filelist").innerHTML = "";
    $("upload-notice").hidden = true;
    $("opts").hidden = true;
    $("actions").hidden = true;
    $("stage").classList.remove("has-image");
  });
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
