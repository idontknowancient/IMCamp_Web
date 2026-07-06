(function () {
  "use strict";

  const STORAGE_KEY = "portfolio-theme";
  const SIDEBAR_KEY = "portfolio-sidebar";
  const appShell = document.getElementById("app-shell");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const themeToggle = document.getElementById("theme-toggle");
  const yearEl = document.getElementById("year");
  const backToTop = document.getElementById("back-to-top");
  const visitNumberEl = document.getElementById("visit-number");

  let leafletMap = null;
  let mapTileLayer = null;

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
    if (leafletMap) {
      leafletMap.invalidateSize();
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

  function initTypewriter() {
    const el = document.getElementById("typewriter-text");
    const cursor = document.querySelector(".typewriter-cursor");
    if (!el) return;

    const text = el.getAttribute("data-text") || "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = text;
      if (cursor) cursor.classList.add("is-done");
      return;
    }

    let index = 0;
    const delay = 120;

    function typeNext() {
      if (index < text.length) {
        el.textContent += text.charAt(index);
        index += 1;
        setTimeout(typeNext, delay);
      } else if (cursor) {
        cursor.classList.add("is-done");
      }
    }

    typeNext();
  }

  function initVisitorCount() {
    if (!visitNumberEl) return;

    const apiUrl =
      "https://api.counterapi.dev/v1/imcamp-portfolio/visits/up";

    fetch(apiUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(function (data) {
        if (typeof data.count === "number") {
          visitNumberEl.textContent = data.count.toLocaleString("zh-TW");
        }
      })
      .catch(function () {
        visitNumberEl.textContent = "—";
      });
  }

  const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  function updateMapTiles() {
    if (!leafletMap || typeof L === "undefined") return;

    if (mapTileLayer) {
      leafletMap.removeLayer(mapTileLayer);
    }

    mapTileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }
    ).addTo(leafletMap);
  }

  function initMap() {
    const container = document.getElementById("map-container");
    if (!container || typeof L === "undefined") return;

    const taipei101 = [25.0339, 121.5645];

    leafletMap = L.map(container, {
      scrollWheelZoom: false,
    }).setView(taipei101, 14);

    updateMapTiles();

    L.marker(taipei101)
      .addTo(leafletMap)
      .bindPopup("<strong>台北 101</strong><br>台北市信義區");

    const mapObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && leafletMap) {
            leafletMap.invalidateSize();
          }
        });
      },
      { threshold: 0.1 }
    );

    mapObserver.observe(container);
  }

  function initBackToTop() {
    if (!backToTop) return;

    const showThreshold = 320;

    function updateVisibility() {
      const shouldShow = window.scrollY > showThreshold;
      backToTop.hidden = !shouldShow;
      backToTop.classList.toggle("is-visible", shouldShow);
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
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
    initTypewriter();
    initVisitorCount();
    initMap();
    initBackToTop();
  });
})();
