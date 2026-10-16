/* ============================================
   tomatttooo · 图片压缩器
   批量压缩：质量 / 目标大小 / 最长边，导出 ZIP
   ============================================ */

const $ = (id) => document.getElementById(id);

const state = {
  items: [],     // { id, img, name, base, size }
  results: [],   // { name, blob, thumb, base }
  fmt: "jpg",
  quality: 90,
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

/* ---------- 压缩核心 ---------- */

async function compressOne(img, opts) {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  let scale = opts.longEdge ? Math.min(1, opts.longEdge / Math.max(srcW, srcH)) : 1;
  const mime = opts.fmt === "webp" ? "image/webp" : "image/jpeg";

  const encode = (w, h, q) =>
    new Promise((resolve) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      const x = c.getContext("2d");
      x.fillStyle = "#ffffff";
      x.fillRect(0, 0, c.width, c.height);
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = "high";
      x.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(resolve, mime, q);
    });

  let blob = await encode(srcW * scale, srcH * scale, opts.quality);
  if (!blob) return null;

  // 目标大小模式：先降质量，仍超则逐步缩小尺寸
  if (opts.targetKB && blob.size > opts.targetKB * 1024) {
    const tryQ = [0.85, 0.7, 0.55];
    for (const q of tryQ) {
      if (opts.quality <= q) continue;
      blob = await encode(srcW * scale, srcH * scale, q);
      if (blob.size <= opts.targetKB * 1024) return blob;
    }
    for (const s of [0.85, 0.7, 0.55, 0.4]) {
      scale *= s;
      blob = await encode(srcW * scale, srcH * scale, 0.85);
      if (blob.size <= opts.targetKB * 1024) return blob;
    }
  }
  return blob;
}

/* ---------- 界面 ---------- */

function renderResults() {
  const wrap = $("results");
  wrap.innerHTML = "";
  state.results.forEach((r, idx) => {
    const div = document.createElement("div");
    div.className = "result-item";

    const thumb = document.createElement("canvas");
    const s = 52;
    thumb.width = s;
    thumb.height = s;
    const tx = thumb.getContext("2d");
    const tiw = r.thumb.naturalWidth || r.thumb.width;
    const tih = r.thumb.naturalHeight || r.thumb.height;
    const tsc = Math.max(s / tiw, s / tih);
    const tdw = tiw * tsc, tdh = tih * tsc;
    tx.drawImage(r.thumb, (s - tdw) / 2, (s - tdh) / 2, tdw, tdh);

    const meta = document.createElement("div");
    meta.className = "result-meta";
    const saving = Math.round((1 - r.blob.size / r.origSize) * 100);
    meta.innerHTML =
      `<b>${r.name}</b>` +
      `<small>${fmtSize(r.origSize)} → ${fmtSize(r.blob.size)} · ` +
      `<span class="saving">−${saving}%</span></small>`;

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

async function runCompress() {
  const btn = $("btn-go");
  btn.disabled = true;
  btn.textContent = "压缩中…";
  state.results = [];
  renderResults();

  const opts = {
    fmt: state.fmt,
    quality: state.quality / 100,
    targetKB: +$("target-kb").value || 0,
    longEdge: +$("edge").value || 0,
  };

  for (const item of state.items) {
    const blob = await compressOne(item.img, opts);
    if (!blob) continue;
    const ext = opts.fmt === "webp" ? "webp" : "jpg";
    state.results.push({
      name: `${item.base}-压缩.${ext}`,
      blob,
      origSize: item.size,
      thumb: item.img,
      base: item.base,
    });
    renderResults();
  }

  btn.textContent = "开始压缩";
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
  a.download = "tomatttooo-压缩包.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const isImage = (file) =>
  file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || "");

/* ---------- 已上传列表（含删除） ---------- */

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
    const tiw = item.img.naturalWidth || item.img.width;
    const tih = item.img.naturalHeight || item.img.height;
    const tsc = Math.max(s / tiw, s / tih);
    const tdw = tiw * tsc, tdh = tih * tsc;
    tx.drawImage(item.img, (s - tdw) / 2, (s - tdh) / 2, tdw, tdh);

    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.innerHTML = `<b>${item.base}</b><small>${fmtSize(item.size)} · 待压缩</small>`;

    const del = document.createElement("button");
    del.className = "file-del";
    del.type = "button";
    del.title = "删除这张";
    del.textContent = "✕";
    del.addEventListener("click", () => deleteItem(item.id));

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

function deleteItem(id) {
  const item = state.items.find((i) => i.id === id);
  state.items = state.items.filter((i) => i.id !== id);
  // 已压缩结果一并移除
  if (item) state.results = state.results.filter((r) => r.base !== item.base);
  renderFileList();
  renderResults();
  if (!state.items.length) {
    $("actions").hidden = true;
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
    };
    im.onerror = () => {
      const notice = $("upload-notice");
      notice.textContent = `${file.name} 读取失败，可能不是有效图片`;
      notice.hidden = false;
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

  // 整页都可以拖入：防止拖到页面其他位置时浏览器直接打开图片
  ["dragover", "drop"].forEach((ev) =>
    window.addEventListener(ev, (e) => e.preventDefault())
  );
  window.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  $("fmt").addEventListener("change", (e) => (state.fmt = e.target.value));
  $("quality").addEventListener("input", (e) => {
    state.quality = +e.target.value;
    $("out-q").textContent = state.quality;
  });
  $("btn-go").addEventListener("click", runCompress);
  $("btn-zip").addEventListener("click", downloadZip);
  $("btn-clear").addEventListener("click", () => {
    state.items = [];
    state.results = [];
    $("results").innerHTML = "";
    $("filelist").innerHTML = "";
    $("upload-notice").hidden = true;
    $("opts").hidden = true;
    $("actions").hidden = true;
  });
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
