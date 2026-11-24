(() => {
  'use strict';

  const root = document.querySelector('#root');
  const form = document.querySelector('#gate-form');
  const code = document.querySelector('#access-code');
  const error = document.querySelector('#gate-error');
  const submit = form.querySelector('button');
  const sessionKey = 'unicef-certificate-unlocked';
  const accessCodeDigest = '8ba5ef4e282bf7bc5cf13f731a1b9f525bd3b1f69cbfa24c1c69c303c0ac7019';

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  function openEditor() {
    submit.disabled = true;
    const script = document.createElement('script');
    script.src = 'editor.js';
    script.onerror = () => {
      script.remove();
      submit.disabled = false;
      showError('Uređivač se nije učitao. Pokušajte ponovno.');
    };
    document.head.append(script);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    if (!globalThis.crypto?.subtle) {
      showError('Otvorite ovu stranicu preko sigurne HTTPS veze.');
      return;
    }
    submit.disabled = true;
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.value.trim()));
    const digest = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== accessCodeDigest) {
      submit.disabled = false;
      showError('Pristupni kod nije točan. Pokušajte ponovno.');
      code.setAttribute('aria-invalid', 'true');
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        code.animate([{ translate: '0' }, { translate: '-6px' }, { translate: '5px' }, { translate: '-3px' }, { translate: '0' }], { duration: 270 });
      }
      code.focus();
      code.select();
      return;
    }
    try { sessionStorage.setItem(sessionKey, 'yes'); } catch {}
    openEditor();
  });

  code.addEventListener('input', () => {
    error.hidden = true;
    code.removeAttribute('aria-invalid');
  });

  try {
    if (sessionStorage.getItem(sessionKey) === 'yes' && root.querySelector('.gate')) openEditor();
  } catch {}
})();
