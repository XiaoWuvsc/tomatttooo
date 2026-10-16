/* ============================================
   tomatttooo · 切图工具
   九宫格 3×3（裁正方形 / 原比例）+ 三格横切（竖图不切）
   导出 ZIP（STORE 方式，本地打包）
   ============================================ */

const $ = (id) => document.getElementById(id);

const state = {
  img: null,
  imgW: 0,
  imgH: 0,
  name: "photo",
  mode: "grid9",
  pieces: [],
};

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

/* ---------- ZIP（STORE） ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zipStore(entries) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  for (const f of entries) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true);
    lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, f.data.length, true);
    lh.setUint32(22, f.data.length, true);
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), nameBytes, f.data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, f.data.length, true);
    ch.setUint32(24, f.data.length, true);
    ch.setUint16(28, nameBytes.length, true);
    ch.setUint16(30, 0, true);
    ch.setUint16(32, 0, true);
    ch.setUint16(34, 0, true);
    ch.setUint16(36, 0, true);
    ch.setUint32(38, 0, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nameBytes);

    offset += 30 + nameBytes.length + f.data.length;
  }

  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  end.setUint16(20, 0, true);
  central.push(new Uint8Array(end.buffer));

  return new Blob(parts.concat(central), { type: "application/zip" });
}

/* ---------- 切图逻辑 ---------- */

/* 九宫格（裁正方形）：取最大居中正方形，再 3×3 */
function squareRect() {
  const d = Math.min(state.imgW, state.imgH);
  return {
    x: (state.imgW - d) / 2,
    y: (state.imgH - d) / 2,
    w: d,
    h: d,
  };
}

function makePiece(sx, sy, sw, sh, name) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(sw));
  c.height = Math.max(1, Math.round(sh));
  const x = c.getContext("2d");
  x.fillStyle = "#ffffff"; // JPG 无透明，先铺白底
  x.fillRect(0, 0, c.width, c.height);
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high";
  x.drawImage(state.img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return { canvas: c, name };
}

function split() {
  const W = state.imgW, H = state.imgH;
  const pieces = [];

  if (state.mode === "grid9") {
    const r = squareRect();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        pieces.push(makePiece(
          r.x + (r.w / 3) * col, r.y + (r.h / 3) * row, r.w / 3, r.h / 3,
          `${state.name}-${row * 3 + col + 1}.jpg`
        ));
      }
    }
  } else if (state.mode === "grid9raw") {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        pieces.push(makePiece(
          (W / 3) * col, (H / 3) * row, W / 3, H / 3,
          `${state.name}-${row * 3 + col + 1}.jpg`
        ));
      }
    }
  } else if (state.mode === "strip3") {
    // 三格横切：竖图不切
    if (H > W) return null;
    for (let i = 0; i < 3; i++) {
      pieces.push(makePiece(
        (W / 3) * i, 0, W / 3, H,
        `${state.name}-${i + 1}.jpg`
      ));
    }
  } else if (state.mode === "strip2") {
    // 二格横切：竖图不切
    if (H > W) return null;
    for (let i = 0; i < 2; i++) {
      pieces.push(makePiece(
        (W / 2) * i, 0, W / 2, H,
        `${state.name}-${i + 1}.jpg`
      ));
    }
  }
  return pieces;
}

/* ---------- 渲染 ---------- */

function render() {
  if (!state.img) return;
  canvas.width = state.imgW;
  canvas.height = state.imgH;
  ctx.drawImage(state.img, 0, 0);

  // 网格线
  const lw = Math.max(2, Math.round(Math.min(state.imgW, state.imgH) / 700));
  ctx.strokeStyle = "#ff6347";
  ctx.lineWidth = lw;
  if (state.mode === "grid9") {
    const r = squareRect();
    ctx.strokeRect(r.x, r.y, r.w, r.h);
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
  } else if (state.mode === "grid9raw") {
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((state.imgW / 3) * i, 0);
      ctx.lineTo((state.imgW / 3) * i, state.imgH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (state.imgH / 3) * i);
      ctx.lineTo(state.imgW, (state.imgH / 3) * i);
      ctx.stroke();
    }
  } else {
    // 三格 3 条线 / 二格 1 条线
    const n = state.mode === "strip3" ? 3 : 2;
    for (let i = 1; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo((state.imgW / n) * i, 0);
      ctx.lineTo((state.imgW / n) * i, state.imgH);
      ctx.stroke();
    }
  }

  updateState();
}

function updateState() {
  const note = $("split-note");
  const btn = $("btn-export");
  const isPortrait = state.imgH > state.imgW;

  if ((state.mode === "strip3" || state.mode === "strip2") && isPortrait) {
    state.pieces = [];
    note.textContent = "竖图不切（横切模式仅适用于横图）";
    btn.disabled = true;
  } else {
    state.pieces = split() || [];
    if (state.mode === "grid9") {
      note.textContent = "取最大居中正方形后切成 3×3 九宫格";
    } else if (state.mode === "grid9raw") {
      note.textContent = "原图比例直接切成 3×3";
    } else if (state.mode === "strip2") {
      note.textContent = `横图二等分，每块 ${Math.round(state.imgW / 2)}×${state.imgH}px`;
    } else {
      note.textContent = `横图三等分，每块 ${Math.round(state.imgW / 3)}×${state.imgH}px`;
    }
    btn.disabled = false;
  }
  renderThumbs();
}

function renderThumbs() {
  const wrap = $("thumbs");
  wrap.innerHTML = "";
  state.pieces.forEach((p) => {
    const thumb = document.createElement("canvas");
    const s = 96;
    const ar = p.canvas.width / p.canvas.height;
    thumb.width = ar >= 1 ? s : Math.max(30, Math.round(s * ar));
    thumb.height = ar >= 1 ? Math.max(30, Math.round(s / ar)) : s;
    thumb.getContext("2d").drawImage(p.canvas, 0, 0, thumb.width, thumb.height);
    wrap.appendChild(thumb);
  });
}

/* ---------- 导出 ---------- */

async function exportZip() {
  if (!state.pieces.length) return;
  const btn = $("btn-export");
  btn.disabled = true;
  btn.textContent = "打包中…";
  try {
    const entries = [];
    for (const p of state.pieces) {
      const blob = await new Promise((resolve) =>
        p.canvas.toBlob(resolve, "image/jpeg", 1.0)
      );
      if (blob) entries.push({ name: p.name, data: new Uint8Array(await blob.arrayBuffer()) });
    }
    const zip = zipStore(entries);
    const url = URL.createObjectURL(zip);
    const a = document.createElement("a");
    const tag = state.mode === "strip3" ? "三格" : state.mode === "strip2" ? "二格" : "九宫格";
    a.href = url;
    a.download = `${state.name}-${tag}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    btn.textContent = "已导出";
    setTimeout(() => {
      btn.innerHTML = (window.ICONS ? window.ICONS.download : "") + " 导出 ZIP";
      btn.disabled = false;
    }, 1500);
  } catch (e) {
    btn.innerHTML = (window.ICONS ? window.ICONS.download : "") + " 导出 ZIP";
    btn.disabled = false;
  }
}

/* ---------- 导入与事件 ---------- */

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    state.img = im;
    state.imgW = im.naturalWidth;
    state.imgH = im.naturalHeight;
    state.name = (file.name || "photo").replace(/\.[^.]+$/, "");
    $("stage").classList.add("has-image");
    $("controls").hidden = false;
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

  document.querySelectorAll("#mode-chips .t-chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      document.querySelectorAll("#mode-chips .t-chip").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.mode === state.mode)
      );
      render();
    })
  );

  $("btn-export").addEventListener("click", exportZip);
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
