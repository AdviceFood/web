document.addEventListener("DOMContentLoaded", () => {
  const openComm = document.getElementById("openComm");
  const analyzeComment = document.getElementById("analyzeComment");

  openComm.addEventListener("click", () => {
    openComm.classList.add("hide");
    analyzeComment.classList.add("show");
  });
});
