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

const selector = document.querySelector(".selector--header");

selector.addEventListener("click", () => {
  selector.parentNode.classList.toggle("open");
});

const nativeSelect = document.querySelector("#sorter");

const options = document.querySelectorAll(".selector--value");
const selectIcon = document.getElementById("selectorIcon");
const selectText = document.getElementById("selectorText");

options.forEach((option) => {
  option.addEventListener("click", () => {
    const icon = option.children[0];
    const name = option.children[1];

    nativeSelect.value = name.innerHTML;

    let tempIcon = selectIcon.innerHTML;
    let tempText = selectText.innerHTML;

    selectIcon.innerHTML = icon.innerHTML;
    selectText.innerHTML = name.innerHTML;

    icon.innerHTML = tempIcon;
    name.innerHTML = tempText;

    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));

    selector.parentNode.classList.remove("open");
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom--selector")) {
    selector.parentNode.classList.remove("open");
  }
  if (!e.target.closest(".history--expander")) {
    document
      .querySelectorAll(".expander--list")
      .forEach((f) => f.classList.remove("open"));
  }
});

let oldest = true;
let searchName = "";

const search = document.getElementById("search");

const clearSearch = document.getElementById("searchClose");

clearSearch.addEventListener("click", () => {
  search.classList.remove("filled");
  search.value = "";
});

let cardsPerPage = 16;

if (window.innerWidth <= 1024) {
  cardsPerPage = 8;
}

document.getElementById("reportPag").innerHTML =
  `Showing ${cardsPerPage} of 100`;

const grid = document.getElementById("gridCont");
const pag = document.getElementById("pag");

let activePage = 1;

let pages = false;

function setActivePage(pages, page = 1) {
  page = Number(page);
  let newContent = "";

  if (window.innerWidth >= 1024 && page != 1) {
    newContent +=
      '<div class="btn" data-page=' +
      (page - 1) +
      ' id="page' +
      (page - 1) +
      '"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="14" fill="none"><path fill="#000" d="m6.292.28-6 6a1 1 0 0 0 0 1.415l6 6a1 1 0 1 0 1.414-1.414L2.413 6.988l5.293-5.293A1 1 0 0 0 6.292.28"/></svg></div>';
  }

  if (pages > 5) {
    if (page < 4) {
      for (let i = 0; i < page + 1; i++) {
        newContent +=
          '<div class="btn" data-page=' +
          (i + 1) +
          ' id="page' +
          (i + 1) +
          '">' +
          (i + 1) +
          "</div>";
      }

      newContent += '<div class="dots" data-role="jump">...</div>';

      for (let i = pages - 2; i < pages; i++) {
        newContent +=
          '<div class="btn" data-page=' +
          (i + 1) +
          ' id="page' +
          (i + 1) +
          '">' +
          (i + 1) +
          "</div>";
      }
    } else if (page + 2 >= pages) {
      newContent += '<div class="btn" data-page="1" id="page1">1</div>';

      newContent += '<div class="dots" data-role="jump">...</div>';

      for (let i = page - 2; i < pages; i++) {
        newContent +=
          '<div class="btn" data-page=' +
          (i + 1) +
          ' id="page' +
          (i + 1) +
          '">' +
          (i + 1) +
          "</div>";
      }
    } else {
      newContent += '<div class="btn" data-page="1" id="page1">1</div>';

      newContent += '<div class="dots" data-role="jump">...</div>';

      for (let i = page - 2; i < page + 1; i++) {
        newContent +=
          '<div class="btn" data-page=' +
          (i + 1) +
          ' id="page' +
          (i + 1) +
          '">' +
          (i + 1) +
          "</div>";
      }

      newContent += '<div class="dots" data-role="jump">...</div>';

      newContent +=
        '<div class="btn" data-page=' +
        pages +
        ' id="page' +
        pages +
        '">' +
        pages +
        "</div>";
    }

    if (window.innerWidth >= 1024 && page != pages) {
      newContent +=
        '<div class="btn" data-page=' +
        (page + 1) +
        ' id="page' +
        (page + 1) +
        '"><svg style="transform: rotate(180deg)" xmlns="http://www.w3.org/2000/svg" width="9" height="14" fill="none"><path fill="#000" d="m6.292.28-6 6a1 1 0 0 0 0 1.415l6 6a1 1 0 1 0 1.414-1.414L2.413 6.988l5.293-5.293A1 1 0 0 0 6.292.28"/></svg></div>';
    }

    pag.innerHTML = newContent;
    newContent = "";

    for (let i = 0; i < pag.children.length; i++) {
      pag.children[i].classList.remove("active");
    }
    pag.querySelector("#page" + page).classList.add("active");
  } else {
    for (let i = 1; i <= pages; i++) {
      newContent += `<div class="btn" data-page="${i}" id="page${i}">${i}</div>`;
    }

    if (window.innerWidth >= 1024 && page != pages) {
      newContent +=
        '<div class="btn" data-page=' +
        (page + 1) +
        ' id="page' +
        (page + 1) +
        '"><svg style="transform: rotate(180deg)" xmlns="http://www.w3.org/2000/svg" width="9" height="14" fill="none"><path fill="#000" d="m6.292.28-6 6a1 1 0 0 0 0 1.415l6 6a1 1 0 1 0 1.414-1.414L2.413 6.988l5.293-5.293A1 1 0 0 0 6.292.28"/></svg></div>';
    }
    pag.innerHTML = newContent;
    for (let i = 0; i < pag.children.length; i++) {
      pag.children[i].classList.remove("active");
    }
    pag.querySelector("#page" + page).classList.add("active");
  }

  activePage = page;

  getData(activePage - 1, searchName, oldest);

  return activePage;
}

function updatePagination(pages) {
  setActivePage(pages, 1);

  return true;
}

function setControls() {
  pag.addEventListener("click", (e) => {
    const dots = e.target.closest(".dots");
    if (dots) {
      e.preventDefault();
      showJumpInput(dots);
      return;
    }

    const btn = e.target.closest(".btn");
    if (!btn) return;

    const page = parseInt(btn.dataset.page, 10);
    if (!page) return;

    setActivePage(pages, page);
  });
}

function showJumpInput(dotsEl) {
  if (dotsEl.dataset.active === "true") return;

  const total = Number(pages);
  const current = activePage;

  dotsEl.dataset.active = "true";
  dotsEl.innerHTML = `<input
        type="number"
        class="jump-input"
        min="1"
        max="${total}"
        value="${current}"
        placeholder="№"
        autocomplete="off"
    >`;

  const input = dotsEl.querySelector(".jump-input");
  input.focus();
  input.select();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const page = parseInt(input.value, 10);
      if (page >= 1 && page <= total) {
        setActivePage(pages, page);
      } else {
        input.classList.add("invalid");
        setTimeout(() => input.classList.remove("invalid"), 500);
      }
    }
    if (e.key === "Escape") {
      setActivePage(pages, activePage);
    }
  });

  input.addEventListener("blur", () => {
    setActivePage(pages, activePage);
  });

  input.addEventListener("beforeinput", (e) => {
    if (e.data && !/^\d+$/.test(e.data)) {
      e.preventDefault();
      return;
    }
    if (+input.value.length > 2) input.value = input.value[0] + input.value[1];
  });
}

search.addEventListener("change", async () => {
  searchName = search.value.trim();
  if (searchName.length > 0) {
    search.classList.add("filled");
  } else {
    search.classList.remove("filled");
  }
  const pagesCount = await getData(0, search.value.trim(), oldest);
  if (!pagesCount) return;

  pages = pagesCount;
  activePage = 1;
  updatePagination(pages);
});

let data = [];

async function getData(page = 0, name = "", oldest = true) {
  try {
    const response = await fetch("test.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();

    let items = data.items.filter((item) =>
      item.title.toLowerCase().includes(name.toLowerCase()),
    );
    if (!oldest) items = items.reverse();
    let total = Math.min(+data.total, items.length);
    let limit = Math.min(cardsPerPage, Math.abs(+total - page * cardsPerPage));

    let newPages = Math.ceil(total / cardsPerPage);

    // ONLY WITHOUT BACKEND (OWB)

    let start = page * cardsPerPage;
    let end = start + limit;

    items = items.slice(start, end);

    // END OWB

    let newContent = "";
    for (let i = 0; i < limit; i++) {
      newContent += `
                <li class="history--item" data-time="${items[i].timestamp}">
                  <a href="#" class="history--link">
                    <div class="history--img">
                      <picture>
                        <img src="img/blog.png" alt="" />
                      </picture>
                      <div class="history--img--line">
                        <span>435 kcal</span>
                        <span>58g</span>
                        <span>58g</span>
                        <span>58g</span>
                      </div>
                    </div>
                    <div class="history--info">
                      <div class="history--meta">
                        <strong>${items[i].title}</strong>
                        <span class="history--date"> 11 Oct 2026 · 19:36 </span>
                      </div>

                      <div class="history--expander desktopOnly">
                        <button type="button" onclick="expandInfo(this);">
                          <span></span>
                        </button>

                        <ul class="expander--list">
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><g stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" clip-path="url(#o11)"><path d="M7 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1"/><path d="M20.385 6.585a2.1 2.1 0 0 0-2.97-2.97L9 12v3h3zM16 5l3 3"/></g><defs><clipPath id="o11"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs></svg>
                            Edit name
                            </li>
                            <li>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><g clip-path="url(#o12)"><path stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m-6 4h6m-2 4h2M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2z"/></g><defs><clipPath id="o12"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs></svg>
                            Create a recipe
                            </li>
                            <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><g stroke="#e53935" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" clip-path="url(#o13)"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></g><defs><clipPath id="o13"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs></svg>
                            Delete analysis
                            </li>
                        </ul>
                      </div>

                      <div class="history--utility">
                        <span class="utility--num">${items[i].utility}</span>

                        <div class="utility--meta desktopOnly">
                          The utility index
                          <span>Average</span>
                        </div>
                      </div>
                    </div>

                    <div class="history--kcal desktopOnly">
                      <div class="kcal--block">
                        <b>436 kcal</b>
                        per serving
                      </div>

                      <div class="kcal--block">
                        <b>50g</b>
                        protein
                      </div>

                      <div class="kcal--block">
                        <b>50g</b>
                        fats
                      </div>

                      <div class="kcal--block">
                        <b>50g</b>
                        carbs
                      </div>
                    </div>
                  </a>
                </li>
              `;
    }

    grid.innerHTML = newContent;

    newContent = "";

    return newPages;
  } catch (err) {
    return false;
  }
}

nativeSelect.addEventListener("change", () => {
  oldest = nativeSelect.value === nativeSelect.options[1].value;

  getData(0, searchName, oldest);

  setActivePage(pages, 1);
});

setTimeout(() => {
  getData().then((pagesCount) => {
    if (!pagesCount) {
      return;
    }

    pages = pagesCount;

    setActivePage(pages, 1);
    setControls();
  });
}, 3000);

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
