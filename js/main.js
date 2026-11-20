/* global Swiper */

document.addEventListener("DOMContentLoaded", () => {
  const openComm = document.getElementById("openComm");
  const analyzeComment = document.getElementById("analyzeComment");

  openComm.addEventListener("click", () => {
    openComm.classList.add("hide");
    analyzeComment.classList.add("show");
  });

  if (window.innerWidth < 1024) {
    new Swiper(".swiper", {
      direction: "horizontal",
      slidesPerView: 1.1,
      spaceBetween: 10,
      autoplay: {
        delay: 3000,
        disableOnInteraction: true,
        pauseOnMouseEnter: true,
      },
      centeredSlides: true,
      breakpoints: {
        500: {
          slidesPerView: 1.5,
          centeredSlides: true,
        },
        800: {
          slidesPerView: 2,
          centeredSlides: false,
        },
      },
    });
  } else {
    const cards = document.querySelectorAll(".preview--slide");
const MAX_TILT = 12;

cards.forEach((card) => {
  const target = card.children[2];

  target.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
  target.style.boxShadow = `0px 0px 40px rgba(0,0,0,0.1)`;

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    const rotateX = (-y * MAX_TILT).toFixed(2);
    const rotateY = (x * MAX_TILT).toFixed(2);
    const translateZ = -Math.abs(x * y) * 40;

    target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    target.style.boxShadow = `${-x * 20}px ${-y * 20}px 40px rgba(0,0,0,0.1)`;
    target.style.transition =
      "transform 0.1s ease-out, box-shadow 0.1s ease-out";
  });

  card.addEventListener("mouseleave", () => {
    target.style.transform =
      "rotateX(0deg) rotateY(0deg) translateZ(0)";
    target.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
    target.style.transition =
      "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease";
  });
});
  }

  const switcher = document.getElementById("switcher");
  let i = 0;
  let max = switcher.children.length;
  let reverse = false;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (motionQuery.matches) {
    for (let j = 0; j < max; j++) {
      switcher.children[j].classList.add("active");
    }
  } else {
    setInterval(() => {
      for (let j = 0; j < max; j++) {
        if (Math.abs(j - i) > 1) {
          switcher.children[j].classList.remove("active", "preActive");
        } else if (i == j) {
          switcher.children[j].classList.remove("preActive");
          switcher.children[j].classList.add("active");
        } else {
          if (switcher.children[j]) {
            switcher.children[j].classList.remove("active");
            switcher.children[j].classList.add("preActive");
          }
        }
      }

      if (!reverse) {
        if (i == max - 1) {
          reverse = true;
          i--;
        } else {
          i++;
        }
      } else {
        if (i == 0) {
          reverse = false;
          i++;
        } else {
          i--;
        }
      }
    }, 1000);
  }

  const questions = document.querySelectorAll(".faq--info");

  questions.forEach((q) => {
    q.addEventListener("click", () => {
      q.parentNode.classList.toggle("open");
    });
  });

  const themes = document.querySelectorAll(".footer--theme--header");

  themes.forEach((q) => {
    q.addEventListener("click", () => {
      q.parentNode.classList.toggle("closed");
    });
  });
});
