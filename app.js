/* ============================================================
   임하은 포트폴리오 — 인터랙션
   ============================================================ */
(function () {
  "use strict";

  /* ---------- THEME TOGGLE (light default / dark) ---------- */
  let darkMode = document.documentElement.getAttribute("data-theme") === "dark";
  (function () {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      darkMode = !darkMode;
      if (darkMode) document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem("portfolio-theme", darkMode ? "dark" : "light"); } catch (e) {}
    });
  })();

  /* ---------- TAB NAVIGATION ---------- */
  const tabBtns = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  function showTab(id, push) {
    tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
    panels.forEach((p) => p.classList.toggle("active", p.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
    runReveal();
    if (push) history.replaceState(null, "", "#" + id);
  }
  tabBtns.forEach((b) =>
    b.addEventListener("click", () => showTab(b.dataset.tab, true))
  );
  // any in-page link with data-goto
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) { e.preventDefault(); showTab(g.dataset.goto, true); }
  });

  const initial = (location.hash || "").replace("#", "");
  if (initial && document.getElementById(initial)) showTab(initial, false);

  /* ---------- SCROLL REVEAL (visible by default, hide only off-screen) ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.remove("pending"); io.unobserve(en.target); }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -4% 0px" }
  );
  function inViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < (window.innerHeight || 800) * 0.96 && r.bottom > -40;
  }
  function runReveal() {
    document.querySelectorAll(".panel.active .reveal").forEach((el, i) => {
      if (inViewport(el)) {
        el.classList.remove("pending"); // already on screen → stay visible
      } else if (!el.dataset.revealed) {
        el.style.transitionDelay = Math.min((i % 6) * 55, 300) + "ms";
        el.classList.add("pending");
        el.dataset.revealed = "1";
        io.observe(el);
      }
    });
  }
  // robust fallback: reveal any pending element that has scrolled into view
  function checkReveals() {
    document.querySelectorAll(".panel.active .reveal.pending").forEach((el) => {
      if (inViewport(el)) { el.classList.remove("pending"); io.unobserve(el); }
    });
  }
  let revealRAF = 0;
  window.addEventListener("scroll", () => {
    cancelAnimationFrame(revealRAF);
    revealRAF = requestAnimationFrame(checkReveals);
    checkReveals(); // direct call too, in case rAF is throttled
  }, { passive: true });
  window.addEventListener("resize", checkReveals, { passive: true });

  /* ---------- ACCORDIONS ---------- */
  document.addEventListener("click", (e) => {
    const head = e.target.closest(".detail-head");
    if (head) head.parentElement.classList.toggle("open");
  });

  /* ---------- CARD TILT (subtle 3D) ---------- */
  function attachTilt() {
    const cards = document.querySelectorAll("[data-tilt]");
    cards.forEach((card) => {
      card.style.transformStyle = "preserve-3d";
      card.addEventListener("mouseenter", () => {
        // snappy transition while hovering so tilt follows the cursor immediately
        card.style.transition = "transform .12s ease-out";
      });
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "";
        card.style.transform = "";
      });
    });
  }
  attachTilt();

  /* ---------- HERO: ambient dust + faint network (right-weighted) ---------- */
  const canvas = document.getElementById("node-canvas");
  if (canvas) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    let W, H, DPR;
    const mouse = { x: -9999, y: -9999 };
    let dots = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }

    function build() {
      dots = [];
      const count = Math.max(30, Math.min(108, Math.floor((W * H) / 12500)));
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          r: 0.4 + Math.random() * 0.9,
          warm: Math.random() < 0.16,
        });
      }
    }

    // gentle full-width falloff: faint on the left, a touch denser on the right,
    // ramped across the whole hero so there is no visible boundary
    function depth(x) {
      const t = (x / W - 0.06) / 0.86;
      const s = t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
      return 0.42 + 0.58 * s;
    }

    function step() {
      ctx.clearRect(0, 0, W, H);

      if (!reduce) {
        dots.forEach((d) => {
          d.x += d.vx; d.y += d.vy;
          if (d.x < -12) d.x = W + 12; else if (d.x > W + 12) d.x = -12;
          if (d.y < -12) d.y = H + 12; else if (d.y > H + 12) d.y = -12;
          const dx = d.x - mouse.x, dy = d.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90) { d.x += (dx / dist) * 0.35; d.y += (dy / dist) * 0.35; }
        });
      }

      // faint, thin links — very low opacity, gently fading toward the left
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dd = Math.hypot(a.x - b.x, a.y - b.y);
          if (dd < 92) {
            const sa = Math.min(depth(a.x), depth(b.x));
            const op = (1 - dd / 92) * (darkMode ? 0.045 : 0.06) * sa;
            ctx.strokeStyle = darkMode
              ? `rgba(173,196,228,${op})`
              : `rgba(70,95,135,${op})`;
            ctx.lineWidth = 0.55;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      // drifting dust
      dots.forEach((d) => {
        const sa = depth(d.x);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.warm
          ? (darkMode ? `rgba(245,179,80,${0.34 * sa})` : `rgba(217,119,6,${0.40 * sa})`)
          : (darkMode ? `rgba(196,212,235,${0.28 * sa})` : `rgba(70,95,135,${0.34 * sa})`);
        ctx.fill();
      });

      if (!reduce) requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    document.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    resize();
    step();
  }

  /* ---------- HERO viz: Pub/Sub topology card ---------- */
  (function () {
    const vc = document.getElementById("viz-canvas");
    if (!vc) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = vc.getContext("2d");
    const SUBS = 6;
    let W, H, DPR, cx, cy, R, angle = 0, bt = 0, evt = 0;
    let packets = [];
    const flash = new Array(SUBS).fill(0);
    const counter = document.getElementById("viz-count");

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = vc.getBoundingClientRect();
      W = rect.width; H = rect.height || 240;
      vc.width = W * DPR; vc.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2; cy = H / 2;
      R = Math.min(W, H) * 0.37;
    }
    function subPos(i) {
      const a = angle + (i / SUBS) * Math.PI * 2;
      return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
    }
    function broadcast() {
      for (let i = 0; i < SUBS; i++) packets.push({ i, t: 0, speed: 0.02 + Math.random() * 0.012 });
      evt += SUBS;
      if (counter) counter.textContent = evt;
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      angle += 0.0016;

      // edges
      for (let i = 0; i < SUBS; i++) {
        const p = subPos(i);
        ctx.strokeStyle = "rgba(245,158,11,0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke();
      }

      if (!reduce) {
        if (++bt > 108) { bt = 0; broadcast(); }
        packets = packets.filter((p) => p.t < 1);
        packets.forEach((p) => {
          p.t += p.speed;
          const tp = subPos(p.i);
          const x = cx + (tp.x - cx) * p.t;
          const y = cy + (tp.y - cy) * p.t;
          if (p.t >= 1) flash[p.i] = 1;
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#FBBF24";
          ctx.shadowColor = "rgba(251,191,36,0.9)"; ctx.shadowBlur = 10;
          ctx.fill(); ctx.shadowBlur = 0;
        });
      }

      // subscribers
      for (let i = 0; i < SUBS; i++) {
        const p = subPos(i), f = flash[i];
        if (f > 0) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 17);
          g.addColorStop(0, `rgba(245,158,11,${0.5 * f})`);
          g.addColorStop(1, "rgba(245,158,11,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, Math.PI * 2); ctx.fill();
          flash[i] = Math.max(0, f - 0.035);
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = f > 0.1 ? "#FBBF24" : "rgba(194,207,227,0.6)";
        ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(194,207,227,0.25)"; ctx.stroke();
      }

      // publisher (center)
      const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
      pg.addColorStop(0, "rgba(245,158,11,0.85)");
      pg.addColorStop(1, "rgba(245,158,11,0)");
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fillStyle = "#FBBF24"; ctx.fill();

      requestAnimationFrame(frame);
    }
    window.addEventListener("resize", resize);
    resize();
    if (reduce) broadcast();
    frame();
  })();

  /* ---------- global click burst ---------- */
  (function () {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const x = e.clientX, y = e.clientY;
      const ring = document.createElement("div");
      ring.className = "click-ring";
      ring.style.left = x + "px"; ring.style.top = y + "px";
      document.body.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove());
      if (reduce) return;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const s = document.createElement("div");
        s.className = "click-spark";
        s.style.left = x + "px"; s.style.top = y + "px";
        document.body.appendChild(s);
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 20 + Math.random() * 18;
        const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
        s.animate(
          [
            { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 },
          ],
          { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)" }
        ).onfinish = () => s.remove();
      }
    });
  })();

  /* ---------- tech icon fallback ---------- */
  document.querySelectorAll(".tech-chip img").forEach((img) => {
    img.addEventListener("error", () => {
      const label = img.dataset.fallback || "•";
      const span = document.createElement("span");
      span.className = "fallback-ic";
      span.textContent = label;
      img.replaceWith(span);
    });
  });

  /* ---- EMAIL: copy to clipboard + toast (mailto still fires) ---- */
  (function () {
    const emailLink = document.querySelector('.contact-link.primary[href^="mailto:"]');
    if (!emailLink) return;
    let toast;
    function showToast(msg) {
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "copy-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add("show");
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
    }
    emailLink.addEventListener("click", () => {
      const addr = emailLink.getAttribute("href").replace("mailto:", "");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).catch(() => {});
      }
      showToast("이메일 주소가 복사되었습니다 · " + addr);
    });
  })();

  /* initial reveal */
  runReveal();
})();
