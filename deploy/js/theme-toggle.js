/* ============================================
   tomatttooo · 主题切换（液态玻璃 ⇄ 普通 UI）
   所有页面应用保存的主题；仅首页显示切换按钮
   ============================================ */
(function () {
  function init() {
    const link = document.getElementById("glass-css");
    if (!link) return;

    // 所有页面：应用保存的主题（默认玻璃）
    let glass = true;
    try {
      glass = localStorage.getItem("ui-theme") !== "classic";
    } catch (e) { /* 忽略 */ }
    link.disabled = !glass;

    // 仅首页显示切换按钮
    const path = (location.pathname || "").toLowerCase();
    if (!(path.endsWith("index.html") || path.endsWith("/"))) return;
    const footer = document.querySelector("footer");
    if (!footer) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.title = "切换界面主题";
    btn.style.cssText =
      "display:inline-flex;align-items:center;gap:4px;margin-left:12px;padding:4px 12px;" +
      "border:1px solid rgba(255,255,255,0.16);border-radius:999px;cursor:pointer;" +
      "background:rgba(255,255,255,0.05);" +
      "color:inherit;font:11px/1.6 Inter,'Microsoft YaHei',sans-serif;" +
      "opacity:0.75;transition:opacity 0.3s ease, transform 0.5s cubic-bezier(0.25,1.8,0.4,1);";
    footer.appendChild(btn);

    btn.addEventListener("mouseenter", () => { btn.style.opacity = "1"; });
    btn.addEventListener("mouseleave", () => { btn.style.opacity = "0.75"; });
    btn.addEventListener("mousedown", () => { btn.style.transform = "scale(0.96)"; });
    btn.addEventListener("mouseup", () => { btn.style.transform = "scale(1)"; });

    const apply = () => {
      link.disabled = !glass;
      btn.textContent = glass ? "主题：液态玻璃 beta" : "主题：普通 UI";
      btn.title = glass ? "点击切换到普通 UI" : "点击切换到液态玻璃";
      try {
        localStorage.setItem("ui-theme", glass ? "glass" : "classic");
      } catch (e) { /* 忽略 */ }
    };

    btn.addEventListener("click", () => {
      glass = !glass;
      apply();
    });

    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
