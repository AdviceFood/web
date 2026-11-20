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

  if (window.innerWidth >= 1024) {
    const copyBtns = document.querySelectorAll("button.link--copy");

    copyBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.classList.add("active");
        setTimeout(() => {
          btn.classList.remove("active");
        }, 1000);

        const text = btn.previousElementSibling.innerHTML;
        try {
          await navigator.clipboard.writeText(text);
        } catch (err) {
          btn.previousElementSibling.innerHTML = "Error";
          setTimeout(() => {
            btn.previousElementSibling.innerHTML = text;
          }, 1000);
        }
      });
    });
  }
});
