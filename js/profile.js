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

function expandInfo(btn) {
  document.querySelectorAll(".expander--list").forEach((f) => {
    if (f != btn.nextElementSibling) f.classList.remove("open");
  });
  btn.nextElementSibling.classList.toggle("open");
}

document.addEventListener("click", function (e) {
  const link = e.target.closest("a.history--link");
  if (!link) return;

  e.preventDefault();
});
