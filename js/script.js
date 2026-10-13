document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("touchstart", function () {}, false);
  const burgerBtn = document.getElementById("burgerButton");
  const navMenu = document.getElementById("navMenu");

  burgerBtn.addEventListener("click", () => {
    navMenu.classList.toggle("open");
    burgerBtn.classList.toggle("open");
  });

  const links = document.querySelectorAll(".nav--list li a");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      for (let i = 0; i < links.length; i++)
        if (links[i] != link) links[i].parentNode.classList.remove("active");

      link.parentNode.classList.add("active");
    });
  });

  const analyzePhotoHints = document.querySelectorAll(".analyze__photo--hint");

  analyzePhotoHints.forEach((hint) => {
    hint.addEventListener("click", () => {
      hint.parentNode.parentNode.classList.toggle("closed");
    });
  });

  const isDesktop = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;

  const analyzeInfo = document.querySelector(".svg--wrapper");
  if (isDesktop) {
    analyzeInfo.classList.add("desktop");
  } else {
    analyzeInfo.addEventListener("click", () => {
      analyzeInfo.classList.toggle("hovered");
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target != analyzeInfo && e.target.parentNode != analyzeInfo) {
      analyzeInfo.classList.remove("hovered");
    }
  });

  const analyzeLinks = document.querySelectorAll("a.analyze--link");

  analyzeLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      for (let i = 0; i < analyzeLinks.length; i++)
        if (analyzeLinks[i] != link) analyzeLinks[i].classList.remove("active");

      link.classList.add("active");
    });
  });

  const ingList = document.getElementById("ingList");
  const ingBtn = document.getElementById("ingBtn");

  if (ingList.children.length > 5 && window.innerWidth < 1128) {
    ingList.parentNode.classList.add("exp");

    ingList.style.height = 168 + "px";
    ingList.style.maxHeight = "unset";

    ingBtn.addEventListener("click", () => {
      if (ingList.parentNode.classList.contains("opened")) {
        ingList.style.height = 168 + "px";
        ingList.parentNode.classList.remove("opened");
        ingBtn.querySelector("span").innerHTML = "More ingredients";
      } else {
        ingList.style.height = 36 * (ingList.children.length + 2) - 12 + "px";
        ingList.parentNode.classList.add("opened");
        ingBtn.querySelector("span").innerHTML = "Hide ingredients";
      }
    });
  }

  const allergens = document.getElementById("allergens");
  const mask = document.getElementById("mask");
  const popupAller = document.getElementById("popupIng");
  const popupClose = document.getElementById("popupClose");

  allergens.addEventListener("click", () => {
    mask.classList.remove("hide");
    popupAller.classList.remove("hide");
  });

  popupClose.addEventListener("click", () => {
    mask.classList.add("hide");
    popupAller.classList.add("hide");
  });

  mask.addEventListener("click", () => {
    mask.classList.add("hide");
    popupAller.classList.add("hide");
  });

  if (window.innerWidth >= 1128) {
    const anaLinks = document.querySelectorAll("a.analyze--link");

    anaLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        const dest = link.getAttribute("href").split("#")[1];

        const tar = document.getElementById(dest);

        tar.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    });

    window.addEventListener("wheel", () => {
      for (let i = 0; i < analyzeLinks.length; i++)
        analyzeLinks[i].classList.remove("active");
    });
  }
});

function hexToRgb(hex) {
  if (typeof hex !== "string") return [0, 0, 0];
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function colorAt(t, stops) {
  t = Math.max(0, Math.min(1, t));
  const last = stops.length - 1;
  const pos = t * last;
  const i = Math.min(Math.floor(pos), last - 1);
  const localT = pos - i;

  const c1 = stops[i];
  const c2 = stops[i + 1];
  if (!c1 || !c2) return c1 || c2 || "#22c55e";

  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);

  return `rgb(${Math.round(lerp(r1, r2, localT))}, ${Math.round(
    lerp(g1, g2, localT),
  )}, ${Math.round(lerp(b1, b2, localT))})`;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateRing({
  bar,
  valueEl,
  target = 0.84,
  from = 0,
  colorStops,
  radius = 66,
  duration = 2000,
  reverse = false,
  displayValue = null,
}) {
  const C = 2 * Math.PI * radius;

  bar.style.strokeDasharray = C;
  bar.style.strokeDashoffset = C * (1 - from);
  bar.style.stroke = colorAt(reverse ? 1 - from : from, colorStops);

  const setValueText = (progress) => {
    if (!valueEl) return;
    if (displayValue != null && target > 0) {
      const current = Math.round(displayValue * (progress / target));
      valueEl.textContent = current;
    } else {
      valueEl.textContent = Math.round(progress * 100);
    }
  };

  setValueText(from);

  const start = performance.now();
  const delta = target - from;

  function frame(now) {
    const rawT = Math.min((now - start) / duration, 1);
    const eased = easeInOutCubic(rawT);
    const progress = from + delta * eased;

    if (progress > 0.1) {
      bar.style.strokeLinecap = "round";
    }

    bar.style.strokeDashoffset = C * (1 - progress);

    const colorT = reverse ? 1 - progress : progress;
    bar.style.stroke = colorAt(colorT, colorStops);

    setValueText(progress);

    if (rawT < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const GOOD_COLORS = [
  "#e63946",
  "#ef4444",
  "#f15a29",
  "#f97316",
  "#fb923c",
  "#fbbf24",
  "#facc15",
  "#a3d63d",
  "#7fc242",
  "#22c55e",
];

const BAD_COLORS = [...GOOD_COLORS].reverse();

/**
 * @param {string} selector
 * @param {number} value
 * @param {object} opts
 */
function initDiag(selector, value, opts = {}) {
  const {
    max = 100,
    colors,
    barSelector = ".progress-bar",
    valueSelector = ".utility--diag__value",
    ...rest
  } = opts;

  const root = document.querySelector(selector);
  if (!root) return;

  const bar = root.querySelector(barSelector);
  const valueEl = root.querySelector(valueSelector);
  if (!bar) return;

  const fraction = value / max;

  const displayValue = rest.displayValue != null ? rest.displayValue : value;

  animateRing({
    ...rest,
    bar,
    valueEl,
    target: fraction,
    colorStops: colors,
    displayValue,
  });
}

window.addEventListener("load", () => {
  initDiag("#diag", 84, {
    max: 100,
    colors: GOOD_COLORS,
  });

  const NUT_MAX = 2000;
  const NUT_TARGET = 0.72;

  initDiag("#diag-nutrition", NUT_TARGET * NUT_MAX, {
    max: NUT_MAX,
    colors: BAD_COLORS,
    reverse: false,
    barSelector: ".nutrition--circle--bar",
    valueSelector: "#nut_value",
    displayValue: NUT_TARGET * NUT_MAX,
  });
});
