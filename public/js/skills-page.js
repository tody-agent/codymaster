/* ============================================
   Skills Directory Page — Search, Filter, Modal
   ============================================ */

(function () {
  'use strict';

  // Category → color mapping
  const CATEGORY_COLORS = {
    'All': 'lime', 'Tất cả': 'lime',
    'Ideation': 'purple', 'Ý tưởng': 'purple',
    'Design': 'blue', 'Thiết kế': 'blue',
    'Content': 'orange', 'Nội dung': 'orange',
    'Code & Deploy': 'lime', 'Code & Triển khai': 'lime',
    'Security': 'red', 'Bảo mật': 'red',
    'Quality': 'cyan', 'Chất lượng': 'cyan',
    'DevOps': 'green', 'DevOps': 'green'
  };

  const COLOR_CSS = {
    lime: 'var(--accent-lime)',
    purple: 'var(--accent-purple)',
    blue: 'var(--accent-blue)',
    orange: 'var(--cta-orange)',
    red: 'var(--accent-red)',
    cyan: 'var(--accent-cyan)',
    green: 'var(--accent-green)'
  };

  let catalog = [];
  let categories = [];
  let activeCategory = 0;
  let translations = {};

  function getT() {
    const lang = localStorage.getItem('kit-lang') ||
      (new URLSearchParams(window.location.search).get('lang')) ||
      (navigator.language?.startsWith('vi') ? 'vi' : 'en');
    return lang;
  }

  async function init() {
    const lang = getT();
    try {
      const res = await fetch(`i18n/${lang}.json`);
      translations = await res.json();
    } catch (e) {
      const res = await fetch('i18n/en.json');
      translations = await res.json();
    }

    const sp = translations.skillsPage;
    if (!sp) return;

    catalog = sp.catalog || [];
    categories = sp.categories || [];

    // Update search placeholder
    const searchInput = document.getElementById('skillSearch');
    if (searchInput && sp.searchPlaceholder) {
      searchInput.placeholder = sp.searchPlaceholder;
    }

    renderCategories();
    renderGrid(catalog);
    setupSearch();
    setupModal();

    if (window.lucide) lucide.createIcons();
  }

  function renderCategories() {
    const container = document.getElementById('skillCategories');
    if (!container) return;

    container.innerHTML = '';
    categories.forEach((cat, i) => {
      const btn = document.createElement('button');
      btn.className = `skills__tab${i === 0 ? ' active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        activeCategory = i;
        container.querySelectorAll('.skills__tab').forEach((t, j) => {
          t.classList.toggle('active', j === i);
        });
        filterSkills();
      });
      container.appendChild(btn);
    });
  }

  function renderGrid(skills) {
    const container = document.getElementById('skillsBento');
    if (!container) return;

    container.innerHTML = '';
    if (skills.length === 0) {
      container.innerHTML = '<p class="skills-empty">No skills found matching your search.</p>';
      return;
    }

    skills.forEach((skill) => {
      const color = CATEGORY_COLORS[skill.category] || 'lime';
      const cssColor = COLOR_CSS[color];

      const card = document.createElement('div');
      card.className = 'skill-bento-card';
      card.setAttribute('data-skill-id', skill.id);
      card.innerHTML = `
        <div class="skill-bento-card__top">
          <i data-lucide="${skill.icon}" class="skill-bento-card__icon" style="color:${cssColor}"></i>
          <span class="skill-bento-card__badge" style="color:${cssColor};border-color:${cssColor}">${skill.category}</span>
        </div>
        <span class="skill-bento-card__name">${skill.name}</span>
        <div class="skill-bento-card__story">
          <p class="skill-bento-card__problem" style="margin-top: 12px; font-size: 0.9rem; color: var(--text-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">😕 ${skill.problem || skill.description}</p>
          <p class="skill-bento-card__solution" style="margin-top: 8px; font-size: 0.9rem; color: ${cssColor}; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">💡 ${skill.solution || skill.tagline}</p>
        </div>
      `;
      card.addEventListener('click', () => openModal(skill));
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  function filterSkills() {
    const query = (document.getElementById('skillSearch')?.value || '').toLowerCase();
    const catLabel = categories[activeCategory];
    const isAll = activeCategory === 0;

    const filtered = catalog.filter(skill => {
      const matchCat = isAll || skill.category === catLabel;
      const matchQuery = !query ||
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.tagline.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    renderGrid(filtered);
  }

  function setupSearch() {
    const input = document.getElementById('skillSearch');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterSkills, 200);
    });
  }

  // ─── Modal ──────────────────────────────────
  function setupModal() {
    const modal = document.getElementById('skillModal');
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(skill) {
    const modal = document.getElementById('skillModal');
    if (!modal) return;

    const color = CATEGORY_COLORS[skill.category] || 'lime';
    const cssColor = COLOR_CSS[color];

    // Populate
    document.getElementById('modalName').textContent = skill.name;
    document.getElementById('modalTagline').textContent = skill.tagline;
    document.getElementById('modalTagline').style.color = cssColor;
    
    // Detailed story sections
    const whatEl = document.getElementById('modalWhat');
    const whenEl = document.getElementById('modalWhen');
    const whyEl = document.getElementById('modalWhy');
    const bestEl = document.getElementById('modalBest');
    
    if (whatEl) whatEl.innerHTML = skill.whatIsIt || skill.description || '';
    if (whenEl) whenEl.innerHTML = skill.whenToUse || '';
    if (whyEl) whyEl.innerHTML = skill.whyToUse || '';
    if (bestEl) bestEl.innerHTML = skill.bestPractice || '';
    
    // Hide empty sections
    document.querySelectorAll('.story-section').forEach(sec => {
      const p = sec.querySelector('p');
      sec.style.display = p && p.innerHTML.trim() ? 'block' : 'none';
      if (sec.style.display === 'block') {
         sec.style.marginBottom = '16px';
         sec.querySelector('h3').style.marginBottom = '8px';
         sec.querySelector('h3').style.fontSize = '1.05rem';
         sec.querySelector('h3').style.color = 'var(--text-1)';
         sec.querySelector('p').style.fontSize = '0.95rem';
         sec.querySelector('p').style.lineHeight = '1.6';
         sec.querySelector('p').style.color = 'var(--text-2)';
      }
    });

    const promptEl = document.getElementById('modalPrompt');
    if (promptEl) promptEl.textContent = `"${skill.prompt}"`;

    // Icon
    const iconEl = document.getElementById('modalIcon');
    iconEl.innerHTML = '';
    iconEl.setAttribute('data-lucide', skill.icon);
    iconEl.style.color = cssColor;

    // Related skills
    const relatedContainer = document.getElementById('modalRelated');
    relatedContainer.innerHTML = '';
    (skill.related || []).forEach(relId => {
      const relSkill = catalog.find(s => s.id === relId);
      if (relSkill) {
        const chip = document.createElement('span');
        chip.className = 'skill-modal__related-chip';
        chip.textContent = relSkill.name;
        chip.addEventListener('click', () => openModal(relSkill));
        relatedContainer.appendChild(chip);
      }
    });

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    if (window.lucide) lucide.createIcons();
  }

  function closeModal() {
    const modal = document.getElementById('skillModal');
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  // Listen for language changes from kit.js
  document.addEventListener('languageChanged', (e) => {
    const t = e.detail.translations;
    if (!t || !t.skillsPage) return;
    
    translations = t;
    const sp = t.skillsPage;
    catalog = sp.catalog || [];
    categories = sp.categories || [];
    
    const searchInput = document.getElementById('skillSearch');
    if (searchInput && sp.searchPlaceholder) {
      searchInput.placeholder = sp.searchPlaceholder;
    }
    
    if (activeCategory >= categories.length) {
       activeCategory = 0;
    }
    
    renderCategories();
    filterSkills();
  });

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
