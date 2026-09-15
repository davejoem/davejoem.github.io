/* =========================================================
   davejoem.github.io — main.js
   Theme, nav, reveals, counters. Vanilla JS, no deps.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-toggle");
  var stored = null;
  try { stored = localStorage.getItem("dj-theme"); } catch (e) { /* ignore */ }

  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", theme);

  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("dj-theme", t); } catch (e) { /* ignore */ }
  }

  if (themeBtn) {
    themeBtn.setAttribute("aria-pressed", theme === "light" ? "false" : "true");
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      themeBtn.setAttribute("aria-pressed", next === "light" ? "false" : "true");
    });
  }

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("header");
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById("nav-burger");
  var menu = document.getElementById("mobile-menu");
  function closeMenu() {
    if (!burger || !menu) return;
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) closeMenu();
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Animated counters ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target || reduceMotion) { el.textContent = target; return; }
    var dur = 1400;
    var start = performance.now();
    function frame(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll(".count[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Active nav on scroll (scrollspy) ---------- */
  var navLinks = document.querySelectorAll(".nav-links a");
  var spied = new Map();
  navLinks.forEach(function (a) {
    var id = (a.getAttribute("href") || "").replace(/^#/, "");
    if (id) spied.set(id, a);
  });
  if (spied.size && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = spied.get(entry.target.id);
        if (a && entry.isIntersecting) {
          navLinks.forEach(function (x) { x.classList.remove("active"); });
          a.classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    spied.forEach(function (_, id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();