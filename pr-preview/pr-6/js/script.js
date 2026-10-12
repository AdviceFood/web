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
});
