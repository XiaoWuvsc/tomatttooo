/* ============================================
   tomatttooo · 色彩提取器
   主色调色板：量化像素 → 按占比排序 → 前 8 色
   点色块复制色值，一键复制全部
   ============================================ */

const $ = (id) => document.getElementById(id);

let palette = []; // [{hex, pct}]

function extract(img) {
  const c = document.createElement("canvas");
  const s = 160;
  const ar = img.naturalWidth / img.naturalHeight;
  c.width = ar >= 1 ? s : Math.max(24, Math.round(s * ar));
  c.height = ar >= 1 ? Math.max(24, Math.round(s / ar)) : s;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0, c.width, c.height);
  const d = x.getImageData(0, 0, c.width, c.height).data;

  const buckets = new Map();
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    // 4-bit 量化，减少相近色
    const r = (d[i] >> 4) << 4;
    const g = (d[i + 1] >> 4) << 4;
    const b = (d[i + 2] >> 4) << 4;
    const key = (r << 16) | (g << 8) | b;
    buckets.set(key, (buckets.get(key) || 0) + 1);
    total++;
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, n]) => ({
      hex: "#" + k.toString(16).padStart(6, "0"),
      pct: total ? Math.round((n / total) * 100) : 0,
    }));
}

function render() {
  const wrap = $("palette");
  wrap.innerHTML = "";
  palette.forEach((p) => {
    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.title = "点击复制 " + p.hex;
    sw.innerHTML =
      `<div class="swatch__color" style="background:${p.hex}"></div>` +
      `<div class="swatch__info"><b>${p.hex}</b><small>占比 ${p.pct}%</small></div>`;
    sw.addEventListener("click", () => copyText(p.hex, "已复制 " + p.hex));
    wrap.appendChild(sw);
  });
}

async function copyText(text, msg) {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand("copy");
      ta.remove();
    } catch (err) {
      ok = false;
    }
  }
  const notice = $("notice");
  notice.textContent = ok ? msg : "复制失败，请手动选择";
  notice.hidden = false;
  setTimeout(() => (notice.hidden = true), 1600);
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    palette = extract(im);
    render();
    // 预览缩略图
    const pv = $("preview");
    const s = 260;
    const ar = im.naturalWidth / im.naturalHeight;
    pv.width = s;
    pv.height = Math.max(120, Math.round(s / ar));
    pv.getContext("2d").drawImage(im, 0, 0, pv.width, pv.height);
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

  $("btn-copy-all").addEventListener("click", () => {
    if (!palette.length) return;
    copyText(palette.map((p) => p.hex).join(", "), "已复制全部色值");
  });
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
