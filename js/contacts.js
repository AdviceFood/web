document.addEventListener("DOMContentLoaded", () => {
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
