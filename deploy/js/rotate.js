/* ============================================
   tomatttooo · 旋转翻转工具
   批量旋转 / 镜像，原分辨率导出，ZIP 打包
   ============================================ */

const $ = (id) => document.getElementById(id);

const state = {
  items: [],     // { id, img, base, size }
  results: [],   // { name, blob, base }
  mode: "left",
  selectedId: null,
  nextId: 1,
};

const fmtSize = (bytes) => {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  if (bytes > 1024) return (bytes / 1024).toFixed(0) + " KB";
  return bytes + " B";
};

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

/* ---------- 处理核心 ---------- */

function transform(img) {
  const m = state.mode;
  const rotate = m === "left" || m === "right" || m === "180";
  const c = document.createElement("canvas");
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (rotate) {
    c.width = m === "180" ? iw : ih;
    c.height = m === "180" ? ih : iw;
  } else {
    c.width = iw;
    c.height = ih;
  }
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high";

  if (m === "left") {
    x.translate(c.width, 0);
    x.rotate(Math.PI / 2);
  } else if (m === "right") {
    x.translate(0, c.height);
    x.rotate(-Math.PI / 2);
  } else if (m === "180") {
    x.translate(c.width, c.height);
    x.rotate(Math.PI);
  } else if (m === "flipH") {
    x.translate(c.width, 0);
    x.scale(-1, 1);
  } else if (m === "flipV") {
    x.translate(0, c.height);
    x.scale(1, -1);
  }
  x.drawImage(img, 0, 0);
  return c;
}

/* ---------- 界面 ---------- */

const isImage = (file) =>
  file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || "");

const previewCanvas = () => document.getElementById("preview");
const pctxOf = (c) => c.getContext("2d");

function selectedItem() {
  return state.items.find((i) => i.id === state.selectedId) || state.items[0] || null;
}

function renderPreview() {
  const c = previewCanvas();
  if (!c) return;
  const item = selectedItem();
  if (!item) {
    document.getElementById("stage").classList.remove("has-image");
    return;
  }
  const out = transform(item.img);
  c.width = out.width;
  c.height = out.height;
  const x = pctxOf(c);
  x.clearRect(0, 0, c.width, c.height);
  x.drawImage(out, 0, 0);
  document.getElementById("stage").classList.add("has-image");
}

function renderFileList() {
  const wrap = $("filelist");
  wrap.innerHTML = "";
  state.items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "result-item";

    const thumb = document.createElement("canvas");
    const s = 52;
    thumb.width = s;
    thumb.height = s;
    const tx = thumb.getContext("2d");
    const iw = item.img.naturalWidth || item.img.width;
    const ih = item.img.naturalHeight || item.img.height;
    const sc = Math.max(s / iw, s / ih);
    const dw = iw * sc, dh = ih * sc;
    tx.drawImage(item.img, (s - dw) / 2, (s - dh) / 2, dw, dh);

    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.innerHTML = `<b>${item.base}</b><small>${fmtSize(item.size)} · 待处理</small>`;

    const del = document.createElement("button");
    del.className = "file-del";
    del.type = "button";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      state.items = state.items.filter((i) => i.id !== item.id);
      state.results = state.results.filter((r) => r.base !== item.base);
      if (state.selectedId === item.id) state.selectedId = null;
      renderFileList();
      renderResults();
      renderPreview();
      if (!state.items.length) $("actions").hidden = true;
    });

    div.classList.toggle("is-selected", item.id === state.selectedId || (!state.selectedId && item === state.items[0]));
    div.addEventListener("click", (e) => {
      if (e.target.closest(".file-del") || e.target.closest(".t-btn")) return;
      state.selectedId = item.id;
      renderFileList();
      renderPreview();
    });

    div.append(thumb, meta, del);
    wrap.appendChild(div);
  });

  const notice = $("upload-notice");
  if (state.items.length) {
    notice.textContent = `已添加 ${state.items.length} 张`;
    notice.hidden = false;
    $("opts").hidden = false;
  } else {
    notice.hidden = true;
    $("opts").hidden = true;
  }
}

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
        size: file.size,
      });
      renderFileList();
      renderPreview();
    };
    im.src = url;
  });
}

function renderResults() {
  const wrap = $("results");
  wrap.innerHTML = "";
  state.results.forEach((r) => {
    const div = document.createElement("div");
    div.className = "result-item";

    const thumb = document.createElement("canvas");
    const s = 52;
    thumb.width = s;
    thumb.height = s;
    const tx = thumb.getContext("2d");
    const iw = r.thumb.width, ih = r.thumb.height;
    const sc = Math.max(s / iw, s / ih);
    const dw = iw * sc, dh = ih * sc;
    tx.drawImage(r.thumb, (s - dw) / 2, (s - dh) / 2, dw, dh);

    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.innerHTML = `<b>${r.name}</b><small>${r.thumb.width}×${r.thumb.height}px</small>`;

    const dl = document.createElement("button");
    dl.className = "t-btn t-btn--ghost";
    dl.type = "button";
    dl.innerHTML = (window.ICONS ? window.ICONS.download : "") + " 下载";
    dl.style.padding = "0.45rem 1.2rem";
    dl.addEventListener("click", () => {
      const url = URL.createObjectURL(r.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    div.append(thumb, meta, dl);
    wrap.appendChild(div);
  });
  $("actions").hidden = state.results.length === 0;
}

async function runTransform() {
  const btn = $("btn-go");
  btn.disabled = true;
  btn.textContent = "处理中…";
  state.results = [];
  renderResults();

  const suffix = { left: "左转90", right: "右转90", "180": "旋转180", flipH: "水平翻转", flipV: "垂直翻转" }[state.mode];

  for (const item of state.items) {
    const c = transform(item.img);
    const blob = await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 1.0));
    if (!blob) continue;
    state.results.push({
      name: `${item.base}-${suffix}.jpg`,
      blob,
      base: item.base,
      thumb: c,
    });
    renderResults();
  }
  btn.textContent = "开始处理";
  btn.disabled = false;
}

async function downloadZip() {
  if (!state.results.length) return;
  const entries = [];
  for (const r of state.results) {
    entries.push({ name: r.name, data: new Uint8Array(await r.blob.arrayBuffer()) });
  }
  const zip = zipStore(entries);
  const url = URL.createObjectURL(zip);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tomatttooo-旋转翻转包.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  document.querySelectorAll("#mode-chips .t-chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      document.querySelectorAll("#mode-chips .t-chip").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.mode === state.mode)
      );
      renderPreview();
    })
  );

  $("btn-go").addEventListener("click", runTransform);
  $("btn-zip").addEventListener("click", downloadZip);
  $("btn-clear").addEventListener("click", () => {
    state.items = [];
    state.results = [];
    $("filelist").innerHTML = "";
    $("results").innerHTML = "";
    $("upload-notice").hidden = true;
    $("opts").hidden = true;
    $("actions").hidden = true;
  });
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
