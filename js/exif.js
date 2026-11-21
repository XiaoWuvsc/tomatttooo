/* ============================================
   tomatttooo · EXIF 查看器
   轻量 EXIF 解析（无外部依赖），全部本地处理
   ============================================ */

const $ = (id) => document.getElementById(id);

/* ---------- EXIF 解析（JPEG/TIFF） ---------- */

function parseExif(buf) {
  const dv = new DataView(buf);
  if (dv.byteLength < 4 || dv.getUint16(0) !== 0xffd8) return null;
  let off = 2;
  while (off + 4 <= dv.byteLength) {
    if (dv.getUint8(off) !== 0xff) break;
    const marker = dv.getUint8(off + 1);
    if (marker === 0xda) break;
    const size = dv.getUint16(off + 2);
    if (marker === 0xe1 && size >= 8 && dv.getUint32(off + 4) === 0x45786966 && dv.getUint16(off + 8) === 0) {
      return parseTiff(dv, off + 10);
    }
    off += 2 + size;
  }
  return null;
}

function parseTiff(dv, base) {
  const le = dv.getUint16(base) === 0x4949;
  const u16 = (o) => dv.getUint16(o, le);
  const u32 = (o) => dv.getUint32(o, le);
  if (u16(base + 2) !== 42) return null;
  const SIZES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const tags = {};
  const readIfd = (off) => {
    const n = u16(off);
    for (let i = 0; i < n; i++) {
      const e = off + 2 + i * 12;
      const tag = u16(e);
      const type = u16(e + 2);
      const count = u32(e + 4);
      const size = (SIZES[type] || 1) * count;
      tags[tag] = { type, count, valOff: size > 4 ? base + u32(e + 8) : e + 8 };
    }
    return u32(off + 2 + n * 12);
  };
  let next = readIfd(base + u32(base + 4));
  let guard = 0;
  while (next && guard++ < 8) next = readIfd(base + next);
  const exifIfd = tags[0x8769] ? base + u32(tags[0x8769].valOff) : 0;
  if (exifIfd) readIfd(exifIfd);

  const str = (tag) => {
    const t = tags[tag];
    if (!t) return "";
    let s = "";
    const n = Math.min(t.count, 64);
    for (let i = 0; i < n; i++) {
      const c = dv.getUint8(t.valOff + i);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s.trim();
  };
  const rat = (tag) => {
    const t = tags[tag];
    if (!t || t.type !== 5) return null;
    const num = u32(t.valOff), den = u32(t.valOff + 4);
    return den ? num / den : null;
  };
  const short = (tag) => (tags[tag] ? u16(tags[tag].valOff) : null);

  const model = str(0x0110) || str(0x010f);
  const lens = str(0xa434);
  const exp = rat(0x829a);
  const fnum = rat(0x829d);
  const iso = short(0x8827);
  const focal = rat(0x920a);
  const dt = str(0x9003);
  if (!model && !lens && exp === null && iso === null) return null;
  return { make: str(0x010f), model, lens, exp, fnum, iso, focal, dt };
}

const fmtExposure = (v) => (v == null ? "" : v >= 1 ? `${+v.toFixed(1)}s` : `1/${Math.round(1 / v)}s`);
const fmtAperture = (v) => (v == null ? "" : `f/${v.toFixed(1)}`);
const fmtFocal = (v) => (v == null ? "" : `${Math.round(v)}mm`);

function fmtDate(dt) {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(dt || "");
  return m ? `${m[1]}.${m[2]}.${m[3]} ${m[4]}:${m[5]}` : (dt || "");
}

function fmtSize(bytes) {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  if (bytes > 1024) return (bytes / 1024).toFixed(0) + " KB";
  return bytes + " B";
}

/* ---------- 界面 ---------- */

let current = null;

function renderInfo(exif, file, img) {
  const rows = [
    ["相机", exif.model || "—"],
    ["厂商", exif.make || "—"],
    ["镜头", exif.lens || (exif.focal != null ? fmtFocal(exif.focal) : "—")],
    ["焦距", exif.focal != null ? fmtFocal(exif.focal) : "—"],
    ["光圈", exif.fnum != null ? fmtAperture(exif.fnum) : "—"],
    ["快门", exif.exp != null ? fmtExposure(exif.exp) : "—"],
    ["ISO", exif.iso != null ? exif.iso : "—"],
    ["拍摄时间", fmtDate(exif.dt) || "—"],
    ["图片尺寸", `${img.naturalWidth} × ${img.naturalHeight}`],
    ["文件大小", fmtSize(file.size)],
  ];
  const grid = $("info-grid");
  grid.innerHTML = "";
  rows.forEach(([label, val]) => {
    const item = document.createElement("div");
    item.className = "t-item";
    item.innerHTML = `<label>${label}</label><b>${val}</b>`;
    grid.appendChild(item);
  });
  $("info-panel").style.display = "block";
  $("btn-copy").disabled = false;
  $("exif-notice").hidden = true;
  current = rows;
}

function copyParams() {
  if (!current) return;
  const text = current
    .filter(([label]) => !["图片尺寸", "文件大小"].includes(label))
    .map(([label, val]) => `${label} ${val}`)
    .join(" · ");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => flash("已复制到剪贴板"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      flash("已复制到剪贴板");
    } catch (e) {
      flash("复制失败，请手动选择");
    }
    ta.remove();
  }
}

function flash(msg) {
  const notice = $("exif-notice");
  notice.innerHTML = msg;
  notice.hidden = false;
  setTimeout(() => (notice.hidden = true), 2000);
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    const canvas = $("canvas");
    canvas.width = im.naturalWidth;
    canvas.height = im.naturalHeight;
    canvas.getContext("2d").drawImage(im, 0, 0);
    $("stage").classList.add("has-image");

    const fr = new FileReader();
    fr.onload = () => {
      let exif = null;
      try {
        exif = parseExif(fr.result);
      } catch (e) { /* 忽略 */ }
      if (exif) {
        renderInfo(exif, file, im);
      } else {
        $("info-panel").style.display = "none";
        $("btn-copy").disabled = true;
        $("exif-notice").hidden = false;
      }
    };
    fr.readAsArrayBuffer(file);
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
  $("btn-copy").addEventListener("click", copyParams);
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
