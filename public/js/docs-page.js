/* ═══════ docs-page.js — Renders documentation page content from i18n ═══════ */
(function() {
  'use strict';

  // XSS Prevention helper
  const esc = window.SecurityUtils ? window.SecurityUtils.escapeHtml : function(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };

  function waitForI18n(cb) {
    if (window.I18n && window.I18n.translations && Object.keys(window.I18n.translations).length > 0) { cb(); return; }
    const id = setInterval(() => {
      if (window.I18n && window.I18n.translations && Object.keys(window.I18n.translations).length > 0) { clearInterval(id); cb(); }
    }, 50);
  }

  function get(path) {
    const lang = window.I18n.currentLang || 'en';
    const data = window.I18n.translations[lang] || window.I18n.translations['en'];
    return path.split('.').reduce((o, k) => o && o[k], data);
  }

  /* ── Persona Cards ── */
  function renderPersonas() {
    const container = document.getElementById('docsPersonas');
    if (!container) return;
    const personas = get('docsPage.personasSection.personas');
    if (!personas) return;

    container.innerHTML = personas.map((p, i) => `
      <article class="persona-card reveal" style="--delay:${i * 80}ms">
        <div class="persona-card__header">
          <span class="persona-card__emoji">${esc(p.emoji)}</span>
          <div>
            <h3 class="persona-card__role">${esc(p.role)}</h3>
            <p class="persona-card__tagline">${esc(p.tagline)}</p>
          </div>
        </div>
        <p class="persona-card__demo"><strong>Who:</strong> ${esc(p.demographics)}</p>
        <div class="persona-card__pains">
          <h4>😤 Pain Points</h4>
          <ul>${p.painPoints.map(pp => `<li>${esc(pp)}</li>`).join('')}</ul>
        </div>
        <div class="persona-card__dream">
          <h4>✨ Dream Outcome</h4>
          <p>${esc(p.dreamOutcome)}</p>
        </div>
        <div class="persona-card__skills">
          <h4>🔧 Skills Used</h4>
          <div class="skill-tags">${p.skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}</div>
        </div>
        <blockquote class="persona-card__jtbd">
          <em>"${esc(p.jtbd)}"</em>
        </blockquote>
      </article>
    `).join('');
  }

  /* ── JTBD Canvas Cards ── */
  function renderJtbd() {
    const container = document.getElementById('docsJtbd');
    if (!container) return;
    const jobs = get('docsPage.jtbdSection.jobs');
    const labels = get('docsPage.jtbdSection.forceLabels');
    if (!jobs) return;

    container.innerHTML = jobs.map((j, i) => `
      <article class="jtbd-card reveal" style="--delay:${i * 100}ms">
        <div class="jtbd-card__number">${esc(j.number)}</div>
        <div class="jtbd-card__job">
          <p class="jtbd-card__situation">${esc(j.situation)}</p>
          <p class="jtbd-card__motivation">${esc(j.motivation)}</p>
          <p class="jtbd-card__outcome">${esc(j.outcome)}</p>
        </div>
        <div class="jtbd-card__dimensions">
          <div class="jtbd-dim"><span class="jtbd-dim__icon">⚙️</span><span class="jtbd-dim__label">Functional</span><p>${esc(j.functional)}</p></div>
          <div class="jtbd-dim"><span class="jtbd-dim__icon">💙</span><span class="jtbd-dim__label">Emotional</span><p>${esc(j.emotional)}</p></div>
          <div class="jtbd-dim"><span class="jtbd-dim__icon">👥</span><span class="jtbd-dim__label">Social</span><p>${esc(j.social)}</p></div>
        </div>
        <div class="jtbd-card__forces">
          <div class="force force--push"><span class="force__label">⬆️ ${esc(labels.push)}</span><p>${esc(j.push)}</p></div>
          <div class="force force--pull"><span class="force__label">⬇️ ${esc(labels.pull)}</span><p>${esc(j.pull)}</p></div>
          <div class="force force--habit"><span class="force__label">🔄 ${esc(labels.habit)}</span><p>${esc(j.habit)}</p></div>
          <div class="force force--anxiety"><span class="force__label">😰 ${esc(labels.anxiety)}</span><p>${esc(j.anxiety)}</p></div>
        </div>
        <div class="jtbd-card__skills">
          <div class="skill-tags">${j.skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}</div>
        </div>
      </article>
    `).join('');
  }

  /* ── Use Case Cards ── */
  function renderUseCases() {
    const container = document.getElementById('docsUseCases');
    if (!container) return;
    const cases = get('docsPage.useCasesSection.cases');
    if (!cases) return;

    container.innerHTML = cases.map((c, i) => `
      <article class="usecase-card reveal" style="--delay:${i * 80}ms">
        <div class="usecase-card__header">
          <span class="usecase-card__emoji">${esc(c.emoji)}</span>
          <h3 class="usecase-card__title">${esc(c.title)}</h3>
        </div>
        <p class="usecase-card__scenario">${esc(c.scenario)}</p>
        <div class="usecase-card__chain">
          <h4>⛓️ Skill Chain</h4>
          <div class="chain-flow">${c.chain.map((s, si) =>
            `<span class="chain-step">${esc(s)}</span>${si < c.chain.length - 1 ? '<span class="chain-arrow">→</span>' : ''}`
          ).join('')}</div>
        </div>
        <p class="usecase-card__outcome"><strong>✅ Outcome:</strong> ${esc(c.outcome)}</p>
        <div class="usecase-card__metrics">
          <div class="metric"><span class="metric__label">⏱️ Time</span><span class="metric__value">${esc(c.timeSaved)}</span></div>
          <div class="metric"><span class="metric__label">💰 Cost</span><span class="metric__value">${esc(c.costSaved)}</span></div>
        </div>
      </article>
    `).join('');
  }

  /* ── Skill Map ── */
  function renderSkillMap() {
    const container = document.getElementById('docsSkillMap');
    if (!container) return;
    const swarms = get('docsPage.skillMapSection.swarms');
    if (!swarms) return;

    container.innerHTML = swarms.map((sw, i) => `
      <div class="swarm-group reveal" style="--delay:${i * 100}ms">
        <h3 class="swarm-group__name">${esc(sw.name)}</h3>
        <div class="swarm-group__skills">
          ${sw.skills.map(s => `<span class="swarm-skill swarm-skill--${esc(sw.color)}">${esc(s)}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  /* ── FAQ ── */
  function renderFaq() {
    const container = document.getElementById('docsFaq');
    if (!container) return;
    const questions = get('docsPage.faqSection.questions');
    if (!questions) return;

    container.innerHTML = questions.map((q, i) => `
      <details class="faq-item reveal" style="--delay:${i * 60}ms" ${i === 0 ? 'open' : ''}>
        <summary class="faq-item__q">${esc(q.q)}</summary>
        <p class="faq-item__a">${esc(q.a)}</p>
      </details>
    `).join('');
  }

  /* ── Init ── */
  function renderAll() {
    renderPersonas();
    renderJtbd();
    renderUseCases();
    renderSkillMap();
    renderFaq();
  }

  waitForI18n(renderAll);

  // Re-render on language change
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-lang') {
        setTimeout(renderAll, 100);
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });
})();
