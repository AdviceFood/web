document.addEventListener("DOMContentLoaded", () => {
    const eyes = document.querySelectorAll('.input--eye');

    eyes.forEach(eye => {
        eye.addEventListener('click', () => {
            if (eye.previousElementSibling.value.trim() != '') {
                if (!eye.classList.contains('show')) {
                    eye.classList.add('show')
                    eye.previousElementSibling.setAttribute('type', 'text')
                } else {
                    eye.classList.remove('show')
                    eye.previousElementSibling.setAttribute('type', 'password')
                }
            } else {
                if (!eye.classList.contains('show')) {
                    eye.classList.add('show')
                } else {
                    eye.classList.remove('show')
                }
            }
        })
    })

    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');

    inputs.forEach(inp => {
        inp.addEventListener("focus", () => {
            setTimeout(() => {
                inp.classList.add('focused')
            }, 400)
        })

        inp.addEventListener("blur", () => {
            inp.classList.remove('focused')
        })
    })

    const inBlocks = document.querySelectorAll('.input--block');

    inBlocks.forEach(block => {
        block.addEventListener('click', (e) => {
            if (!e.target.classList.contains('input--text')) {
                block.querySelector('input').classList.add('focused');
                block.querySelector('input').focus();
            }
        })
    })

    const registerBtn = document.querySelector('button[type="submit"]');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(check => {
        check.addEventListener('change', () => {
            for (let i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked != true) {
                    registerBtn.disabled = true;
                    return;
                }
            }
            registerBtn.disabled = false;
        })
    })
})