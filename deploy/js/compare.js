/* ============================================
   tomatttooo · 对比查看器
   两张照片滑块对比：拖动分割线左右切换
   ============================================ */

const $ = (id) => document.getElementById(id);

const state = { a: null, b: null, split: 0.5 };

const stage = $("stage");
const canvas = $("compare-canvas");
const ctx = canvas.getContext("2d");
const divider = $("divider");
const handle = $("handle");

function ready() {
  return state.a && state.b;
}

function render() {
  if (!ready()) return;
  // 两图按 contain 对齐到同一画布
  const W = 3840, H = 2400; // 导出分辨率：高清不糊
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const fit = (img) => {
    const s = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    return {
      w: img.naturalWidth * s,
      h: img.naturalHeight * s,
      x: (W - img.naturalWidth * s) / 2,
      y: (H - img.naturalHeight * s) / 2,
    };
  };

  // 左图（原图）：分割线左侧
  const ra = fit(state.a);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W * state.split, H);
  ctx.clip();
  ctx.drawImage(state.a, ra.x, ra.y, ra.w, ra.h);
  ctx.restore();

  // 右图（修改后）：分割线右侧
  const rb = fit(state.b);
  ctx.save();
  ctx.beginPath();
  ctx.rect(W * state.split, 0, W - W * state.split, H);
  ctx.clip();
  ctx.drawImage(state.b, rb.x, rb.y, rb.w, rb.h);
  ctx.restore();

  // 分割线
  divider.style.left = `calc(${state.split * 100}% - 1px)`;
  handle.style.left = `${state.split * 100}%`;
}

function setSplitFromEvent(e) {
  const r = stage.getBoundingClientRect();
  if (!r.width) return;
  state.split = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
  render();
}

function bindDrag() {
  const hasPointer = "PointerEvent" in window;
  const down = hasPointer ? "pointerdown" : "mousedown";
  const move = hasPointer ? "pointermove" : "mousemove";
  const ups = hasPointer ? ["pointerup", "pointercancel"] : ["mouseup", "mouseleave"];
  let dragging = false;

  stage.addEventListener(down, (e) => {
    if (!ready()) return;
    dragging = true;
    if (hasPointer && stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
    setSplitFromEvent(e);
  });
  stage.addEventListener(move, (e) => {
    if (dragging) setSplitFromEvent(e);
  });
  ups.forEach((ev) =>
    stage.addEventListener(ev, () => {
      dragging = false;
    })
  );
}

function loadSide(side, file) {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    state[side] = im;
    $(`label-${side}`).textContent = (file.name || "照片") + `（${im.naturalWidth}×${im.naturalHeight}）`;
    if (ready()) {
      stage.hidden = false;
      $("actions").hidden = false;
      render();
    }
  };
  im.src = url;
}

function exportImage() {
  if (!ready()) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tomatttooo-对比图.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

function bind() {
  const bindDrop = (dropId, fileId, side) => {
    const drop = $(dropId);
    drop.addEventListener("click", () => $(fileId).click());
    $(fileId).addEventListener("change", (e) => {
      loadSide(side, e.target.files[0]);
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
    drop.addEventListener("drop", (e) => loadSide(side, e.dataTransfer.files[0]));
  };
  bindDrop("drop-a", "file-a", "a");
  bindDrop("drop-b", "file-b", "b");

  $("btn-center").addEventListener("click", () => {
    state.split = 0.5;
    render();
  });
  $("btn-swap").addEventListener("click", () => {
    const t = state.a;
    state.a = state.b;
    state.b = t;
    const la = $("label-a").textContent;
    $("label-a").textContent = $("label-b").textContent;
    $("label-b").textContent = la;
    render();
  });
  $("btn-export").addEventListener("click", exportImage);
  $("year").textContent = new Date().getFullYear();
  bindDrag();
}

document.addEventListener("DOMContentLoaded", bind);
