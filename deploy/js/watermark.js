/* ============================================
   tomatttooo · 水印工坊 v4
   七款参数卡模板（对照 watermark.yhphotos.top）：
   参数叠层 / 原创底栏 / 两列底栏 / 深色底栏 / 铁路记录 / 玻璃浮层 / 虚化参数卡
   字段体系：基础信息 / 拍摄参数 / 航空信息 / 铁路信息 / 排版与字体 / 输出设置
   页面风格与 index.html 统一（暗色番茄主题）
   全部本地处理，照片不上传
   ============================================ */

const $ = (id) => document.getElementById(id);

/* ============================================
   常量
   ============================================ */

const FONTS = {
  serif: '"Noto Serif SC","Songti SC","SimSun",serif',
  sans: '"Inter","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif',
  xiaowei: '"ZCOOL XiaoWei","Noto Serif SC",serif',
  huangyou: '"ZCOOL QingKe HuangYou","YouYuan",sans-serif',
  kai: '"LXGW WenKai","Kaiti SC",cursive',
  brush: '"Ma Shan Zheng","Kaiti SC",cursive',
  hand: '"Long Cang",cursive',
  liumao: '"Liu Jian Mao Cao","Ma Shan Zheng",cursive',
  cute: '"ZCOOL KuaiLe","YouYuan",sans-serif',
  mono: 'Consolas,"Courier New",monospace',
  playfair: '"Playfair Display","Noto Serif SC",serif',
  bebas: '"Bebas Neue",Impact,sans-serif',
  cinzel: '"Cinzel","Noto Serif SC",serif',
};

/* 品牌以文字呈现（无 Logo 图标） */

/* 品牌样式：仅 tomatttooo 自有品牌，文字呈现 + 番茄红点缀 */
const DEFAULT_TPL = {
  kind: "own",
  light: true,
  accent: "#ff6347",
  nameColor: "#d8402a",
  textColor: "#555555",
  subColor: "#999999",
  font: "serif",
  fontWeight: 600,
  nameLS: 0,
  logoMode: "bar",
};

/* 八款模板（前七款对照参考站，第八款为 tomatttooo 专属） */
const STYLE_LIST = [
  { key: "overlay", label: "参数叠层", desc: "经典摄影参数叠层" },
  { key: "classic", label: "原创底栏", desc: "满宽米白底栏" },
  { key: "rail", label: "两列底栏", desc: "留白与两列参数" },
  { key: "aero", label: "深色底栏", desc: "深色航空资料卡" },
  { key: "railway", label: "铁路记录", desc: "铁路运行记录风格" },
  { key: "minimal", label: "玻璃浮层", desc: "轻量玻璃信息浮层" },
  { key: "photosum", label: "虚化参数卡", desc: "虚化背景与参数列" },
  { key: "brand", label: "专属底栏", desc: "tomatttooo 头像徽章底栏" },
];

const STYLE_DEFAULTS = {
  overlay:  { posX: 4, posY: 94, alignH: "left", alignV: "bottom" },
  classic:  {},
  rail:     {},
  aero:     {},
  railway:  {},
  minimal:  { posX: 4, posY: 94 },
  photosum: { posX: 5, posY: 94, alignH: "left", alignV: "bottom" },
  brand:    {},
};

/* ============================================
   状态
   ============================================ */

const state = {
  step: 1,
  curTab: "basic",
  img: null, mini: null, orig: null,
  imgW: 0, imgH: 0,
  style: "overlay",
  /* 基础信息 */
  title: "",
  author: "tomatttooo",
  text: "tomatttooo",
  social: "",
  date: "",
  place: "",
  note: "",
  /* 拍摄参数 */
  camera: "TOMATTTOOO X1",
  lens: "35mm · f/1.8",
  focal: "",
  aperture: "",
  shutter: "",
  iso: "",
  /* 航空信息 */
  reg: "", aircraft: "", airline: "", flight: "",
  /* 铁路信息 */
  train: "", railtype: "", loco: "", line: "", station: "",
  /* 排版与字体 */
  font: "sans",
  size: 100,
  blur: 16,
  zoom: 115,
  posX: 4, posY: 94,
  alignH: "left",
  alignV: "bottom",
  blockW: 55,
  showLabels: false,
  showBrand: true,
  /* 输出 */
  format: "png",
  quality: 1,
  scaleOpt: "orig",
  autoExif: true,
  /* 批量 */
  files: [],
  cancelBatch: false,
};

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

/* ============================================
   工具函数
   ============================================ */

const rad = (deg) => (deg * Math.PI) / 180;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

function isLight(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

function hexToRgba(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return `rgba(128,128,128,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  if (typeof c.roundRect === "function") {
    c.roundRect(x, y, w, h, r);
    return;
  }
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function setLetterSpacing(c, px) {
  try {
    c.letterSpacing = px + "px";
  } catch (e) { /* 忽略 */ }
}

function measureText(c, fs, str, font, weight) {
  c.save();
  c.font = `${weight || ""} ${fs}px ${font || FONTS.sans}`;
  const w = c.measureText(str || "").width;
  c.restore();
  return w;
}

function imgLogoH(im, bh) {
  const ar = (im.naturalWidth || 1) / (im.naturalHeight || 1);
  return ar < 1.5 ? bh * 0.66 : ar < 4 ? bh * 0.52 : bh * 0.46;
}

function logoSize(logo, sizePx) {
  const ar = (logo.naturalWidth || 1) / (logo.naturalHeight || 1);
  const natLong = Math.max(logo.naturalWidth || 1, logo.naturalHeight || 1);
  let longSide = sizePx * (ar >= 1 ? Math.min(ar, 2.2) : 1);
  longSide = Math.min(longSide, natLong * 1.5);
  const w = ar >= 1 ? longSide : longSide * ar;
  const h = ar >= 1 ? longSide / ar : longSide;
  return { w, h };
}

/* 拍摄参数拼装 */
const paramsStr = (st) =>
  [st.shutter, st.aperture, st.iso ? "ISO " + st.iso : ""].filter(Boolean).join(" · ");
const lensStr = (st) =>
  st.lens || [st.focal, st.aperture].filter(Boolean).join(" · ");
const dateStr = (st) => st.date || today();

function fitFonts(c, lines, availW, minFs = 9) {
  let fs = lines[0].fs;
  let maxW = 0;
  lines.forEach((l) => {
    maxW = Math.max(maxW, measureText(c, l.fs, l.t, l.font || FONTS.sans, l.w || 400));
  });
  if (maxW <= availW) return lines;
  const k = availW / maxW;
  return lines.map((l) => ({ ...l, fs: Math.max(minFs, Math.round(l.fs * k)) }));
}

/* ============================================
   EXIF 解析（JPEG/TIFF，无需外部库）
   ============================================ */

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

function fmtExifDate(dt) {
  const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(dt || "");
  return m ? `${m[1]}.${m[2]}.${m[3]}` : "";
}

function applyExifFile(file) {
  const fr = new FileReader();
  fr.onload = () => {
    let exif = null;
    try {
      exif = parseExif(fr.result);
    } catch (e) { /* 忽略 */ }
    const notice = $("exif-notice");
    if (!exif) {
      notice.innerHTML = "未找到 EXIF，请手动填写参数";
      notice.hidden = false;
      setTimeout(() => (notice.hidden = true), 4000);
      return;
    }
    notice.innerHTML = "已读取照片和 EXIF，可继续微调";
    notice.hidden = false;
    setTimeout(() => (notice.hidden = true), 2500);

    if (exif.model) state.camera = exif.model;
    if (exif.lens) state.lens = exif.lens;
    if (exif.focal != null) state.focal = fmtFocal(exif.focal);
    if (exif.fnum != null) state.aperture = fmtAperture(exif.fnum);
    if (exif.exp != null) state.shutter = fmtExposure(exif.exp);
    if (exif.iso != null) state.iso = String(exif.iso);
    const d = fmtExifDate(exif.dt);
    if (d) state.date = d;
    syncControls();
    scheduleAll();
  };
  fr.readAsArrayBuffer(file);
}

/* ============================================
   品牌块（底栏类模板共用）
   ============================================ */

function buildBrandItems(tpl, st) {
  const items = [];
  if (!st.showBrand) return items;
  if (tpl.kind === "camera") {
    const name = tpl.prefix ? tpl.prefix + " " + st.camera : tpl.wordmark;
    if (name) items.push({ type: "text", str: name });
  } else {
    // 品牌名只在“专属底栏”显示；其余底栏不放红色点缀条和文字
    if (st.style === "brand" && st.text) items.push({ type: "text", str: st.text });
  }
  return items;
}

function drawBarBrand(c, st, tpl, x, y, w, bh, pad, maxFrac = 0.42, barIsLight = tpl.light) {
  const items = buildBrandItems(tpl, st);
  const gap = pad * 0.6;
  let total = gap * Math.max(0, items.length - 1);
  items.forEach((it) => {
    if (it.type === "bar") {
      it.w = bh * 0.12 + pad;
    } else {
      it.fs = Math.round(bh * (tpl.kind === "camera" ? tpl.wordSize : 0.36));
      it.weight = tpl.kind === "camera"
        ? `${tpl.wordItalic ? "italic " : ""}${tpl.wordWeight}`
        : `${tpl.fontWeight || 900}`;
      it.font = FONTS[st.font];
      it.color = tpl.kind === "camera"
        ? barIsLight && isLight(tpl.wordColor) ? "#33373d" : tpl.wordColor
        : tpl.nameColor;
      it.ls = Math.round(bh * (((tpl.kind === "camera" ? tpl.wordLS : tpl.nameLS) || 0) / 40));
      it.w = measureText(c, it.fs, it.str, it.font, it.weight);
    }
    total += it.w;
  });
  const scale = Math.min(1, (w * maxFrac) / Math.max(total, 1));

  let curX = x + pad;
  items.forEach((it) => {
    if (it.type === "bar") {
      c.fillStyle = tpl.accent;
      roundRect(c, x, y, bh * 0.12, bh, bh * 0.22);
      c.fill();
      curX += it.w * scale;
    } else {
      c.fillStyle = it.color;
      c.font = `${it.weight} ${Math.round(it.fs * scale)}px ${it.font}`;
      c.textAlign = "left";
      c.textBaseline = "middle";
      setLetterSpacing(c, it.ls);
      c.fillText(it.str, curX, y + bh / 2);
      setLetterSpacing(c, 0);
      curX += it.w * scale + gap * scale;
    }
  });
  return curX;
}

function drawSeparator(c, y, bh, sepX, color) {
  c.strokeStyle = color;
  c.lineWidth = Math.max(1, Math.round(bh * 0.02));
  c.beginPath();
  c.moveTo(sepX, y + bh * 0.28);
  c.lineTo(sepX, y + bh * 0.72);
  c.stroke();
}

/* 右栏信息：lines = [{t, s: big|mid|small}]，超宽自动收缩 */
function drawBarRight(c, st, tpl, x, y, w, bh, pad, sepX, lines) {
  if (!lines.length) return;
  const availW = Math.max(40, x + w - pad - (sepX + pad));
  const sizeOf = (s) => (s === "big" ? bh * 0.26 : s === "mid" ? bh * 0.2 : bh * 0.15);
  const weightOf = (s) => (s === "small" ? 400 : 600);
  const specs = lines.map((l) => ({ ...l, fs: Math.round(sizeOf(l.s || "mid")), w: weightOf(l.s || "mid") }));
  let maxW = 0;
  specs.forEach((l) => {
    l.w2 = measureText(c, l.fs, l.t, FONTS[st.font], l.w);
    maxW = Math.max(maxW, l.w2);
  });
  if (maxW > availW) {
    const k = availW / maxW;
    specs.forEach((l) => (l.fs = Math.max(9, Math.round(l.fs * k))));
  }
  const right = x + w - pad;
  c.textAlign = "right";
  c.textBaseline = "middle";
  const positions = specs.length === 3 ? [0.27, 0.56, 0.79] : specs.length === 2 ? [0.32, 0.68] : [0.5];
  specs.forEach((l, i) => {
    c.font = `${l.w} ${l.fs}px ${FONTS[st.font]}`;
    c.fillStyle = l.s === "small" ? tpl.subColor : tpl.textColor;
    c.fillText(l.t, right, y + bh * positions[i]);
  });
}

/* ============================================
   七款模板
   ============================================ */

/* 模板 1：参数叠层 —— 白字 + 左竖线直接叠在照片上 */
function drawOverlay(c, W, H, img, st) {
  const min = Math.min(W, H);
  const pad = Math.round(min * 0.045);
  const unit = (min * (st.size / 100)) / 100;
  const L = (lb, v) => (st.showLabels && lb ? lb + v : v);

  const lines = [];
  if (st.title) lines.push({ t: st.title, fs: unit * 3.6, w: 600 });
  if (st.camera) lines.push({ t: L("相机 ", st.camera), fs: unit * 3.0, w: 600 });
  const lp = lensStr(st);
  if (lp) lines.push({ t: L("镜头 ", lp), fs: unit * 2.6, w: 400 });
  const ps = paramsStr(st);
  if (ps) lines.push({ t: L("参数 ", ps), fs: unit * 2.6, w: 400 });
  const meta = [dateStr(st), st.place, st.note].filter(Boolean).join(" · ");
  if (meta) lines.push({ t: meta, fs: unit * 2.4, w: 300 });
  if (!lines.length) return;

  let maxW = 0, totalH = unit * 2;
  lines.forEach((l) => {
    l.w2 = measureText(c, l.fs, l.t, FONTS[st.font], l.w);
    maxW = Math.max(maxW, l.w2);
    totalH += l.fs * 1.55;
  });
  const blockW = Math.min(maxW + unit * 3.5, W * (st.blockW / 100));
  const k = blockW / (maxW + unit * 3.5);
  if (k < 1) lines.forEach((l) => (l.fs = Math.max(8, Math.round(l.fs * k))));

  let bx = pad + (W - 2 * pad) * (st.posX / 100);
  bx = Math.min(Math.max(pad, bx), W - pad - blockW);
  let by = st.alignV === "top"
    ? pad + (H - 2 * pad) * (st.posY / 100)
    : st.alignV === "middle"
      ? pad + (H - 2 * pad) * (st.posY / 100) - totalH / 2
      : H - pad - totalH;
  by = Math.min(Math.max(pad, by), H - pad - totalH);

  c.save();
  c.shadowColor = "rgba(0,0,0,0.65)";
  c.shadowBlur = Math.max(unit * 1.6, 4);
  c.shadowOffsetY = Math.max(unit * 0.5, 1);
  const lineX = st.alignH === "right" ? bx + blockW - unit * 0.4 : st.alignH === "center" ? bx + blockW / 2 : bx;
  c.fillStyle = "rgba(255,255,255,0.92)";
  c.fillRect(lineX, by + unit * 0.6, unit * 0.4, totalH - unit * 1.2);
  c.textAlign = st.alignH;
  c.textBaseline = "middle";
  let cy = by + unit * 0.8 + lines[0].fs * 0.8;
  const tx = st.alignH === "left" ? bx + unit * 1.7 : st.alignH === "right" ? bx + blockW - unit * 1.7 : bx + blockW / 2;
  lines.forEach((l) => {
    c.font = `${l.w} ${l.fs}px ${FONTS[st.font]}`;
    c.fillStyle = "rgba(255,255,255,0.96)";
    c.fillText(l.t, tx, cy);
    cy += l.fs * 1.55;
  });
  c.restore();
}

/* 模板 2：原创底栏 —— 满宽米白底栏 */
function drawClassic(c, W, H, img, st) {
  const tpl = DEFAULT_TPL;
  const min = Math.min(W, H);
  const m = Math.round(min * 0.025);
  const bh = Math.max(Math.round(min * 0.09), 56);
  const x = m, y = H - m - bh, w = W - 2 * m;

  c.save();
  c.fillStyle = "#f4f2ed";
  c.fillRect(x, y, w, bh);
  const tpl2 = { ...tpl, textColor: "#3f434a", subColor: "#8a8d93" };
  const pad = Math.round(bh * 0.3);
  const sepX = drawBarBrand(c, st, tpl2, x, y, w, bh, pad, 0.42, true);
  if (sepX < x + w - pad - 80) {
    drawSeparator(c, y, bh, sepX + pad * 0.75, "rgba(80,80,80,0.35)");
    const lines = [
      { t: st.camera, s: "mid" },
      { t: lensStr(st), s: "small" },
      { t: [paramsStr(st), dateStr(st)].filter(Boolean).join(" · "), s: "small" },
    ].filter((l) => l.t);
    drawBarRight(c, st, tpl2, x, y, w, bh, pad, sepX + pad * 0.75, lines);
  }
  c.restore();
}

/* 模板 8：tomatttooo 专属底栏 —— 与原创底栏同款布局，品牌块换成圆形头像 */
let brandAvatar = null;
function loadBrandAvatar() {
  brandAvatar = new Image();
  brandAvatar.onload = () => scheduleAll();
  brandAvatar.onerror = () => scheduleAll();
  // 优先内嵌 data URI（与页面同源，canvas 无污染），失败回退文件路径
  brandAvatar.src = (window.AVATAR_DATA) || "assets/brand/avatar.png";
}

/* 三重回退获取头像：JS 加载的 Image → HTML 内嵌 img → 无 */
function getBrandAvatar() {
  if (brandAvatar && brandAvatar.complete && brandAvatar.naturalWidth > 0) return brandAvatar;
  const el = document.getElementById("brand-avatar-img");
  if (el && el.complete && el.naturalWidth > 0) return el;
  return null;
}

function drawBrandBar(c, W, H, img, st) {
  const tpl = DEFAULT_TPL;
  const min = Math.min(W, H);
  const m = Math.round(min * 0.025);
  const bh = Math.max(Math.round(min * 0.09), 56);
  const x = m, y = H - m - bh, w = W - 2 * m;

  c.save();
  c.fillStyle = "#f4f2ed";
  c.fillRect(x, y, w, bh);
  const tpl2 = { ...tpl, textColor: "#3f434a", subColor: "#8a8d93" };
  const pad = Math.round(bh * 0.3);

  // 品牌块：圆形头像（始终显示，本模板核心）+ 红字标（受“显示品牌”控制）
  const d = Math.round(bh * 0.8);
  const avatar = getBrandAvatar();
  const cx = x + pad + d / 2;
  const cy = y + bh / 2;
  let endX = cx + d / 2 + pad * 0.55;

  if (avatar) {
    c.save();
    c.beginPath();
    c.arc(cx, cy, d / 2, 0, Math.PI * 2);
    c.closePath();
    c.clip();
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    c.drawImage(avatar, cx - d / 2, cy - d / 2, d, d);
    c.restore();
    c.beginPath();
    c.arc(cx, cy, d / 2, 0, Math.PI * 2);
    c.strokeStyle = "rgba(0,0,0,0.12)";
    c.lineWidth = 1;
    c.stroke();
  } else {
    c.fillStyle = tpl.accent;
    c.beginPath();
    c.arc(cx, cy, d / 2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffffff";
    c.font = `900 ${Math.round(d * 0.42)}px ${FONTS.sans}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("t", cx, cy + d * 0.03);
  }

  if (st.showBrand) {
    const name = st.text || st.author || "tomatttooo";
    const nx = cx + d / 2 + pad * 0.55;
    c.textAlign = "left";
    c.textBaseline = "middle";
    const nfs = Math.round(bh * 0.36);
    c.font = `600 ${nfs}px ${FONTS[st.font]}`;
    c.fillStyle = tpl.nameColor;
    c.fillText(name, nx, y + bh / 2);
    endX = nx + measureText(c, nfs, name, FONTS[st.font], 600) + pad * 0.75;
  }

  // 分隔线 + 右栏（与原创底栏一致）
  if (endX < x + w - pad - 80) {
    drawSeparator(c, y, bh, endX, "rgba(80,80,80,0.35)");
    const lines = [
      { t: st.camera, s: "mid" },
      { t: lensStr(st), s: "small" },
      { t: [paramsStr(st), dateStr(st)].filter(Boolean).join(" · "), s: "small" },
    ].filter((l) => l.t);
    drawBarRight(c, st, tpl2, x, y, w, bh, pad, endX, lines);
  }
  c.restore();
}

/* 模板 3：两列底栏 —— 米白条 + 品牌色块 + 两列参数 */
function drawRail(c, W, H, img, st) {
  const tpl = DEFAULT_TPL;
  const min = Math.min(W, H);
  const m = Math.round(min * 0.035);
  const bh = Math.max(Math.round(min * 0.058), 40);
  const x = m, y = H - m - bh, w = W - 2 * m;

  c.save();
  roundRect(c, x, y, w, bh, bh * 0.16);
  c.fillStyle = "#f4efe4";
  c.fill();

  const tpl2 = { ...tpl, textColor: "#3a3f47", subColor: "#8a8f96" };
  const pad = Math.round(bh * 0.4);
  const brandRight = drawBarBrand(c, st, tpl2, x, y, w, bh, pad, 0.4, true);
  const blockW = 0;
  const blockX = brandRight + pad * 0.5;

  const col2 = [paramsStr(st) + (st.date ? " · " + st.date : ""), dateStr(st)];
  const col1 = [st.camera, lensStr(st)];
  const fsBig = Math.round(bh * 0.22);
  const fsSmall = Math.round(bh * 0.15);
  const right = x + w - pad;
  const col2W = Math.max(
    measureText(c, fsSmall, col2[0], FONTS[st.font], 400),
    measureText(c, fsSmall, col2[1], FONTS[st.font], 400)
  );
  const gap = pad;
  const col1Right = right - col2W - gap;
  const col1W = Math.max(
    measureText(c, fsBig, col1[0], FONTS[st.font], 600),
    measureText(c, fsSmall, col1[1], FONTS[st.font], 400)
  );
  const avail1 = col1Right - (blockX + blockW + gap);
  const k = Math.min(1, avail1 / Math.max(col1W, 1));
  const f1 = Math.max(9, Math.round(fsBig * k));
  const f2 = Math.max(9, Math.round(fsSmall * k));

  c.textAlign = "right";
  c.textBaseline = "middle";
  c.fillStyle = tpl2.textColor;
  c.font = `600 ${f1}px ${FONTS[st.font]}`;
  c.fillText(col1[0], col1Right, y + bh * 0.34);
  c.fillStyle = tpl2.subColor;
  c.font = `${f2}px ${FONTS[st.font]}`;
  c.fillText(col1[1], col1Right, y + bh * 0.72);
  c.fillStyle = tpl2.textColor;
  c.font = `${Math.round(fsSmall)}px ${FONTS[st.font]}`;
  c.fillText(col2[0], right, y + bh * 0.53);
  c.restore();
}

/* 模板 4：深色底栏 —— 深色航空资料卡，突出注册号 / 型号 */
function drawAero(c, W, H, img, st) {
  const tpl = DEFAULT_TPL;
  const min = Math.min(W, H);
  const m = Math.round(min * 0.025);
  const bh = Math.max(Math.round(min * 0.08), 52);
  const x = m, y = H - m - bh, w = W - 2 * m;

  c.save();
  c.fillStyle = "#0d1b2d";
  c.fillRect(x, y, w, bh);

  const tpl2 = { ...tpl, textColor: "#dbe4ee", subColor: "#8fa0b5" };
  const pad = Math.round(bh * 0.34);
  const sepX = drawBarBrand(c, st, tpl2, x, y, w, bh, pad, 0.4, false);

  const av = [st.reg, st.aircraft, st.airline, st.flight].filter(Boolean);
  let lines;
  if (av.length) {
    lines = [
      { t: st.reg || st.aircraft, s: "big" },
      { t: st.aircraft, s: "mid" },
      { t: [st.airline, st.flight].filter(Boolean).join(" · "), s: "small" },
    ].filter((l) => l.t);
  } else {
    lines = [
      { t: st.camera, s: "big" },
      { t: lensStr(st), s: "mid" },
      { t: [paramsStr(st), dateStr(st)].filter(Boolean).join(" · "), s: "small" },
    ].filter((l) => l.t);
  }
  if (sepX < x + w - pad - 80) {
    drawSeparator(c, y, bh, sepX + pad * 0.75, "rgba(255,255,255,0.25)");
    drawBarRight(c, st, tpl2, x, y, w, bh, pad, sepX + pad * 0.75, lines);
  }
  c.restore();
}

/* 模板 5：铁路记录 —— 米白条 + 细分隔线 + 中间大车次 */
function drawRailway(c, W, H, img, st) {
  const tpl = DEFAULT_TPL;
  const min = Math.min(W, H);
  const m = Math.round(min * 0.03);
  const bh = Math.max(Math.round(min * 0.07), 44);
  const x = m, y = H - m - bh, w = W - 2 * m;

  c.save();
  c.fillStyle = "#f4efe4";
  c.fillRect(x, y, w, bh);

  const tpl2 = { ...tpl, textColor: "#33373d", subColor: "#84888e" };
  const pad = Math.round(bh * 0.3);
  const brandRight = drawBarBrand(c, st, tpl2, x, y, w, bh, pad, 0.34, true);
  const hair = "rgba(60,60,60,0.18)";
  const s1 = brandRight + pad * 0.7;
  if (s1 < x + w - pad * 4) {
    c.strokeStyle = hair;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(s1, y + bh * 0.2);
    c.lineTo(s1, y + bh * 0.8);
    c.stroke();
  }

  const rail = [st.train, st.railtype, st.loco, st.line, st.station].filter(Boolean);
  const big = rail.length ? st.train || st.railtype : st.camera;
  const right1 = rail.length
    ? [st.railtype, st.loco].filter(Boolean).join(" · ")
    : lensStr(st);
  const right2 = rail.length
    ? [st.line, st.station].filter(Boolean).join(" · ")
    : [paramsStr(st), dateStr(st)].filter(Boolean).join(" · ");

  const right = x + w - pad;
  const avail = right - (s1 + pad * 2);
  let fsM = Math.round(bh * 0.34);
  const mw0 = measureText(c, fsM, big, FONTS[st.font], 600);
  if (mw0 > avail) fsM = Math.max(9, Math.round((fsM * avail) / mw0));
  c.font = `600 ${fsM}px ${FONTS[st.font]}`;
  c.fillStyle = "#2e3238";
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText(big, s1 + pad, y + bh / 2);

  c.textAlign = "right";
  c.font = `${Math.round(bh * 0.2)}px ${FONTS[st.font]}`;
  c.fillStyle = "#5c6066";
  c.fillText(right1, right, y + bh * 0.32);
  c.font = `${Math.round(bh * 0.17)}px ${FONTS[st.font]}`;
  c.fillStyle = "#94989e";
  c.fillText(right2, right, y + bh * 0.7);
  c.restore();
}

/* 模板 6：玻璃浮层 —— 小圆角半透明信息条 */
function drawMinimal(c, W, H, img, st) {
  const min = Math.min(W, H);
  const pad = Math.round(min * 0.04);
  const unit = (min * (st.size / 100)) / 100;
  const text = [st.camera, lensStr(st), paramsStr(st)].filter(Boolean).join(" · ");
  if (!text) return;
  const fs = unit * 2.2;
  const tw = measureText(c, fs, text, FONTS[st.font], 300);
  const chipW = Math.min(tw + unit * 5, W * 0.9);
  const chipH = unit * 4.8;
  let bx = pad + (W - 2 * pad) * (st.posX / 100);
  bx = Math.min(Math.max(pad, bx), W - pad - chipW);
  let by = st.posY > 80 ? H - pad - chipH : pad + (H - 2 * pad) * (st.posY / 100);
  by = Math.min(Math.max(pad, by), H - pad - chipH);

  c.save();
  c.globalAlpha = 0.88;
  c.fillStyle = "rgba(10,15,28,0.72)";
  roundRect(c, bx, by, chipW, chipH, chipH / 2);
  c.fill();
  c.strokeStyle = "rgba(255,255,255,0.25)";
  c.lineWidth = 1;
  c.stroke();
  c.font = `300 ${fs}px ${FONTS[st.font]}`;
  c.fillStyle = "#ffffff";
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText(text, bx + unit * 2.5, by + chipH / 2);
  c.restore();
}

/* 模板 7：虚化参数卡 —— 全幅虚化背景 + 左侧参数列 + 右下品牌 */
function drawPhotoSum(c, W, H, img, st) {
  c.save();
  try {
    const scale = st.zoom / 100;
    const sw = W * scale, sh = H * scale;
    const tmp = document.createElement("canvas");
    tmp.width = W;
    tmp.height = H;
    const t = tmp.getContext("2d");
    t.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh, 0, 0, W, H);
    if (st.blur > 0) {
      t.filter = `blur(${st.blur}px) saturate(1.1) brightness(0.85)`;
      t.drawImage(tmp, 0, 0);
    }
    c.drawImage(tmp, 0, 0, W, H);
  } catch (e) {
    if (img) c.drawImage(img, 0, 0, W, H);
  }
  c.fillStyle = "rgba(8,12,18,0.5)";
  c.fillRect(0, 0, W, H);

  const unit = (Math.min(W, H) * (st.size / 100)) / 100;
  const pad = unit * 5;
  const L = (lb, v) => (st.showLabels && lb ? lb + v : v);
  const lines = [];
  if (st.title) lines.push({ t: st.title, fs: unit * 4.2, w: 600 });
  if (st.camera) lines.push({ t: L("相机 ", st.camera), fs: unit * 3.4, w: 600 });
  const lp = lensStr(st);
  if (lp) lines.push({ t: L("镜头 ", lp), fs: unit * 2.7, w: 300 });
  const ps = paramsStr(st);
  if (ps) lines.push({ t: L("参数 ", ps), fs: unit * 2.7, w: 300 });
  const meta = [dateStr(st), st.place, st.note].filter(Boolean).join(" · ");
  if (meta) lines.push({ t: meta, fs: unit * 2.5, w: 300 });

  const colW = W * (st.blockW / 100);
  let maxW = 0;
  lines.forEach((l) => {
    l.w2 = measureText(c, l.fs, l.t, FONTS[st.font], l.w);
    maxW = Math.max(maxW, l.w2);
  });
  const needW = maxW + unit * 5;
  if (needW > colW) {
    const k = colW / needW;
    lines.forEach((l) => (l.fs = Math.max(8, Math.round(l.fs * k))));
  }

  let totalH = 0;
  lines.forEach((l) => (totalH += l.fs * 1.6));
  totalH = Math.max(totalH, unit * 20);

  const colX = st.alignH === "right" ? W - pad - colW : st.alignH === "center" ? (W - colW) / 2 : pad;
  const colY = st.alignV === "top" ? pad : st.alignV === "middle" ? (H - totalH) / 2 : H - pad - totalH;
  const lineX = colX + (st.alignH === "right" ? colW - unit * 0.5 : st.alignH === "center" ? colW / 2 : unit * 0.5);

  c.fillStyle = "rgba(255,255,255,0.9)";
  c.fillRect(lineX, colY, unit * 0.5, totalH);
  c.textAlign = st.alignH;
  c.textBaseline = "middle";
  let cy = colY;
  const tx = st.alignH === "left" ? colX + unit * 3 : st.alignH === "right" ? colX + colW - unit * 3 : colX + colW / 2;
  lines.forEach((l) => {
    c.font = `${l.w} ${l.fs}px ${FONTS[st.font]}`;
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.fillText(l.t, tx, cy + l.fs * 0.8);
    cy += l.fs * 1.6;
  });

  // 右下角品牌（文字）
  if (st.showBrand) {
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.font = `300 ${unit * 3.2}px ${FONTS[st.font]}`;
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.fillText(st.text, W - pad, H - pad - unit * 1);
  }
  c.restore();
}

const STYLE_FNS = {
  overlay: drawOverlay,
  classic: drawClassic,
  rail: drawRail,
  aero: drawAero,
  railway: drawRailway,
  minimal: drawMinimal,
  photosum: drawPhotoSum,
  brand: drawBrandBar,
};

function renderScene(c, W, H, img, st) {
  c.canvas.width = W;
  c.canvas.height = H;
  if (img) {
    // 封面式填充：等比缩放并居中裁剪，任何画布比例都不变形
    const iw = img.naturalWidth || img.width || W;
    const ih = img.naturalHeight || img.height || H;
    const s = Math.max(W / iw, H / ih);
    const dw = iw * s, dh = ih * s;
    c.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#233245");
    g.addColorStop(1, "#0d141d");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  const fn = STYLE_FNS[st.style];
  if (fn) fn(c, W, H, img, st);
}

/* ============================================
   主渲染 + 模板卡预览 + 信息栏
   ============================================ */

let rafPending = false;
let templateCards = [];

function renderNow() {
  if (!state.img) return;
  renderScene(ctx, state.imgW, state.imgH, state.img, state);
  updateInfo();
}

function renderMinis() {
  templateCards.forEach((btn) => {
    const c = btn.querySelector("canvas");
    const cctx = c.getContext("2d");
    c.width = 104;
    c.height = 128;
    const miniSt = { ...state, style: btn.dataset.style };
    renderScene(cctx, 104, 128, state.mini, miniSt);
  });
}

function scheduleAll() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    renderNow();
    renderMinis();
    updateInfo();
    scheduleAutoSave();
  });
}

function calcExportSize() {
  let w = state.imgW, h = state.imgH;
  const s = scaleFor();
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

function updateInfo() {
  if (!state.img) {
    $("img-info").textContent = "未导入照片";
    return;
  }
  const s = calcExportSize();
  $("img-info").textContent = `原图 ${state.imgW}×${state.imgH} → 导出 ${s.w}×${s.h} · ${state.format.toUpperCase()}`;
}

/* ============================================
   图片加载与批量队列
   ============================================ */

function makeMini(img) {
  const c = document.createElement("canvas");
  c.width = 120;
  c.height = 80;
  const x = c.getContext("2d");
  const ar = img.naturalWidth / img.naturalHeight;
  const tar = 120 / 80;
  let sw, sh, sx, sy;
  if (ar > tar) {
    sh = img.naturalHeight;
    sw = sh * tar;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / tar;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  x.drawImage(img, sx, sy, sw, sh, 0, 0, 120, 80);
  return c;
}

function setImage(im, file) {
  state.img = im;
  state.imgW = im.naturalWidth || im.width;
  state.imgH = im.naturalHeight || im.height;
  state.mini = makeMini(im);
  state.orig = document.createElement("canvas");
  state.orig.width = state.imgW;
  state.orig.height = state.imgH;
  state.orig.getContext("2d").drawImage(im, 0, 0);
  document.querySelector(".canvas-stage").classList.add("has-image");
  $("btn-export").disabled = false;
  $("btn-export-batch").disabled = state.files.length === 0;
  document.fonts.ready.then(() => {
    renderNow();
    renderMinis();
  });
  scheduleAll();
  if (file && state.autoExif) applyExifFile(file);
  if (state.step === 1) goStep(2);
}

function renderThumbs() {
  const list = $("file-list");
  list.innerHTML = "";
  state.files.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "fileitem" + (item.img === state.img ? " is-active" : "");
    div.innerHTML = `<img src="${item.url}" alt=""><button class="rm" type="button" title="移除">✕</button>`;
    div.querySelector("img").addEventListener("click", () => {
      if (item.img) setImage(item.img, item.file);
    });
    div.querySelector(".rm").addEventListener("click", (e) => {
      e.stopPropagation();
      removeFile(i);
    });
    list.appendChild(div);
  });
  $("file-count").textContent = state.files.length + " 张";
  $("btn-export-batch").innerHTML = `${window.ICONS ? window.ICONS.box : ""} 批量 ZIP（${state.files.length} 张）`;
  $("btn-export-batch").disabled = state.files.length === 0;
  $("filelist-actions").hidden = state.files.length === 0;
}

function addFiles(fileList) {
  const arr = [...fileList].filter((f) => f.type.startsWith("image/"));
  if (!arr.length) return;
  for (const f of arr) {
    const url = URL.createObjectURL(f);
    const item = { url, img: null, name: f.name, file: f };
    const im = new Image();
    im.onload = () => {
      item.img = im;
      if (!state.img) setImage(im, f);
      renderThumbs();
    };
    im.onerror = () => {};
    im.src = url;
    state.files.push(item);
  }
  renderThumbs();
}

function removeFile(i) {
  const [item] = state.files.splice(i, 1);
  URL.revokeObjectURL(item.url);
  if (item.img === state.img && state.files.length) {
    const next = state.files.find((f) => f.img);
    if (next) setImage(next.img, next.file);
  }
  renderThumbs();
}

function clearFiles() {
  state.files.forEach((f) => URL.revokeObjectURL(f.url));
  state.files = [];
  renderThumbs();
}

/* ============================================
   导出
   ============================================ */

function scaleFor() {
  if (state.scaleOpt === "orig") return 1;
  const t = +state.scaleOpt;
  return Math.min(1, t / Math.max(state.imgW, state.imgH));
}

const mime = () => (state.format === "png" ? "image/png" : "image/jpeg");
const ext = () => (state.format === "png" ? "png" : "jpg");

function exportCanvas() {
  renderNow();
  let c = canvas;
  const s = scaleFor();
  if (s < 1) {
    const w = Math.max(1, Math.round(canvas.width * s));
    const h = Math.max(1, Math.round(canvas.height * s));
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cctx = c.getContext("2d");
    cctx.imageSmoothingEnabled = true;
    cctx.imageSmoothingQuality = "high";
    cctx.drawImage(canvas, 0, 0, w, h);
  }
  return c;
}

function canvasToBlob(c) {
  return new Promise((resolve, reject) => {
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("导出失败"))), mime(), state.quality);
  });
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCurrent() {
  if (!state.img) return;
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  // 文件名优先用作品标题，未填则用默认名+日期
  const name = state.title.trim() || `tomatttooo-${stamp}`;
  canvasToBlob(exportCanvas()).then((b) => downloadBlob(b, `${name}.${ext()}`));
}

async function exportBatch() {
  const files = state.files.filter((f) => f.img);
  if (!files.length) {
    alert("请先导入照片");
    return;
  }
  state.cancelBatch = false;
  $("batch-progress").hidden = false;
  $("btn-export-batch").disabled = true;
  const saved = state.img;
  const entries = [];
  try {
    for (let i = 0; i < files.length; i++) {
      if (state.cancelBatch) break;
      $("batch-text").textContent = `处理中 ${i + 1}/${files.length}…`;
      $("batch-fill").style.width = `${Math.round((i / files.length) * 100)}%`;
      await new Promise((r) => setTimeout(r, 25));
      state.img = files[i].img;
      state.imgW = files[i].img.naturalWidth || files[i].img.width;
      state.imgH = files[i].img.naturalHeight || files[i].img.height;
      const blob = await canvasToBlob(exportCanvas());
      const title = state.title.trim() || "tomatttooo";
      entries.push({
        name: `${title}-${pad2(i + 1)}.${ext()}`,
        data: new Uint8Array(await blob.arrayBuffer()),
      });
    }
    if (state.cancelBatch) {
      $("batch-text").textContent = "已取消";
    } else if (entries.length) {
      $("batch-fill").style.width = "100%";
      $("batch-text").textContent = `打包中 ${entries.length} 张…`;
      const d = new Date();
      const stamp = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
      const title = state.title.trim();
      const zipName = title
        ? `${title}-${entries.length}张.zip`
        : `tomatttooo-水印-${entries.length}张-${stamp}.zip`;
      downloadBlob(zipStore(entries), zipName);
      $("batch-text").textContent = "完成";
    }
  } catch (e) {
    alert("导出失败：" + e.message);
  }
  state.img = saved || files[files.length - 1].img;
  state.imgW = state.img.naturalWidth || state.img.width;
  state.imgH = state.img.naturalHeight || state.img.height;
  renderNow();
  $("btn-export-batch").disabled = false;
  setTimeout(() => {
    $("batch-progress").hidden = true;
    $("batch-fill").style.width = "0%";
  }, 1200);
}

/* ============================================
   ZIP 打包（STORE 模式，离线可用）
   ============================================ */

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

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
}

/* ============================================
   预设 / 自动保存 / JSON 导入导出
   ============================================ */

const BUILTIN_PRESETS = {
  "参数叠层": { style: "overlay", posX: 4, posY: 94 },
  "原创底栏": { style: "classic" },
  "两列底栏": { style: "rail" },
  "深色底栏": { style: "aero" },
  "铁路记录": { style: "railway" },
  "玻璃浮层": { style: "minimal", posX: 4, posY: 94 },
  "虚化参数卡": { style: "photosum" },
  "专属底栏": { style: "brand" },
};

const PRESET_KEY = "wm-presets";
const AUTOSAVE_KEY = "wm-autosave";

const getSavedPresets = () => {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY)) || {};
  } catch (e) {
    return {};
  }
};
const setSavedPresets = (o) => {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(o));
  } catch (e) { /* 忽略 */ }
};

function serializeState() {
  return {
    style: state.style,
    title: state.title, author: state.author, social: state.social,
    text: state.text,
    date: state.date, place: state.place, note: state.note,
    camera: state.camera, lens: state.lens, focal: state.focal,
    aperture: state.aperture, shutter: state.shutter, iso: state.iso,
    reg: state.reg, aircraft: state.aircraft, airline: state.airline, flight: state.flight,
    train: state.train, railtype: state.railtype, loco: state.loco, line: state.line, station: state.station,
    font: state.font, size: state.size, blur: state.blur, zoom: state.zoom,
    posX: state.posX, posY: state.posY,
    alignH: state.alignH, alignV: state.alignV, blockW: state.blockW,
    showLabels: state.showLabels,
    format: state.format, quality: state.quality, scaleOpt: state.scaleOpt,
  };
}

function applyPreset(p) {
  Object.assign(state, p);
  syncControls();
  scheduleAll();
}

function refreshPresetSelect() {
  const sel = $("wm-preset");
  const saved = getSavedPresets();
  sel.innerHTML = "";
  const g1 = document.createElement("optgroup");
  g1.label = "内置预设";
  for (const name of Object.keys(BUILTIN_PRESETS)) {
    const o = document.createElement("option");
    o.value = "builtin:" + name;
    o.textContent = name;
    g1.appendChild(o);
  }
  sel.appendChild(g1);
  if (Object.keys(saved).length) {
    const g2 = document.createElement("optgroup");
    g2.label = "我的预设";
    for (const name of Object.keys(saved)) {
      const o = document.createElement("option");
      o.value = "saved:" + name;
      o.textContent = name;
      g2.appendChild(o);
    }
    sel.appendChild(g2);
  }
}

let saveTimer = 0;
function scheduleAutoSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeState()));
    } catch (e) { /* 忽略 */ }
  }, 500);
}

function restoreAutoSave() {
  try {
    const s = JSON.parse(localStorage.getItem(AUTOSAVE_KEY));
    if (s) Object.assign(state, s);
  } catch (e) { /* 忽略 */ }
  state.showBrand = true; // 显示品牌已移除开关，始终显示
}

/* ============================================
   随机参数
   ============================================ */

function randomParams() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.shutter = pick(["1/60s", "1/125s", "1/200s", "1/250s", "1/500s", "1/1000s", "1/2000s", "2s"]);
  state.aperture = pick(["f/1.4", "f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8"]);
  state.iso = String(pick([100, 200, 400, 800, 1600]));
  state.focal = pick(["24mm", "35mm", "50mm", "85mm", "200mm"]);
  if (!state.lens) state.lens = state.focal + " · " + state.aperture;
  syncControls();
  scheduleAll();
}

/* ============================================
   工作流
   ============================================ */

const STEP_HINTS = {
  1: "先导入一张照片",
  2: "挑一个喜欢的模板",
  3: "微调参数并导出",
};

function goStep(n) {
  state.step = n;
  document.querySelectorAll(".workflow-step").forEach((el) =>
    el.classList.toggle("is-active", +el.dataset.step === n)
  );
  document.querySelectorAll(".workflow-progress button").forEach((b) => {
    const s = +b.dataset.step;
    b.classList.toggle("active", s === n);
    b.classList.toggle("complete", s < n);
  });
  $("step-hint").textContent = STEP_HINTS[n];
  syncControls();
  scheduleAll();
}

/* ============================================
   界面联动
   ============================================ */

function paintRange(el) {
  const min = +el.min || 0, max = +el.max || 100, v = +el.value;
  const p = ((v - min) / (max - min)) * 100;
  el.style.background = `linear-gradient(90deg, var(--accent) ${p}%, rgba(255,255,255,0.12) ${p}%)`;
}

function updateVisibility() {
  document.querySelectorAll("[data-show]").forEach((el) => {
    const shows = el.dataset.show.split(/\s+/);
    let vis = false;
    for (const s of shows) {
      if (state.style === s) vis = true;
    }
    el.classList.toggle("is-shown", vis);
  });
  $("quality-row").classList.toggle("is-shown", state.format === "jpg");

  // 航空 / 铁路标签只在对应模板下出现
  const avTab = document.querySelector('.step-tab[data-tab="av"]');
  const railTab = document.querySelector('.step-tab[data-tab="rail"]');
  if (avTab) avTab.style.display = state.style === "aero" ? "" : "none";
  if (railTab) railTab.style.display = state.style === "railway" ? "" : "none";
  const active = document.querySelector(".step-tab.is-active");
  if (active && active.style.display === "none") activateTab("basic");
}

function activateTab(name) {
  state.curTab = name;
  document.querySelectorAll(".step-tab").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.tab === name)
  );
  document.querySelectorAll(".tab-pane").forEach((p) =>
    p.classList.toggle("is-active", p.dataset.pane === name)
  );
}

function syncControls() {
  $("wm-title").value = state.title;
  $("wm-author").value = state.author;
  $("wm-social").value = state.social;
  $("wm-date").value = state.date;
  $("wm-place").value = state.place;
  $("wm-note").value = state.note;
  $("wm-camera").value = state.camera;
  $("wm-lens").value = state.lens;
  $("wm-focal").value = state.focal;
  $("wm-aperture").value = state.aperture;
  $("wm-shutter").value = state.shutter;
  $("wm-iso").value = state.iso;
  $("wm-reg").value = state.reg;
  $("wm-aircraft").value = state.aircraft;
  $("wm-airline").value = state.airline;
  $("wm-flight").value = state.flight;
  $("wm-train").value = state.train;
  $("wm-railtype").value = state.railtype;
  $("wm-loco").value = state.loco;
  $("wm-line").value = state.line;
  $("wm-station").value = state.station;
  $("wm-font").value = state.font;
  $("wm-size").value = Math.min(Math.max(state.size, 20), 400);
  $("out-size").textContent = state.size + "%";
  $("wm-size-custom").value = state.size;
  $("wm-blur").value = state.blur;
  $("out-blur").textContent = state.blur;
  $("wm-zoom").value = state.zoom;
  $("out-zoom").textContent = state.zoom + "%";
  $("wm-alignh").value = state.alignH;
  $("wm-alignv").value = state.alignV;
  $("wm-blockw").value = state.blockW;
  $("out-blockw").textContent = state.blockW + "%";
  $("wm-labels").checked = state.showLabels;
  $("auto-exif").checked = state.autoExif;
  $("wm-scale").value = state.scaleOpt;
  $("wm-format").value = state.format;
  $("wm-quality").value = Math.round(state.quality * 100);
  $("out-quality").textContent = Math.round(state.quality * 100);

  templateCards.forEach((b) => b.classList.toggle("active", b.dataset.style === state.style));
  document.querySelectorAll("input[type=range]").forEach(paintRange);
  updateVisibility();
}

function selectStyle(key) {
  state.style = key;
  Object.assign(state, STYLE_DEFAULTS[key] || {});
  syncControls();
  scheduleAll();
}

function resetAll() {
  // 彻底重置：清除自动保存和预设，再刷新（旧实现只刷新，保存的状态会立刻恢复）
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
    localStorage.removeItem(PRESET_KEY);
  } catch (e) { /* 忽略 */ }
  location.reload();
}

/* ============================================
   事件绑定
   ============================================ */

function bindEvents() {
  // 工作流
  document.querySelectorAll(".workflow-progress button").forEach((b) =>
    b.addEventListener("click", () => goStep(+b.dataset.step))
  );
  $("btn-next-1").addEventListener("click", () => goStep(2));
  $("btn-next-2").addEventListener("click", () => goStep(3));
  $("btn-back-2").addEventListener("click", () => goStep(1));
  $("btn-back-3").addEventListener("click", () => goStep(2));

  // 编辑页标签
  document.querySelectorAll(".step-tab").forEach((b) =>
    b.addEventListener("click", () => activateTab(b.dataset.tab))
  );

  // 导入
  const drop = $("drop");
  drop.addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  });
  $("btn-clear-files").addEventListener("click", clearFiles);
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

  // 文本字段
  const bindText = (id, key) =>
    $(id).addEventListener("input", (e) => {
      state[key] = e.target.value;
      scheduleAll();
    });
  bindText("wm-camera", "camera");
  bindText("wm-title", "title");
  bindText("wm-author", "author");
  bindText("wm-social", "social");
  bindText("wm-date", "date");
  bindText("wm-place", "place");
  bindText("wm-note", "note");
  bindText("wm-lens", "lens");
  bindText("wm-focal", "focal");
  bindText("wm-aperture", "aperture");
  bindText("wm-shutter", "shutter");
  bindText("wm-iso", "iso");
  bindText("wm-reg", "reg");
  bindText("wm-aircraft", "aircraft");
  bindText("wm-airline", "airline");
  bindText("wm-flight", "flight");
  bindText("wm-train", "train");
  bindText("wm-railtype", "railtype");
  bindText("wm-loco", "loco");
  bindText("wm-line", "line");
  bindText("wm-station", "station");

  // 排版
  $("wm-font").addEventListener("change", (e) => {
    state.font = e.target.value;
    // 显式触发字体下载，加载完成后重绘，确保画布用上新字体
    const fam = (FONTS[state.font].match(/^"([^"]+)"/) || [])[1];
    if (fam && document.fonts && document.fonts.load) {
      document.fonts
        .load(`400 16px "${fam}"`, "tomatttooo 相机 镜头 光圈 快门 ISO 123")
        .then(() => scheduleAll());
    }
    scheduleAll();
  });
  const bindRange = (id, key, outId, fmt, scale = 1) => {
    $(id).addEventListener("input", (e) => {
      state[key] = +e.target.value * scale;
      $(outId).textContent = fmt(+e.target.value);
      paintRange(e.target);
      scheduleAll();
    });
  };
  bindRange("wm-blur", "blur", "out-blur", (v) => v);
  bindRange("wm-zoom", "zoom", "out-zoom", (v) => v + "%");
  bindRange("wm-blockw", "blockW", "out-blockw", (v) => v + "%");
  // 字号比例：滑杆 + 自定义数值双向同步
  $("wm-size").addEventListener("input", (e) => {
    state.size = +e.target.value;
    $("out-size").textContent = state.size + "%";
    $("wm-size-custom").value = state.size;
    paintRange(e.target);
    scheduleAll();
  });
  $("wm-size-custom").addEventListener("input", (e) => {
    const v = Math.min(Math.max(+e.target.value || 100, 20), 500);
    state.size = v;
    $("out-size").textContent = v + "%";
    $("wm-size").value = Math.min(v, 400);
    paintRange($("wm-size"));
    scheduleAll();
  });
  $("wm-alignh").addEventListener("change", (e) => {
    state.alignH = e.target.value;
    scheduleAll();
  });
  $("wm-alignv").addEventListener("change", (e) => {
    state.alignV = e.target.value;
    scheduleAll();
  });
  $("wm-labels").addEventListener("change", (e) => {
    state.showLabels = e.target.checked;
    scheduleAll();
  });

  // EXIF / 随机
  $("auto-exif").addEventListener("change", (e) => {
    state.autoExif = e.target.checked;
    scheduleAutoSave();
  });
  $("btn-random").addEventListener("click", randomParams);
  $("btn-reset").addEventListener("click", resetAll);

  // 导出
  $("wm-format").addEventListener("change", (e) => {
    state.format = e.target.value;
    syncControls();
    scheduleAll();
  });
  $("wm-quality").addEventListener("input", (e) => {
    state.quality = +e.target.value / 100;
    $("out-quality").textContent = e.target.value;
    paintRange(e.target);
    scheduleAutoSave();
  });
  $("wm-scale").addEventListener("change", (e) => {
    state.scaleOpt = e.target.value;
    updateInfo();
    scheduleAutoSave();
  });
  $("btn-export").addEventListener("click", exportCurrent);
  $("btn-export-batch").addEventListener("click", exportBatch);
  $("btn-cancel-batch").addEventListener("click", () => {
    state.cancelBatch = true;
  });

  // 预设
  $("btn-preset-load").addEventListener("click", () => {
    const v = $("wm-preset").value;
    if (!v) return;
    const [kind, name] = v.split(/:(.+)/);
    const p = kind === "builtin" ? BUILTIN_PRESETS[name] : getSavedPresets()[name];
    if (p) applyPreset(p);
  });
  $("btn-preset-save").addEventListener("click", () => {
    const name = prompt("给这个预设起个名字：", "我的预设");
    if (!name) return;
    const saved = getSavedPresets();
    saved[name] = serializeState();
    setSavedPresets(saved);
    refreshPresetSelect();
    $("wm-preset").value = "saved:" + name;
  });
  $("btn-preset-del").addEventListener("click", () => {
    const v = $("wm-preset").value;
    if (!v || !v.startsWith("saved:")) {
      alert("内置预设不能删除，请先选择一个“我的预设”");
      return;
    }
    const name = v.slice(6);
    const saved = getSavedPresets();
    delete saved[name];
    setSavedPresets(saved);
    refreshPresetSelect();
  });
  $("btn-preset-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(serializeState(), null, 2)], { type: "application/json" });
    downloadBlob(blob, "tomatttooo-水印预设.json");
  });
  $("btn-preset-import").addEventListener("click", () => $("preset-file").click());
  $("preset-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        applyPreset(JSON.parse(fr.result));
      } catch (err) {
        alert("预设文件格式不对");
      }
    };
    fr.readAsText(f);
  });

  // 按住看原图
  const origBtn = $("btn-orig");
  const showOrig = () => {
    if (!state.orig) return;
    canvas.width = state.imgW;
    canvas.height = state.imgH;
    ctx.drawImage(state.orig, 0, 0);
  };
  origBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    showOrig();
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
    origBtn.addEventListener(ev, () => renderNow())
  );

  // 快捷键
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      exportCurrent();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      exportBatch();
    }
  });
}

/* ============================================
   启动
   ============================================ */

function buildTemplateGrid() {
  const grid = $("template-grid");
  STYLE_LIST.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "template-card";
    btn.dataset.style = s.key;
    btn.innerHTML = `<canvas class="template-swatch" width="104" height="128"></canvas><span><strong>${s.label}</strong><small>${s.desc}</small></span>`;
    btn.addEventListener("click", () => selectStyle(s.key));
    grid.appendChild(btn);
  });
  templateCards = [...grid.querySelectorAll(".template-card")];
}

function init() {
  bindEvents();
  buildTemplateGrid();
  loadBrandAvatar();
  restoreAutoSave();
  refreshPresetSelect();
  goStep(state.step || 1);
  syncControls();
  // 预加载当前选中字体，保证首次渲染即用新字体
  const fam = (FONTS[state.font].match(/^"([^"]+)"/) || [])[1];
  if (fam && document.fonts && document.fonts.load) {
    document.fonts
      .load(`400 16px "${fam}"`, "tomatttooo 相机 镜头 123")
      .then(() => scheduleAll());
  }
  renderMinis();
  updateInfo();
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", init);
