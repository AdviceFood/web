document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('registerForm');

    let fillBorder = null;
    let clear_code = null;

    function checkCode(code) {
        code_fields.forEach(f => f.classList.remove('success', 'done', 'error', 'shake'));

        if (code == '777777') {
            let i = 0;
            fillBorder = setInterval(() => {
               code_fields[i].classList.add('success');
               i++;
               if (i == code_fields.length) {
                clearInterval(fillBorder);

                setTimeout(() => {
                    for (let i = 0; i < code_fields.length; i++) {
                        code_fields[i].classList.add('done');
                    }
                }, 500)
                
               };
           }, 125)
        } else {
            let i = 0;
            fillBorder = setInterval(() => {
               code_fields[i].classList.add('error');
               i++;
               if (i == code_fields.length) {
                clearInterval(fillBorder);

                setTimeout(() => {
                    for (let i = 0; i < code_fields.length; i++) {
                        code_fields[i].classList.add('shake');
                    }
                    let j = 0;
                    clear_code = setInterval(() => {
                        code_fields[j].querySelector('input').value = '';
                        code_fields[j].classList.remove('error');
                        code_fields[j].classList.remove('shake');
                        j++;
                        if (j == code_fields.length) {
                            clearInterval(clear_code);
                            
                        };
                    }, 125)
                }, 500)
                
               };
           }, 125)
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
    })

    const code_fields = document.querySelectorAll('.input--code');

    code_fields.forEach((num, index) => {
    const input = num.querySelector('input');
    if (!input) return;

    input.addEventListener('beforeinput', function(e) {
        if (this.value.trim() !== '') {
            this.value = '';
        }
        input.parentNode.classList.remove('success');
            input.parentNode.classList.remove('done');
    });

    input.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length > 1) {
            const digits = this.value.split('');
            digits.forEach((d, k) => {
                const target = code_fields[index + k];
                if (target) target.querySelector('input').value = d;
            });
            this.value = digits[0];
            const lastFilled = Math.min(index + digits.length - 1, code_fields.length - 1);
            code_fields.forEach(f => f.querySelector('input').blur())
            if (lastFilled === code_fields.length - 1) {
                let code = '';
                for (const f of code_fields) code += f.querySelector('input').value;
                checkCode(code);
            }
            return;
        }


        if (this.value.length > 1) {
            this.value = this.value.slice(0, 1);
        }

        input.parentNode.classList.remove('success');
            input.parentNode.classList.remove('done');

        if (this.value !== '') {
            const nextInput = code_fields[index + 1] ?? null;
            if (nextInput) {
                nextInput.querySelector('input').focus();
            } else {
                input.blur();
                let code = '';
                for (let i = 0; i < code_fields.length; i++)
                    code += code_fields[i].querySelector('input').value;
                checkCode(code);
            }

        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value === '' && index > 0) {
            const prevInput = code_fields[index - 1].querySelector('input');
            if (prevInput) {
                prevInput.focus();
            }
            input.parentNode.classList.remove('success');
            input.parentNode.classList.remove('done');
        }
    });
});
})