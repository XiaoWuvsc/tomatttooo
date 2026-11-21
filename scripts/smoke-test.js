/* watermark.js 冒烟测试：Node 环境打桩后跑全部样式 + EXIF 解析 + ZIP */
const fs = require("fs");
const vm = require("vm");

const ctxStub = () => {
  const gradient = { addColorStop() {} };
  const stack = [{ tx: 0, ty: 0 }];
  const top = () => stack[stack.length - 1];
  const c = {
    canvas: { width: 0, height: 0 },
    save() { stack.push({ ...top() }); }, restore() { stack.pop(); },
    translate(dx, dy) { top().tx += dx; top().ty += dy; this.tx = top().tx; this.ty = top().ty; },
    rotate() {}, scale() {},
    drawImage(...a) { this.lastDraw = a; }, fillText() {}, strokeText() {}, fillRect() {}, clearRect() {},
    beginPath() {}, moveTo() {}, lineTo() {}, arcTo() {}, arc() {}, closePath() {},
    fill() {}, stroke() {}, clip() {},
    createLinearGradient() { return gradient; },
    measureText() { return { width: 10 }; },
    roundRect() {},
    font: "", textAlign: "", textBaseline: "",
    fillStyle: "", strokeStyle: "", lineWidth: 1, lineJoin: "",
    globalAlpha: 1, shadowColor: "", shadowBlur: 0, shadowOffsetY: 0,
    letterSpacing: "", filter: "",
  };
  return c;
};

const fakeCanvasEl = () => {
  const c = ctxStub();
  c.getContext = () => c;
  return c;
};

const el = () => ({
  getContext: () => ctxStub(),
  querySelector: () => ({ innerHTML: "", querySelector: () => ({ getContext: () => ctxStub(), width: 0, height: 0, style: {} }), style: {}, dataset: {} }),
  querySelectorAll: () => [],
  addEventListener() {}, appendChild() {}, insertBefore() {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  style: {}, dataset: {}, innerHTML: "", textContent: "",
  value: "", checked: false, hidden: false, disabled: false,
});

global.window = { BRAND_LOGO_FILES: {} };
global.document = {
  addEventListener() {},
  createElement: () => el(),
  getElementById: () => el(),
  querySelector: () => el(),
  querySelectorAll: () => [],
  fonts: { ready: Promise.resolve() },
};
global.localStorage = { getItem: () => null, setItem() {} };
global.requestAnimationFrame = (fn) => fn();
global.alert = () => {};
global.URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };
global.prompt = () => null;

const code = fs.readFileSync("E:/dswork/个人网站/js/watermark.js", "utf-8")
  + "\n;globalThis.__T = { renderScene, parseExif, crc32, zipStore, STYLE_LIST, state };";

vm.runInThisContext(code, { filename: "watermark.js" });

const { renderScene, parseExif, crc32, zipStore, STYLE_LIST, state } = globalThis.__T;

// 1) 全部样式渲染
const fakeImg = { naturalWidth: 1600, naturalHeight: 1067 };
let failed = 0;
for (const s of STYLE_LIST) {
  try {
    const c = ctxStub();
    renderScene(c, 800, 533, fakeImg, { ...state, style: s.key, logo: null, brandLogos: {} });
    console.log("render OK:", s.key, "->", c.canvas.width + "x" + c.canvas.height);
  } catch (e) {
    failed++;
    console.log("render FAIL:", s.key, e.message);
  }
}
// 无图渲染（迷你占位）
try {
  const c = ctxStub();
  renderScene(c, 120, 90, null, { ...state, style: "photosum" });
  console.log("render OK: photosum(无图)");
} catch (e) { failed++; console.log("render FAIL: photosum(无图)", e.message); }

// 3) 虚化参数卡：缩放 + 模糊渲染路径
{
  const c = ctxStub();
  renderScene(c, 800, 533, fakeImg, { ...state, style: "photosum", blur: 24, zoom: 130 });
  console.log("render OK: photosum(模糊24/缩放130)");
}

// 4) CRC + ZIP

// 2) EXIF 解析器
function buildExifBuf() {
  const make = "Canon";
  // TIFF：头 8 + IFD(2+12) + 下一IFD指针 4 + Make 数据
  const tiff = Buffer.alloc(26 + make.length + 1);
  tiff.write("II", 0, "ascii");
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);             // IFD0 偏移
  tiff.writeUInt16LE(1, 8);             // 1 个条目
  tiff.writeUInt16LE(0x010f, 10);       // Make
  tiff.writeUInt16LE(2, 12);            // ASCII
  tiff.writeUInt32LE(make.length + 1, 14);
  tiff.writeUInt32LE(26, 18);           // 数据偏移（紧跟指针区）
  tiff.writeUInt32LE(0, 22);            // 下一个 IFD = 0
  Buffer.from(make + "\0", "ascii").copy(tiff, 26);
  const app1 = Buffer.alloc(2 + 2 + 6 + tiff.length);
  app1.writeUInt16BE(0xffe1, 0);
  app1.writeUInt16BE(6 + tiff.length, 2);
  app1.write("Exif\0\0", 4, "ascii");
  tiff.copy(app1, 10);
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), app1, Buffer.from([0xff, 0xd9])]);
  return jpeg.buffer.slice(jpeg.byteOffset, jpeg.byteOffset + jpeg.byteLength);
}
const exif = parseExif(buildExifBuf());
console.log("EXIF:", exif && exif.make === "Canon" ? "OK make=Canon" : "FAIL " + JSON.stringify(exif));
if (!exif || exif.make !== "Canon") failed++;

// 3) 玻璃浮层：长文本芯片不越界
{
  const c = ctxStub();
  renderScene(c, 800, 533, fakeImg, { ...state, style: "minimal", posX: 95, posY: 95, camera: "Canon EOS R5 Mark II", lens: "RF 50mm · f/1.2", shutter: "1/200s", aperture: "f/1.2", iso: "100" });
  console.log("render OK: minimal(长文本)");
}

// 4) CRC + ZIP
const crc = crc32(new Uint8Array([1, 2, 3]));
console.log("CRC32([1,2,3]):", crc.toString(16), crc === 0x55bc801d ? "OK" : "FAIL");
if (crc !== 0x55bc801d) failed++;
const zip = zipStore([{ name: "测试.txt", data: new Uint8Array([104, 105]) }]);
console.log("ZIP size:", zip.size, zip.size > 100 ? "OK" : "FAIL");
if (zip.size <= 100) failed++;

console.log(failed === 0 ? "ALL TESTS PASSED" : failed + " TESTS FAILED");
process.exit(failed === 0 ? 0 : 1);
