/* ============================================
   tomatttooo · Emoji → 内联 SVG 线性图标
   页面加载后自动把文本里的 Emoji 图标替换为 SVG
   （继承文字颜色 currentColor，1em 大小随字号缩放）
   ============================================ */
(function () {
  const ATTR =
    'class="emoji-icon" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" ' +
    'style="width:1em;height:1em;vertical-align:-0.15em;flex-shrink:0"';
  const svg = (inner) => `<svg ${ATTR}>${inner}</svg>`;

  const ICONS = {
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    camera: svg('<path d="M4 7h3l2-2.5h6L17 7h3v12H4z"/><circle cx="12" cy="13" r="4"/>'),
    clipboard: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    dice: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none"/>'),
    image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M3 17l5-5 4 4 3-3 6 6"/>'),
    crop: svg('<path d="M7 3v14h14"/><path d="M3 7h14v14"/>'),
    grid: svg('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
    compress: svg('<path d="M4 9V5a1 1 0 0 1 1-1h4"/><path d="M20 9V5a1 1 0 0 0-1-1h-4"/><path d="M4 15v4a1 1 0 0 0 1 1h4"/><path d="M20 15v4a1 1 0 0 1-1 1h-4"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    trash: svg('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
    box: svg('<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4"/><path d="M12 12v9"/>'),
    download: svg('<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M4 20h16"/>'),
    check: svg('<path d="M5 13l4 4L19 7"/>'),
    warn: svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5"/><circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none"/>'),
    convert: svg('<path d="M4 7h13l-3-3"/><path d="M20 17H7l3 3"/>'),
    palette: svg('<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 1.5-2s-1-1-1-1.8c0-1 1-1.6 2-1.6H17a4 4 0 0 0 4-4c0-4.8-4-8.6-9-8.6z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14" cy="7.5" r="1"/>'),
    histogram: svg('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M2 20h20"/>'),
    mosaic: svg('<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>'),
    rotate: svg('<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 3v4h-4"/>'),
    compare: svg('<path d="M8 5l-5 7 5 7"/><path d="M16 5l5 7-5 7"/>'),
      frame: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>'),
    eye: svg('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/>'),
  };

  /* Emoji → 图标映射（FE0F 变体选择符直接移除） */
  const MAP = {
    "⬜": ICONS.frame,
    "🔁": ICONS.rotate,
    "↔": ICONS.compare,
    "📊": ICONS.histogram,
    "🧱": ICONS.mosaic,
    "🔄": ICONS.convert,
    "🎨": ICONS.palette,
    "\u{1F50D}": ICONS.search,
    "\u{1F4F7}": ICONS.camera,
    "\u{1F4CB}": ICONS.clipboard,
    "\u{1F4E7}": ICONS.mail,
    "\u{1F3B2}": ICONS.dice,
    "\u{1F5BC}": ICONS.image,
    "\u2702": ICONS.crop,
    "\u{1F9E9}": ICONS.grid,
    "\u{1F5DC}": ICONS.compress,
    "\u{1F512}": ICONS.lock,
    "\u{1F5D1}": ICONS.trash,
    "\u{1F4E6}": ICONS.box,
    "\u2B07": ICONS.download,
    "\u2705": ICONS.check,
    "\u26A0": ICONS.warn,
    "\u{1F441}": ICONS.eye,
    "\uFE0F": "",
  };

  const RE = new RegExp(Object.keys(MAP).join("|"), "gu");

  const escapeHtml = (s) =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function sweep(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const txt = node.nodeValue || "";
      RE.lastIndex = 0;
      if (!RE.test(txt)) return;
      RE.lastIndex = 0;
      let html = "";
      let last = 0;
      let m;
      while ((m = RE.exec(txt))) {
        html += escapeHtml(txt.slice(last, m.index)) + MAP[m[0]];
        last = m.index + m[0].length;
      }
      html += escapeHtml(txt.slice(last));
      const holder = document.createElement("span");
      holder.className = "iconized";
      holder.style.cssText = "display:inline-flex;align-items:center;gap:4px;";
      holder.innerHTML = html;
      node.parentNode.replaceChild(holder, node);
    });
  }

  window.ICONS = ICONS;
  window.iconSweep = sweep;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => sweep());
  } else {
    sweep();
  }
})();
