document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  let fillBorder = null;
  let clear_code = null;

  function playPiano(fields, opts = {}) {
    const {
      mode = "wave",
      duration = 2000,
      step = 140,
      minGap = 80,
      maxGap = 260,
      containerSelector = ".code--fields",
    } = opts;

    const list = Array.from(fields);
    const container = list[0]?.closest(containerSelector);

    let stopped = false;
    const timers = new Set();
    let resolveDone;
    const promise = new Promise((r) => (resolveDone = r));

    function later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!stopped) fn();
      }, ms);
      timers.add(id);
      return id;
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      timers.forEach(clearTimeout);
      timers.clear();
      list.forEach((f) => f.classList.remove("piano-up"));
      container?.classList.remove("checking");
      resolveDone();
    }

    container?.classList.add("checking");

    const tick = (el) => {
      if (stopped) return;
      el.classList.remove("piano-up");
      void el.offsetWidth;
      el.classList.add("piano-up");
      later(() => el.classList.remove("piano-up"), 300);
    };

    const endAt = performance.now() + duration;

    function loop() {
      if (stopped || performance.now() >= endAt) {
        stop();
        return;
      }

      if (mode === "simultaneous") {
        list.forEach(tick);
        later(loop, step * 2);
      } else if (mode === "random") {
        const el = list[Math.floor(Math.random() * list.length)];
        tick(el);
        later(loop, minGap + Math.random() * (maxGap - minGap));
      } else {
        let i = 0;
        const waveStep = () => {
          if (stopped || performance.now() >= endAt) {
            stop();
            return;
          }
          tick(list[i % list.length]);
          i++;
          later(waveStep, step);
        };
        waveStep();
      }
    }

    requestAnimationFrame(loop);

    return { stop, promise };
  }

  function checkCode(code) {
    if (code.length != 6) return;
    code_fields.forEach((f) =>
      f.classList.remove("success", "done", "error", "shake"),
    );
    code_fields.forEach((f) => f.querySelector("input").blur());

    const piano = playPiano(code_fields, {
      mode: "wave",
      duration: Infinity,
      step: 200,
    });

    setTimeout(() => {
      piano.stop();
      if (code == "777777") {
        let i = 0;
        fillBorder = setInterval(() => {
          code_fields[i].classList.add("success");
          i++;
          if (i == code_fields.length) {
            clearInterval(fillBorder);

            setTimeout(() => {
              for (let i = 0; i < code_fields.length; i++) {
                code_fields[i].classList.add("done");
              }
            }, 500);
          }
        }, 125);
      } else {
        for (let i = 0; i < code_fields.length; i++) {
          code_fields[i].classList.add("error");
        }

        setTimeout(() => {
          for (let i = 0; i < code_fields.length; i++) {
            code_fields[i].classList.add("shake");
          }
          setTimeout(() => {
            let j = 1;
            clear_code = setInterval(() => {
              code_fields[code_fields.length - j].querySelector("input").value =
                "";
              code_fields[code_fields.length - j].classList.remove("error");
              code_fields[code_fields.length - j].classList.remove("shake");
              j++;
              if (j == code_fields.length + 1) {
                clearInterval(clear_code);
              }
            }, 125);
          }, 500);
        }, 500);
      }
    }, 5000);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  const code_fields = document.querySelectorAll(".input--code");

  code_fields.forEach((num, index) => {
    const input = num.querySelector("input");
    if (!input) return;

    input.addEventListener("beforeinput", function () {
      if (this.value.trim() !== "") {
        this.value = "";
      }
      input.parentNode.classList.remove("success");
      input.parentNode.classList.remove("done");
    });

    input.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "");
      if (this.value.length > 1) {
        const digits = this.value.split("");
        digits.forEach((d, k) => {
          const target = code_fields[index + k];
          if (target) target.querySelector("input").value = d;
        });
        this.value = digits[0];
        code_fields.forEach((f) => f.querySelector("input").blur());
        let code = "";
        for (const f of code_fields) code += f.querySelector("input").value;
        checkCode(code);
        return;
      }

      if (this.value.length > 1) {
        this.value = this.value.slice(0, 1);
      }

      input.parentNode.classList.remove("success");
      input.parentNode.classList.remove("done");

      if (this.value !== "") {
        const nextInput = code_fields[index + 1] ?? null;
        if (nextInput) {
          nextInput.querySelector("input").focus();
          let code = "";
          for (let i = 0; i < code_fields.length; i++)
            code += code_fields[i].querySelector("input").value;
          checkCode(code);
        } else {
          input.blur();
          let code = "";
          for (let i = 0; i < code_fields.length; i++)
            code += code_fields[i].querySelector("input").value;
          checkCode(code);
        }
      }
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        const prevInput = code_fields[index - 1].querySelector("input");
        if (prevInput) {
          prevInput.focus();
        }
        input.parentNode.classList.remove("success");
        input.parentNode.classList.remove("done");
      }
    });
  });
});
