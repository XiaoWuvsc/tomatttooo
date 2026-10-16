/* ============================================
   tomatttooo · 交互脚本
   导航 / 筛选 / 灯箱 / 滚动动效
   趣味功能：聚光灯 / 灵感生成 / 回到顶部
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initBurger();
  initReveal();
  initFilters();
  initLightbox();
  initYear();
  initSpotlight();
  initInspiration();
  initBackTop();
  initCopyEmail();
});

/* ---------- 导航栏滚动样式 + 高亮当前区块 ---------- */

function initNav() {
  const nav = document.getElementById("nav");
  const links = [...document.querySelectorAll(".nav__link")];
  const sections = links
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);

    const pos = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0];
    for (const sec of sections) {
      if (sec.offsetTop <= pos) current = sec;
    }
    links.forEach((l) =>
      l.classList.toggle("is-active", l.getAttribute("href") === `#${current.id}`)
    );
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- 移动端汉堡菜单 ---------- */

function initBurger() {
  const burger = document.getElementById("burger");
  const links = document.querySelector(".nav__links");

  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    links.classList.toggle("is-open");
  });

  links.addEventListener("click", (e) => {
    if (e.target.matches(".nav__link")) {
      burger.classList.remove("is-open");
      links.classList.remove("is-open");
    }
  });
}

/* ---------- 滚动显现动效 ---------- */

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- 作品分类筛选 ---------- */

function initFilters() {
  const filters = document.querySelectorAll(".filter");
  const cards = [...document.querySelectorAll(".card")];
  const search = document.getElementById("gallery-search");
  let currentFilter = "all";
  let query = "";

  const apply = () => {
    cards.forEach((card) => {
      const fOk = currentFilter === "all" || card.dataset.category === currentFilter;
      const title = (card.querySelector("h3") || { textContent: "" }).textContent.toLowerCase();
      const qOk = !query || title.includes(query);
      card.classList.toggle("is-hidden", !(fOk && qOk));
    });
  };

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.dataset.filter;
      apply();
    });
  });

  if (search) {
    search.addEventListener("input", () => {
      query = search.value.trim().toLowerCase();
      apply();
    });
  }
}

/* ============================================
   Web Audio：轻快提示音（无需音频文件）
   ============================================ */

let _ctx = null;

function getCtx() {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch (e) {
    return null;
  }
}

/* 轻快“啵”提示音 */
function playPop() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(660, t);
    o.frequency.exponentialRampToValueAtTime(990, t + 0.09);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.15);
  } catch (e) {
    /* 静默失败 */
  }
}

/* ---------- 灯箱（大图浏览 + EXIF） ---------- */

function initLightbox() {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lb-img");
  const cap = document.getElementById("lb-cap");
  const exif = document.getElementById("lb-exif");
  const allCards = [...document.querySelectorAll(".card")];

  let cards = [];
  let index = 0;
  let currentCard = null;

  /* 从图片文件名查真实 EXIF（js/photo-exif.js 生成），缺失回退卡片假数据 */
  function realExifOf(src) {
    const m = /([^/\\]+)\.\w+$/.exec(src || "");
    if (!m || !window.PHOTO_EXIF) return null;
    let name = m[1];
    try {
      name = decodeURIComponent(name);
    } catch (e) { /* 保持原样 */ }
    return window.PHOTO_EXIF[name] || null;
  }

  const fmtExp = (v) => (v == null ? "" : v >= 1 ? `${+v.toFixed(1)}s` : `1/${Math.round(1 / v)}s`);
  const fmtFnum = (v) => (v == null ? "" : `f/${(+v).toFixed(1)}`);
  const fmtFocal = (v) => (v == null ? "" : `${Math.round(v)}mm`);

  function update() {
    img.src = currentCard.querySelector("img").src;
    img.alt = currentCard.querySelector("img").alt;
    cap.textContent = currentCard.querySelector("figcaption").innerText.replace(/\n/g, " · ");

    const d = currentCard.dataset;
    const real = realExifOf(img.src);

    const iso = (real && real.iso) || d.iso;
    const shutter = (real && real.exp != null && real.exp > 0) ? fmtExp(real.exp) : d.shutter;
    const aperture = (real && real.fnum != null) ? fmtFnum(real.fnum) : d.aperture;
    const focal = (real && real.focal != null) ? fmtFocal(real.focal) : d.lens;

    exif.innerHTML = [
      `<span class="exif__item">ISO ${iso || "—"}</span>`,
      `<span class="exif__item">${shutter || "—"}</span>`,
      `<span class="exif__item">${aperture || "—"}</span>`,
      `<span class="exif__item">${focal || "—"}</span>`,
    ].join("");
  }

  function open(card) {
    // 只浏览当前筛选可见的照片
    cards = allCards.filter((c) => !c.classList.contains("is-hidden"));
    index = cards.indexOf(card);
    currentCard = card;
    update();
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function step(dir) {
    index = (index + dir + cards.length) % cards.length;
    currentCard = cards[index];
    update();
  }

  allCards.forEach((card) => card.addEventListener("click", () => open(card)));

  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", () => step(-1));
  document.getElementById("lb-next").addEventListener("click", () => step(1));

  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
}

/* ---------- 首屏鼠标聚光灯 ---------- */

function initSpotlight() {
  const hero = document.querySelector(".hero");
  const spot = document.getElementById("spotlight");
  if (!hero || !spot) return;
  if (!window.matchMedia("(hover: hover)").matches) return;

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    spot.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    spot.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  });
}

/* ---------- 拍摄灵感生成器 ---------- */

const CHALLENGES = [
  "用 50mm 定焦，拍一张只含一种颜色的照片",
  "找到一束光，等一个路人走进光里",
  "拍摄 5 张倒影：水面、玻璃、甚至一只勺子",
  "把镜头对准天花板，发现被忽略的几何",
  "用 1/4s 以下的慢门，拍一次车流光轨",
  "蹲下来，用猫的视角拍一条街",
  "只拍影子，不拍主体",
  "在家拍一组窗边的静物，只用自然光",
  "拍一扇有故事的门",
  "用广角拍一张夸张透视的自拍",
  "寻找 3 个撞色组合，把它们拍下来",
  "拍一张完全失焦的照片，试试它美不美",
  "记录同一天同一地点的 4 个时刻",
  "用微距拍一滴水珠里的世界",
  "夜晚出门，只拍霓虹灯的颜色",
  "拍一组背影，不露脸的人像",
  "找对称构图，拍一张完美对称的照片",
  "把相机放低到地面，拍一张极低机位照片",
  "拍一张黑白高对比度的街拍",
  "用逆光拍一次剪影",
  "拍吃完后的空盘与餐具，而不是食物",
  "抓拍一个正在笑的人",
  "拍一扇窗，窗外和窗内各占一半画面",
  "用长焦压缩空间，拍一栋楼与月亮",
];

function initInspiration() {
  const btn = document.getElementById("inspire-btn");
  const text = document.getElementById("inspire-text");
  let last = -1;

  btn.addEventListener("click", () => {
    let i;
    do {
      i = Math.floor(Math.random() * CHALLENGES.length);
    } while (i === last && CHALLENGES.length > 1);
    last = i;

    text.textContent = CHALLENGES[i];
    text.classList.remove("is-new");
    void text.offsetWidth; // 重置动画
    text.classList.add("is-new");
    playPop();
  });
}

/* ---------- 页脚年份 ---------- */

function initYear() {
  document.getElementById("year").textContent = new Date().getFullYear();
}

/* ---------- 回到顶部 ---------- */

function initBackTop() {
  const btn = document.createElement("button");
  btn.className = "back-top";
  btn.innerHTML = "↑";
  btn.title = "回到顶部";
  btn.setAttribute("aria-label", "回到顶部");
  document.body.appendChild(btn);

  const onScroll = () => {
    btn.classList.toggle("is-show", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- 复制邮箱 ---------- */

function initCopyEmail() {
  const btn = document.getElementById("copy-email");
  if (!btn) return;
  const EMAIL = "darcyshan@qq.com";

  btn.addEventListener("click", async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      ok = true;
    } catch (e) {
      // 剪贴板 API 不可用时回退
      try {
        const ta = document.createElement("textarea");
        ta.value = EMAIL;
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch (err) {
        ok = false;
      }
    }
    const prev = btn.textContent;
    btn.textContent = ok ? "已复制" : "请手动复制上方邮箱";
    setTimeout(() => {
      btn.textContent = prev;
    }, 1800);
  });
}
