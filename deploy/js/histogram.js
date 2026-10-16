/* ============================================
   tomatttooo · 直方图查看器
   亮度 + RGB 三通道分布，曝光统计
   ============================================ */

const $ = (id) => document.getElementById(id);

const hist = $("hist");
const hctx = hist.getContext("2d");

function compute(img) {
  const c = document.createElement("canvas");
  const s = 800;
  const ar = img.naturalWidth / img.naturalHeight;
  c.width = ar >= 1 ? s : Math.max(24, Math.round(s * ar));
  c.height = ar >= 1 ? Math.max(24, Math.round(s / ar)) : s;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0, c.width, c.height);
  const d = x.getImageData(0, 0, c.width, c.height).data;

  const bR = new Uint32Array(256);
  const bG = new Uint32Array(256);
  const bB = new Uint32Array(256);
  const bL = new Uint32Array(256);
  let sum = 0, n = 0, low = 0, high = 0;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    bR[r]++; bG[g]++; bB[b]++; bL[l]++;
    sum += l;
    n++;
    if (l <= 2) low++;
    if (l >= 252) high++;
  }
  return {
    bR, bG, bB, bL,
    mean: n ? Math.round(sum / n) : 0,
    lowPct: n ? Math.round((low / n) * 1000) / 10 : 0,
    highPct: n ? Math.round((high / n) * 1000) / 10 : 0,
    px: n,
  };
}

function drawHist(r) {
  const W = hist.width, H = hist.height;
  hctx.clearRect(0, 0, W, H);
  // 背景网格
  hctx.strokeStyle = "rgba(255,255,255,0.06)";
  hctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    hctx.beginPath();
    hctx.moveTo(0, (H / 4) * i);
    hctx.lineTo(W, (H / 4) * i);
    hctx.stroke();
  }
  const maxN = Math.max(
    1,
    Math.max(...r.bL),
    Math.max(...r.bR),
    Math.max(...r.bG),
    Math.max(...r.bB)
  );
  const draw = (bins, color) => {
    hctx.beginPath();
    hctx.moveTo(0, H);
    for (let i = 0; i < 256; i++) {
      const v = (bins[i] / maxN) * H;
      hctx.lineTo((i / 255) * W, H - v);
    }
    hctx.strokeStyle = color;
    hctx.lineWidth = 1.6;
    hctx.stroke();
  };
  draw(r.bR, "rgba(255,95,86,0.75)");
  draw(r.bG, "rgba(87,217,119,0.75)");
  draw(r.bB, "rgba(77,163,255,0.75)");
  draw(r.bL, "rgba(240,240,240,0.95)");
}

function renderStats(r) {
  $("stats").innerHTML = `
    <div class="hist-stat"><span>平均亮度</span><b>${r.mean} / 255</b></div>
    <div class="hist-stat"><span>采样像素</span><b>${r.px.toLocaleString()}</b></div>
    <div class="hist-stat"><span>欠曝（死黑）</span><b>${r.lowPct}%</b></div>
    <div class="hist-stat"><span>过曝（死白）</span><b>${r.highPct}%</b></div>`;
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    // 照片预览
    const pv = document.getElementById("preview");
    if (pv) {
      const s = 800;
      const ar = im.naturalWidth / im.naturalHeight;
      pv.width = ar >= 1 ? s : Math.max(24, Math.round(s * ar));
      pv.height = ar >= 1 ? Math.max(24, Math.round(s / ar)) : s;
      pv.getContext("2d").drawImage(im, 0, 0, pv.width, pv.height);
    }

    const r = compute(im);
    const dpr = window.devicePixelRatio || 1;
    const w = hist.clientWidth || 700;
    hist.width = Math.round(w * dpr);
    hist.height = Math.round(240 * dpr);
    drawHist(r);
    renderStats(r);
    $("stage").style.display = "";
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
  ["dragover", "drop"].forEach((ev) =>
    window.addEventListener(ev, (e) => e.preventDefault())
  );
  window.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
  });
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
