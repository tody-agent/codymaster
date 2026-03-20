/* ============================================
   Get Started Page — Step Flow + Copy Buttons
   ============================================ */

(function () {
  'use strict';

  let translations = {};

  async function init() {
    const lang = localStorage.getItem('kit-lang') ||
      (new URLSearchParams(window.location.search).get('lang')) ||
      (navigator.language?.startsWith('vi') ? 'vi' : 'en');

    try {
      const res = await fetch(`i18n/${lang}.json`);
      translations = await res.json();
    } catch (e) {
      const res = await fetch('i18n/en.json');
      translations = await res.json();
    }

    const sp = translations.startPage;
    if (!sp) return;

    renderSteps(sp);

    if (window.lucide) lucide.createIcons();
  }

  function renderSteps(sp) {
    const container = document.getElementById('startFlow');
    if (!container || !sp.steps) return;

    container.innerHTML = '';
    sp.steps.forEach((step, i) => {
      const el = document.createElement('div');
      el.className = 'start-step';

      let content = `
        <div class="start-step__number">${i + 1}</div>
        <h3 class="start-step__title">${step.title}</h3>
        <p class="start-step__desc">${step.description}</p>
      `;

      // Checklist for prerequisites
      if (step.items) {
        content += '<ul class="start-step__checklist">';
        step.items.forEach(item => {
          content += `<li>${item}</li>`;
        });
        content += '</ul>';
      }

      if (step.note) {
        content += `<p class="start-step__note">${step.note}</p>`;
      }

      // Code block
      if (step.code) {
        content += `
          <div class="start-code-block">
            <div class="start-code-block__header">
              <div class="start-code-block__dots">
                <span class="start-code-block__dot start-code-block__dot--red"></span>
                <span class="start-code-block__dot start-code-block__dot--yellow"></span>
                <span class="start-code-block__dot start-code-block__dot--green"></span>
              </div>
              <button class="start-code-block__copy" data-code="${escapeAttr(step.code)}" data-copy-text="${sp.copyButton || 'Copy'}" data-copied-text="${sp.copiedButton || 'Copied!'}">${sp.copyButton || 'Copy'}</button>
            </div>
            <div class="start-code-block__code">$ ${step.code}</div>
            ${step.output ? `<div class="start-code-block__output">${step.output}</div>` : ''}
          </div>
        `;
      }

      el.innerHTML = content;
      container.appendChild(el);
    });

    // Setup copy buttons
    container.querySelectorAll('.start-code-block__copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = btn.dataset.copiedText;
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = btn.dataset.copyText;
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    });
  }

  function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
