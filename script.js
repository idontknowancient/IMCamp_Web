(function () {
  "use strict";

  const STORAGE_KEY = "portfolio-theme";
  const SIDEBAR_KEY = "portfolio-sidebar";
  const appShell = document.getElementById("app-shell");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const themeToggle = document.getElementById("theme-toggle");
  const yearEl = document.getElementById("year");

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }

  function getPreferredTheme() {
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "切換為深色主題" : "切換為淺色主題"
      );
    }
  }

  function initTheme() {
    const stored = getStoredTheme();
    const theme =
      stored === "light" || stored === "dark" ? stored : getPreferredTheme();
    applyTheme(theme);
  }

  function toggleTheme() {
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    setStoredTheme(next);
  }

  function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function closeMobileSidebar() {
    if (!appShell) return;
    appShell.classList.remove("is-sidebar-open");
    if (sidebarBackdrop) {
      sidebarBackdrop.hidden = true;
    }
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
    }
  }

  function openMobileSidebar() {
    if (!appShell) return;
    appShell.classList.add("is-sidebar-open");
    if (sidebarBackdrop) {
      sidebarBackdrop.hidden = false;
    }
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "true");
    }
  }

  function initSidebarState() {
    if (!appShell) return;

    if (isMobile()) {
      closeMobileSidebar();
      return;
    }

    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      if (stored === "collapsed") {
        appShell.classList.add("is-sidebar-collapsed");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
      } else {
        appShell.classList.remove("is-sidebar-collapsed");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
      }
    } catch {
      /* ignore */
    }
  }

  function toggleSidebar() {
    if (!appShell) return;

    if (isMobile()) {
      if (appShell.classList.contains("is-sidebar-open")) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
      return;
    }

    appShell.classList.toggle("is-sidebar-collapsed");
    const collapsed = appShell.classList.contains("is-sidebar-collapsed");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    }
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
    } catch {
      /* ignore */
    }
  }

  function initMenuToggle() {
    if (!menuToggle || !appShell) return;

    menuToggle.addEventListener("click", toggleSidebar);

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener("click", closeMobileSidebar);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileSidebar();
    });

    window.addEventListener("resize", function () {
      if (!isMobile()) {
        closeMobileSidebar();
        initSidebarState();
      } else {
        appShell.classList.remove("is-sidebar-collapsed");
      }
    });
  }

  function setActiveNav(sectionId) {
    const links = document.querySelectorAll(".sidebar-link[data-nav]");
    links.forEach(function (link) {
      const nav = link.getAttribute("data-nav");
      link.classList.toggle("is-active", nav === sectionId);
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll("[data-section]");
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.getAttribute("data-section"));
          }
        });
      },
      { root: null, rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function smoothScrollTo(target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    closeMobileSidebar();
    if (history.replaceState) {
      history.replaceState(null, "", "#" + target.id);
    }
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll(
      'a[href^="#"]:not([href="#"])'
    );
    links.forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const id = anchor.getAttribute("href");
        if (!id) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        smoothScrollTo(target);
      });
    });
  }

  function initReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initYear() {
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }
    initSidebarState();
    initMenuToggle();
    initSmoothScroll();
    initScrollSpy();
    initReveal();
    initYear();
  });
})();
