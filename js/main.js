/* global Swiper */

document.addEventListener("DOMContentLoaded", () => {
  const openComm = document.getElementById("openComm");
  const analyzeComment = document.getElementById("analyzeComment");

  openComm.addEventListener("click", () => {
    openComm.classList.add("hide");
    analyzeComment.classList.add("show");
  });

  const swiper = new Swiper(".swiper", {
    direction: "horizontal",
    slidesPerView: 1.1,
    spaceBetween: 10,
    centeredSlides: true,
  });

  if (swiper == 10) {
    swiper.stop();
  }
});
