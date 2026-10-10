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
});
