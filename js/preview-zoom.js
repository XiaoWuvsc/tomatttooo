/* ============================================
   tomatttooo · 预览缩放（水印工坊 / EXIF 查看器 / 画幅裁切共用）
   − ＋ 1:1 适应 按钮 · 滚轮缩放（光标锚点） · 双击切换 1:1/适应
   放大后隐藏滚动条，按住拖动平移
   ============================================ */
(function () {
  function init() {
    const stage = document.querySelector(".canvas-stage, .t-stage");
    if (!stage) return;
    const canvas = stage.querySelector("canvas");
    if (!canvas) return;
    const wrap = canvas.parentElement;

    let mode = "fit"; // "fit" | 缩放倍数
    let fitScale = 1;  // 适应窗口时的显示比例（缩放下限）

    const bar = document.createElement("div");
    bar.className = "zoom-bar";
    bar.innerHTML = `
      <button type="button" data-z="out" title="缩小（滚轮）">−</button>
      <span class="zoom-label">适应</span>
      <button type="button" data-z="in" title="放大（滚轮）">＋</button>
      <button type="button" data-z="one" title="实际大小（双击切换）">1:1</button>
      <button type="button" data-z="fit" title="适应窗口">适应</button>`;
    // 固定到屏幕右下角，随页面滚动始终可见
    document.body.appendChild(bar);
    bar.style.display = "none";
    const syncBarVisibility = () => {
      bar.style.display = stage.classList.contains("has-image") ? "" : "none";
    };
    syncBarVisibility();
    if (window.MutationObserver) {
      new MutationObserver(syncBarVisibility).observe(stage, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    const label = bar.querySelector(".zoom-label");
    const ready = () => stage.classList.contains("has-image") && canvas.width > 0;

    /* 供其他脚本判断当前是否处于放大状态（放大时拖动用于平移） */
    window.__zoomedIn = () => mode !== "fit" && ready();

    /* 放大后按住拖动平移（兼容无 Pointer 事件的旧浏览器） */
    const hasPointer = "PointerEvent" in window;
    const pDown = hasPointer ? "pointerdown" : "mousedown";
    const pMove = hasPointer ? "pointermove" : "mousemove";
    const pUps = hasPointer ? ["pointerup", "pointercancel"] : ["mouseup", "mouseleave"];
    let panning = false, px0 = 0, py0 = 0, sl0 = 0, st0 = 0;
    stage.addEventListener(pDown, (e) => {
      if (mode === "fit" || !ready()) return;
      if (e.target.closest && e.target.closest(".zoom-bar")) return;
      panning = true;
      px0 = e.clientX;
      py0 = e.clientY;
      sl0 = stage.scrollLeft;
      st0 = stage.scrollTop;
      if (hasPointer && stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      e.preventDefault();
    });
    stage.addEventListener(pMove, (e) => {
      if (!panning) return;
      stage.scrollLeft = sl0 - (e.clientX - px0);
      stage.scrollTop = st0 - (e.clientY - py0);
    });
    const endPan = () => {
      panning = false;
      canvas.style.cursor = mode === "fit" ? "" : "grab";
    };
    pUps.forEach((ev) => stage.addEventListener(ev, endPan));

    function currentScale() {
      if (!ready()) return 1;
      if (mode === "fit") return canvas.offsetWidth / canvas.width;
      return mode;
    }

    function setFit() {
      mode = "fit";
      fitScale = ready() ? canvas.offsetWidth / canvas.width : 1;
      canvas.style.width = "";
      canvas.style.maxWidth = "";
      canvas.style.maxHeight = "";
      canvas.style.margin = "";
      canvas.style.cursor = "";
      stage.style.display = "";
      stage.style.overflow = "";
      stage.scrollLeft = 0;
      stage.scrollTop = 0;
      if (wrap !== stage) {
        wrap.style.display = "";
        wrap.style.overflow = "";
      }
      label.textContent = "适应";
    }

    function setZoom(s) {
      if (!ready()) return;
      if (mode === "fit") fitScale = canvas.offsetWidth / canvas.width;
      const min = Math.min(Math.max(fitScale, 0.05), 4);
      const target = Math.min(Math.max(s, min), 4);
      // 缩回到适应比例时切回“适应”模式，恢复取景框/水印拖动等正常交互
      if (target <= min + 0.005) {
        setFit();
        return;
      }
      mode = target;
      stage.style.display = "block";
      stage.style.overflow = "hidden"; // 隐藏滚动条，用拖动平移
      if (wrap !== stage) {
        wrap.style.display = "block";
        wrap.style.overflow = "visible";
      }
      canvas.style.maxWidth = "none";
      canvas.style.maxHeight = "none";
      canvas.style.width = Math.round(canvas.width * mode) + "px";
      canvas.style.margin = "0 auto";
      canvas.style.cursor = "grab";
      label.textContent = Math.round(mode * 100) + "%";
    }

    function zoomBy(factor) {
      if (!ready()) return;
      const s = currentScale() * factor;
      if (s >= 0.97 && s <= 1.03) setZoom(1);
      else setZoom(s);
    }

    bar.querySelector('[data-z="in"]').addEventListener("click", () => zoomBy(1.25));
    bar.querySelector('[data-z="out"]').addEventListener("click", () => zoomBy(0.8));
    bar.querySelector('[data-z="one"]').addEventListener("click", () => setZoom(1));
    bar.querySelector('[data-z="fit"]').addEventListener("click", setFit);

    // 滚轮直接缩放（以光标为锚点，不跑偏）
    stage.addEventListener(
      "wheel",
      (e) => {
        if (!ready()) return;
        e.preventDefault();
        const rect = stage.getBoundingClientRect();
        const before = currentScale();
        const target = before * (e.deltaY < 0 ? 1.25 : 0.8);
        const cx = e.clientX - rect.left + stage.scrollLeft; // 光标在内容中的位置
        const cy = e.clientY - rect.top + stage.scrollTop;
        setZoom(target);
        const after = currentScale();
        stage.scrollLeft = (cx * after) / before - (e.clientX - rect.left);
        stage.scrollTop = (cy * after) / before - (e.clientY - rect.top);
      },
      { passive: false }
    );

    // 双击切换 1:1 / 适应（水印工坊拖动类样式下不启用，避免与拖动冲突）
    canvas.addEventListener("dblclick", () => {
      const allow = window.__zoomToggleAllowed || (() => true);
      if (!allow()) return;
      if (!ready()) return;
      if (mode === "fit") setZoom(1);
      else setFit();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
