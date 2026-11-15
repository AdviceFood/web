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
    const el = document.querySelectorAll(".preview--bg");

    let rafId = null;

    const updateParallax = () => {
      const rect = el[0].getBoundingClientRect();
      const vh = window.innerHeight;

      const progress = (vh - rect.top) / (vh + rect.height);

      const y = (progress - 0.5) * 20;

      el.forEach(
        (e) =>
          (e.style.transform = `
        rotateX(12deg)
        rotateY(-6deg)
        translate3d(0, ${y}px, 0px)
      `),
      );

      rafId = null;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateParallax();
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
