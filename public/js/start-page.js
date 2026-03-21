/* ============================================
   Get Started Page — Multi-Platform Tab Flow
   ============================================ */

(function () {
  'use strict';

  let translations = {};
  let activePlatform = 'claude-code';

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

    renderTabs(sp);
    renderPanels(sp);

    if (window.lucide) lucide.createIcons();
  }

  function renderTabs(sp) {
    const container = document.getElementById('platformTabs');
    if (!container || !sp.platforms) return;

    container.innerHTML = '';
    sp.platforms.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'platform-tab' + (p.id === activePlatform ? ' platform-tab--active' : '');
      btn.dataset.platform = p.id;

      const icon = document.createElement('span');
      icon.className = 'platform-tab__icon';
      icon.textContent = p.emoji;

      const label = document.createElement('span');
      label.className = 'platform-tab__label';
      label.textContent = p.label;

      btn.appendChild(icon);
      btn.appendChild(label);

      if (p.recommended) {
        const badge = document.createElement('span');
        badge.className = 'platform-tab__badge';
        badge.textContent = sp.recommended || 'Recommended';
        btn.appendChild(badge);
      }

      btn.addEventListener('click', () => {
        activePlatform = p.id;
        container.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('platform-tab--active'));
        btn.classList.add('platform-tab--active');
        document.querySelectorAll('.platform-panel').forEach(panel => panel.classList.remove('platform-panel--active'));
        const activePanel = document.getElementById('panel-' + p.id);
        if (activePanel) activePanel.classList.add('platform-panel--active');
      });

      container.appendChild(btn);
    });
  }

  function renderPanels(sp) {
    const container = document.getElementById('startFlow');
    if (!container || !sp.platforms) return;

    container.innerHTML = '';
    sp.platforms.forEach(p => {
      const panel = document.createElement('div');
      panel.className = 'platform-panel' + (p.id === activePlatform ? ' platform-panel--active' : '');
      panel.id = 'panel-' + p.id;

      if (p.oneliner) {
        panel.appendChild(buildOneliner(p.oneliner, sp));
      }

      p.steps.forEach((step, i) => {
        panel.appendChild(buildStep(step, i, sp));
      });

      container.appendChild(panel);
    });

    setupCopyButtons(container, sp);
  }

  function buildOneliner(oneliner, sp) {
    const wrapper = document.createElement('div');
    wrapper.className = 'platform-oneliner';

    const labelEl = document.createElement('div');
    labelEl.className = 'platform-oneliner__label';
    labelEl.textContent = oneliner.label || sp.onelineLabel || '⚡ One-liner';
    wrapper.appendChild(labelEl);

    wrapper.appendChild(buildCodeBlock(oneliner.code, null, sp));

    const divider = document.createElement('div');
    divider.className = 'platform-oneliner__divider';
    divider.textContent = sp.orStepByStep || '— or step by step —';
    wrapper.appendChild(divider);

    return wrapper;
  }

  function buildStep(step, index, sp) {
    const el = document.createElement('div');
    el.className = 'start-step';

    const num = document.createElement('div');
    num.className = 'start-step__number';
    num.textContent = index + 1;
    el.appendChild(num);

    const title = document.createElement('h3');
    title.className = 'start-step__title';
    title.textContent = step.title;
    el.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'start-step__desc';
    desc.textContent = step.description;
    el.appendChild(desc);

    if (step.items) {
      const ul = document.createElement('ul');
      ul.className = 'start-step__checklist';
      step.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      el.appendChild(ul);
    }

    if (step.note) {
      const note = document.createElement('p');
      note.className = 'start-step__note';
      note.textContent = step.note;
      el.appendChild(note);
    }

    if (step.code) {
      el.appendChild(buildCodeBlock(step.code, step.output, sp));
    }

    return el;
  }

  function buildCodeBlock(code, output, sp) {
    const block = document.createElement('div');
    block.className = 'start-code-block';

    const header = document.createElement('div');
    header.className = 'start-code-block__header';

    const dots = document.createElement('div');
    dots.className = 'start-code-block__dots';
    ['red', 'yellow', 'green'].forEach(color => {
      const dot = document.createElement('span');
      dot.className = 'start-code-block__dot start-code-block__dot--' + color;
      dots.appendChild(dot);
    });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'start-code-block__copy';
    copyBtn.dataset.code = code;
    copyBtn.dataset.copyText = sp.copyButton || 'Copy';
    copyBtn.dataset.copiedText = sp.copiedButton || 'Copied!';
    copyBtn.textContent = sp.copyButton || 'Copy';

    header.appendChild(dots);
    header.appendChild(copyBtn);
    block.appendChild(header);

    const codeEl = document.createElement('div');
    codeEl.className = 'start-code-block__code';
    codeEl.textContent = code;
    block.appendChild(codeEl);

    if (output) {
      const outputEl = document.createElement('div');
      outputEl.className = 'start-code-block__output';
      outputEl.textContent = output;
      block.appendChild(outputEl);
    }

    return block;
  }

  function setupCopyButtons(container, sp) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
