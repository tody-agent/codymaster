/* ═══════════╗ STORY PAGE JS ╔═══════════ */

document.addEventListener('DOMContentLoaded', () => {
  renderChapterContent();
  renderChapterSkills();
  initProgressBar();
});

/* ── Render chapter content with line breaks ── */
function renderChapterContent() {
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const text = getI18nValue(key);
    if (text) {
      const esc = window.SecurityUtils ? window.SecurityUtils.escapeHtml : (s => s);
      el.innerHTML = text.replace(/\\n/g, '\n').split('\n').map(p => p.trim() ? `<p>${esc(p)}</p>` : '').join('');
    }
  });
}

/* ── Get nested i18n value from current language data ── */
function getI18nValue(key) {
  if (!window._i18nData) return null;
  const parts = key.split('.');
  let val = window._i18nData;
  for (const p of parts) {
    if (val && typeof val === 'object') {
      val = val[p];
    } else {
      return null;
    }
  }
  return val;
}

/* ── Render skill tags for each chapter ── */
function renderChapterSkills() {
  document.querySelectorAll('[data-chapter-skills]').forEach(el => {
    const idx = parseInt(el.getAttribute('data-chapter-skills'));
    const key = `storyPage.chapters.${idx}.skills`;
    const skills = getI18nValue(key);
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const escSkill = window.SecurityUtils ? window.SecurityUtils.escapeHtml : (s => s);
      el.innerHTML = skills.map(s =>
        `<a href="skills.html" class="chapter__skill-tag">${escSkill(s)}</a>`
      ).join('');
    }
  });
}

/* ── Reading progress bar ── */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.className = 'story-progress';
  bar.innerHTML = '<div class="story-progress__fill"></div>';
  document.body.prepend(bar);

  const fill = bar.querySelector('.story-progress__fill');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = Math.min((scrolled / total) * 100, 100);
    fill.style.width = `${pct}%`;
  });
}

/* ── Re-render on language change ── */
const origApply = window.applyTranslations;
if (typeof origApply === 'function') {
  window.applyTranslations = function(data) {
    origApply(data);
    setTimeout(() => {
      renderChapterContent();
      renderChapterSkills();
    }, 50);
  };
}
