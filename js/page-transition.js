/* ============================================
   tomatttooo · 页面切换动画
   入场：黑幕揭开 + 内容上浮
   离场：点击站内链接淡出后再跳转
   ============================================ */
(function () {
  // 入场黑幕
  const veil = document.createElement("div");
  veil.className = "page-veil";
  veil.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:#070709;opacity:1;" +
    "transition:opacity 0.45s ease;pointer-events:none;";
  document.body.appendChild(veil);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      veil.style.opacity = "0";
      setTimeout(() => veil.remove(), 500);
    })
  );

  // 内容上浮入场
  const main = document.querySelector("main");
  if (main) {
    const st = document.createElement("style");
    st.textContent =
      "@keyframes pageIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}";
    document.head.appendChild(st);
    main.style.animation = "pageIn 0.55s cubic-bezier(0.3, 0.9, 0.3, 1) both";
  }

  // 离场：站内链接淡出后跳转
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href) return;
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("http") ||
      href.startsWith("javascript:") ||
      a.target === "_blank" ||
      e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
    ) {
      return;
    }
    e.preventDefault();
    veil.style.pointerEvents = "auto";
    veil.style.opacity = "1";
    setTimeout(() => {
      location.href = href;
    }, 350);
  });
})();
