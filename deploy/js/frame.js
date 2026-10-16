/* ============================================
   tomatttooo · 相框工具
   加边框 + 按比例出图，导出 100% JPG
   ============================================ */

const $ = (id) => document.getElementById(id);

const state = {
  img: null,
  border: 60,       // 导出时边框像素（基于长边 2000 换算）
  color: "#ffffff",
  ratio: "orig",
};

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

const RATIOS = {
  orig: 0,
  "1:1": 1,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "4:5": 4 / 5,
  "5:4": 5 / 4,
};

function drawFrame(c, base) {
  const iw = state.img.naturalWidth, ih = state.img.naturalHeight;
  // 照片先等比缩到 base 长边（预览与导出比例一致，预览不会出格）
  const s0 = base / Math.max(iw, ih);
  const pw = iw * s0, ph = ih * s0;
  const border = Math.round((state.border / 2000) * base);

  // 目标画布比例
  let W, H;
  if (state.ratio === "orig") {
    W = Math.round(pw) + border * 2;
    H = Math.round(ph) + border * 2;
  } else {
    const r = RATIOS[state.ratio];
    W = base;
    H = Math.round(base / r);
    if (H > 30000) {
      H = 30000;
      W = Math.round(H * r);
    }
  }

  c.canvas.width = W;
  c.canvas.height = H;
  c.fillStyle = state.color;
  c.fillRect(0, 0, W, H);

  // 照片等比放入（不裁切）
  const innerW = W - border * 2;
  const innerH = H - border * 2;
  const s = Math.min(innerW / pw, innerH / ph);
  const dw = pw * s, dh = ph * s;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.drawImage(state.img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return { W, H };
}

function renderPreview() {
  if (!state.img) return;
  drawFrame(ctx, 900);
  $("stage").classList.add("has-image");
}

function exportImage() {
  if (!state.img) return;
  const out = document.createElement("canvas");
  const c2 = out.getContext("2d");
  drawFrame(c2, 2400); // 导出基准 2400px 长边
  out.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tomatttooo-相框.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/jpeg", 1.0);
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    state.img = im;
    $("opts").hidden = false;
    $("actions").hidden = false;
    renderPreview();
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

  $("border").addEventListener("input", (e) => {
    state.border = +e.target.value;
    $("out-border").textContent = state.border;
    renderPreview();
  });
  document.querySelectorAll("#color-chips .t-chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.color = b.dataset.color;
      document.querySelectorAll("#color-chips .t-chip").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.color === state.color)
      );
      renderPreview();
    })
  );
  $("ratio").addEventListener("change", (e) => {
    state.ratio = e.target.value;
    renderPreview();
  });
  $("btn-export").addEventListener("click", exportImage);
  $("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bind);
