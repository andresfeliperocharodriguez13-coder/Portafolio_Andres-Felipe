"use strict";

// Marca que JS está activo (los estilos de animación dependen de esto)
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  /* ---------- Año del footer ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Foto: si no carga, muestra las iniciales ---------- */
  const photo = document.getElementById("photo");
  const photoImg = photo && photo.querySelector("img");
  if (photoImg) {
    const showFallback = () => photo.classList.add("no-photo");
    photoImg.addEventListener("error", showFallback);
    if (photoImg.complete && photoImg.naturalWidth === 0) showFallback();
  }

  /* ---------- Menú móvil ---------- */
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu");

  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };

  toggle.addEventListener("click", () =>
    setMenu(toggle.getAttribute("aria-expanded") !== "true")
  );
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- Aparición al hacer scroll (con escalonado) ---------- */
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    [...group.children].forEach((child, i) => {
      if (child.hasAttribute("data-reveal")) {
        child.style.setProperty("--d", `${Math.min(i * 0.08, 0.6)}s`);
      }
    });
  });

  document.querySelectorAll(".timeline").forEach((tl) => {
    [...tl.children].forEach((child, i) => {
      child.style.setProperty("--d", `${i * 0.12}s`);
    });
  });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (hasIO && !reduceMotion) {
    // Sin unobserve: la animación se repite cada vez que el elemento
    // entra o sale de pantalla, al subir y al bajar.
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("visible", entry.isIntersecting);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Enlace activo según la sección visible ---------- */
  const links = document.querySelectorAll(".nav a");
  const sections = [...links]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (hasIO) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            const active = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  /* ---------- Pestañas Experiencia / Formación ---------- */
  const tabs = [...document.querySelectorAll(".tab")];
  const indicator = document.querySelector(".tab-indicator");

  const moveIndicator = () => {
    const active = tabs.find((t) => t.classList.contains("active"));
    if (!active || !indicator) return;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  };

  const selectTab = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    moveIndicator();

    updateTimelines();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length], true);
      if (e.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- Línea de tiempo: se llena al hacer scroll ---------- */
  const timelines = document.querySelectorAll(".timeline");

  function updateTimelines() {
    const vh = window.innerHeight;
    timelines.forEach((tl) => {
      const rect = tl.getBoundingClientRect();
      if (rect.height === 0) return; // panel oculto
      const p = (vh * 0.65 - rect.top) / rect.height;
      tl.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
    });
  }

  /* ---------- Barra de progreso + línea de tiempo (scroll) ---------- */
  const progress = document.querySelector(".progress");
  let ticking = false;

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    updateTimelines();
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    moveIndicator();
    onScroll();
  });
  window.addEventListener("load", () => {
    moveIndicator();
    onScroll();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
  moveIndicator();
  onScroll();

  /* ---------- Brillo que sigue al cursor (solo con mouse) ---------- */
  const glow = document.querySelector(".cursor-glow");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (glow && finePointer && !reduceMotion) {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let gx = x;
    let gy = y;

    window.addEventListener(
      "pointermove",
      (e) => {
        x = e.clientX;
        y = e.clientY;
        glow.classList.add("on");
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", () => glow.classList.remove("on"));

    // Movimiento suavizado (sigue al cursor con un pequeño retraso)
    const follow = () => {
      gx += (x - gx) * 0.12;
      gy += (y - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- Luz dentro de las tarjetas de proyecto ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".project").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    });
  }
});