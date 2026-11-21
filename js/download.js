/* ============================================
   tomatttooo · 统一下载助手 v2
   万能下载：target="_blank" + download
   - 支持下载的浏览器：直接下载，不弹新标签
   - 不支持/被拦截：在新标签页打开图片，当前页绝不跳转 blob
   ============================================ */
(function () {
  window.saveBlob = function (blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };
})();
