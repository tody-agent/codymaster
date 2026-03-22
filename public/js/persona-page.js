/* ============================================
   Persona Page — Dynamic Content Engine
   Reads ?p= query param, loads persona detail from i18n
   ============================================ */

(function () {
  'use strict';

  // ─── i18n Engine (standalone for this page) ────────
  const I18n = {
    currentLang: 'en',
    translations: {},

    async init() {
      const params = new URLSearchParams(window.location.search);
      const savedLang = localStorage.getItem('kit-lang');
      const browserLang = navigator.language?.startsWith('vi') ? 'vi' : 'en';
      this.currentLang = params.get('lang') || savedLang || browserLang;

      const [en, currentData] = await Promise.all([
        this.loadLang('en'),
        this.currentLang !== 'en' ? this.loadLang(this.currentLang) : Promise.resolve(null)
      ]);

      this.translations = { en };
      if (currentData && Object.keys(currentData).length > 0) {
        this.translations[this.currentLang] = currentData;
      } else if (this.currentLang !== 'en') {
        this.currentLang = 'en';
      }

      this.apply();
      this.setupSwitcher();
    },

    async loadLang(lang) {
      const namespaces = ['common', 'home', 'personas', 'skills', 'pages', 'vs'];
      try {
        const promises = namespaces.map(ns => fetch(`i18n/${lang}/${ns}.json`).then(r => r.ok ? r.json() : {}));
        const results = await Promise.all(promises);
        
        const merged = {};
        for (const data of results) {
          Object.assign(merged, data);
        }
        return Object.keys(merged).length > 0 ? merged : {};
      } catch (e) {
        console.warn(`Failed to load ${lang} translations`, e);
        return {};
      }
    },

    resolve(obj, path) {
      return path.split('.').reduce((acc, key) => acc?.[key], obj);
    },

    apply() {
      const t = this.translations[this.currentLang];
      const en = this.translations['en'];
      if (!t) return;

      // Update all data-i18n elements
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        let value = this.resolve(t, key);
        if (value === undefined && en) {
          value = this.resolve(en, key);
        }
        if (value !== undefined) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = value;
          } else {
            el.innerHTML = value.replace(/\n/g, '<br>');
          }
        }
      });

      document.documentElement.setAttribute('lang', this.currentLang);
      document.documentElement.setAttribute('data-lang', this.currentLang);

      // Update active button state
      document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
      });

      const codeMap = { en: 'EN', vi: 'VI', zh: 'ZH', ru: 'RU' };
      const toggleText = document.getElementById('lang-btn-text');
      if (toggleText && codeMap[this.currentLang]) {
        toggleText.textContent = codeMap[this.currentLang];
      }

      // Render persona content
      PersonaPage.render();
    },

    async switchTo(lang) {
      if (lang === this.currentLang) return;
      this.currentLang = lang;
      localStorage.setItem('kit-lang', lang);

      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);

      if (!this.translations[lang]) {
        this.translations[lang] = await this.loadLang(lang);
      }

      this.apply();
    },

    setupSwitcher() {
      const toggle = document.getElementById('lang-toggle');
      const menu = document.getElementById('lang-menu');
      const options = document.querySelectorAll('.lang-option');

      if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = menu.classList.contains('open');
          menu.classList.toggle('open');
          toggle.setAttribute('aria-expanded', !isOpen);
        });

        document.addEventListener('click', (e) => {
          if (!toggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      }

      options.forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          this.switchTo(lang);
          if (menu && toggle) {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }
  };

  // ─── Persona Page Renderer ─────────────────────────
  const PersonaPage = {
    personaId: null,

    init() {
      const params = new URLSearchParams(window.location.search);
      this.personaId = params.get('p');

      if (!this.personaId) {
        window.location.href = 'index.html#personas';
        return;
      }
    },

    render() {
      if (!this.personaId) return;

      const t = I18n.translations[I18n.currentLang];
      const en = I18n.translations['en'];

      const data = I18n.resolve(t, `personas.details.${this.personaId}`)
                || I18n.resolve(en, `personas.details.${this.personaId}`);

      if (!data) {
        window.location.href = 'index.html#personas';
        return;
      }

      // Accent colors per persona
      const accents = {
        founder: '#22d3ee',
        cmo: '#a78bfa',
        pm: '#34d399',
        dev: '#60a5fa',
        designer: '#f472b6',
        claw: '#fb923c'
      };
      const accent = accents[this.personaId] || '#22d3ee';
      document.documentElement.style.setProperty('--persona-accent', accent);

      // Update page title
      const cardData = I18n.resolve(t, 'personas.cards') || I18n.resolve(en, 'personas.cards') || [];
      const card = cardData.find(c => c.id === this.personaId);
      if (card) {
        document.title = `${card.title} — Cody Master Kit`;
      }

      this.renderHero(data);
      this.renderPains(data);
      this.renderSolutions(data);
      this.renderBeforeAfter(data);
      this.renderObjections(data);
      this.renderCTA(data);
    },

    renderHero(data) {
      const title = document.getElementById('personaHeroTitle');
      const sub = document.getElementById('personaHeroSub');
      if (title) title.innerHTML = data.heroTitle.replace(/\n/g, '<br>');
      if (sub) sub.textContent = data.heroSub;
    },

    renderPains(data) {
      const label = document.getElementById('personaPainLabel');
      const title = document.getElementById('personaPainTitle');
      const grid = document.getElementById('personaPainsGrid');

      if (label) label.textContent = data.painLabel;
      if (title) title.textContent = data.painTitle;
      if (!grid) return;

      grid.innerHTML = data.pains.map(pain => `
        <div class="persona-pain-card reveal">
          <span class="persona-pain-card__icon">${pain.icon}</span>
          <h3 class="persona-pain-card__title">${pain.title}</h3>
          <p class="persona-pain-card__desc">${pain.desc}</p>
        </div>
      `).join('');
    },

    renderSolutions(data) {
      const label = document.getElementById('personaSolutionLabel');
      const title = document.getElementById('personaSolutionTitle');
      const grid = document.getElementById('personaSolutionsGrid');

      if (label) label.textContent = data.solutionLabel;
      if (title) title.textContent = data.solutionTitle;
      if (!grid) return;

      grid.innerHTML = data.solutions.map(sol => `
        <div class="persona-solution-card reveal">
          <div class="persona-solution-card__skill">${sol.skill}</div>
          <p class="persona-solution-card__benefit">${sol.benefit}</p>
        </div>
      `).join('');
    },

    renderBeforeAfter(data) {
      const beforeList = document.getElementById('personaBefore');
      const afterList = document.getElementById('personaAfter');

      if (beforeList && data.beforeAfter?.before) {
        beforeList.innerHTML = data.beforeAfter.before.map(item =>
          `<li>${item}</li>`
        ).join('');
      }

      if (afterList && data.beforeAfter?.after) {
        afterList.innerHTML = data.beforeAfter.after.map(item =>
          `<li>${item}</li>`
        ).join('');
      }
    },

    renderObjections(data) {
      const list = document.getElementById('personaObjectionsList');
      if (!list || !data.objections) return;

      list.innerHTML = data.objections.map(obj => `
        <details class="persona-objection reveal">
          <summary class="persona-objection__q">${obj.q}</summary>
          <div class="persona-objection__a">${obj.a}</div>
        </details>
      `).join('');
    },

    renderCTA(data) {
      const title = document.getElementById('personaCtaTitle');
      const sub = document.getElementById('personaCtaSub');
      const btn = document.getElementById('personaCtaButton');

      if (title) title.innerHTML = data.ctaTitle.replace(/\n/g, '<br>');
      if (sub) sub.textContent = data.ctaSub;
      if (btn) btn.textContent = data.ctaButton;
    }
  };

  // ─── Scroll Reveal ─────────────────────────────────
  const ScrollReveal = {
    observer: null,

    init() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      this.observeAll();
    },

    observeAll() {
      document.querySelectorAll('.reveal').forEach(el => {
        this.observer.observe(el);
      });
    }
  };

  // ─── Navigation ────────────────────────────────────
  const Navigation = {
    init() {
      const nav = document.getElementById('nav');
      const hamburger = document.getElementById('hamburger');
      const navLinks = document.getElementById('navLinks');

      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });

      if (hamburger) {
        hamburger.addEventListener('click', () => {
          navLinks.classList.toggle('open');
          hamburger.classList.toggle('active');
        });

        navLinks.querySelectorAll('.nav__link').forEach(link => {
          link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('active');
          });
        });
      }
    }
  };

  // ─── Init ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    PersonaPage.init();
    await I18n.init();

    if (window.lucide) {
      lucide.createIcons();
    }

    Navigation.init();
    ScrollReveal.init();

    // Re-observe after dynamic content is rendered
    setTimeout(() => ScrollReveal.observeAll(), 100);
  });

})();
