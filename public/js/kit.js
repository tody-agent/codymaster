/* ============================================
   Cody Master Kit — Interactive Engine
   i18n · Scroll Animations · Counters · Tabs
   ============================================ */

(function () {
  'use strict';

  // ─── i18n Engine ────────────────────────────────
  const I18n = {
    currentLang: 'en',
    translations: {},

    async init() {
      // Detect language from URL params or localStorage
      const params = new URLSearchParams(window.location.search);
      const savedLang = localStorage.getItem('kit-lang');
      const browserLang = navigator.language?.startsWith('vi') ? 'vi' : 'en';
      this.currentLang = params.get('lang') || savedLang || browserLang;

      // Load default 'en' and the current language if it's different
      const [en, currentData] = await Promise.all([
        this.loadLang('en'),
        this.currentLang !== 'en' ? this.loadLang(this.currentLang) : Promise.resolve(null)
      ]);

      this.translations = { en };
      if (currentData && Object.keys(currentData).length > 0) {
        this.translations[this.currentLang] = currentData;
      } else if (this.currentLang !== 'en') {
        this.currentLang = 'en'; // Fallback
      }
      this.apply();
      this.setupSwitcher();
    },

    async loadLang(lang) {
      try {
        const res = await fetch(`i18n/${lang}.json`);
        return await res.json();
      } catch (e) {
        console.warn(`Failed to load ${lang} translations`, e);
        return {};
      }
    },

    // Resolve nested key like "features.cards.0.title"
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

      // Update meta tags
      if (t.meta) {
        document.title = t.meta.title || document.title;
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta && t.meta.description) {
          descMeta.setAttribute('content', t.meta.description);
        }
      }

      // Update HTML lang attribute
      document.documentElement.setAttribute('lang', this.currentLang);
      document.documentElement.setAttribute('data-lang', this.currentLang);

      // Rebuild dynamic content (skills tabs & cards, personas grid)
      Skills.render(t);
      PersonasGrid.render(t);
      if (typeof Typewriter !== 'undefined' && Typewriter.element) {
        Typewriter.updatePhrases();
      }

      // Update active button state
      document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
      });

      // Update toggle text
      const codeMap = { en: 'EN', vi: 'VI', zh: 'ZH', ru: 'RU', ko: 'KO', hi: 'HI' };
      const toggleText = document.getElementById('lang-btn-text');
      if (toggleText && codeMap[this.currentLang]) {
        toggleText.textContent = codeMap[this.currentLang];
      }

      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang, translations: t } }));
    },

    async switchTo(lang) {
      if (lang === this.currentLang) return;
      this.currentLang = lang;
      localStorage.setItem('kit-lang', lang);

      // Update URL without reload
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

      // Toggle menu
      if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = menu.classList.contains('open');
          menu.classList.toggle('open');
          toggle.setAttribute('aria-expanded', !isOpen);
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
          if (!toggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Option selection
      options.forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          this.switchTo(lang);
          
          // Close menu
          if (menu && toggle) {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }
  };

  // ─── Skills Section ─────────────────────────────
  const Skills = {
    activeCategory: 0,
    allCards: [],
    iconColors: ['lime', 'purple', 'blue', 'orange', 'cyan'],

    render(t) {
      if (!t?.skills) return;

      this.allCards = t.skills.cards || [];
      this.renderTabs(t.skills.categories);
      this.renderCards(this.allCards.filter(c => (c.categoryIndex ?? 0) === this.activeCategory));
    },

    renderTabs(categories) {
      const container = document.getElementById('skillsTabs');
      if (!container || !categories) return;

      container.innerHTML = '';
      categories.forEach((cat, i) => {
        const btn = document.createElement('button');
        btn.className = `skills__tab${i === this.activeCategory ? ' active' : ''}`;
        btn.textContent = cat;
        btn.addEventListener('click', () => {
          this.activeCategory = i;
          container.querySelectorAll('.skills__tab').forEach((t, j) => {
            t.classList.toggle('active', j === i);
          });
          this.renderCards(this.allCards.filter(c => (c.categoryIndex ?? 0) === i));
        });
        container.appendChild(btn);
      });
    },

    renderCards(cards) {
      const container = document.getElementById('skillsGrid');
      if (!container || !cards) return;

      container.innerHTML = '';
      cards.forEach((card, i) => {
        const color = this.iconColors[i % this.iconColors.length];
        const iconName = card.icon || 'zap';

        const icon = document.createElement('i');
        icon.dataset.lucide = iconName;
        icon.className = `skill-card__icon skill-card__icon--${color}`;

        const name = document.createElement('span');
        name.className = 'skill-card__name';
        name.textContent = card.name;

        const desc = document.createElement('span');
        desc.className = 'skill-card__desc';
        desc.textContent = card.description;

        const el = document.createElement('div');
        el.className = 'skill-card';
        el.appendChild(icon);
        el.appendChild(name);
        el.appendChild(desc);
        container.appendChild(el);
      });

      if (window.lucide) lucide.createIcons();
    }
  };

  // ─── Personas Grid (Homepage) ──────────────────────
  const PersonasGrid = {
    accentColors: {
      founder: '#22d3ee',
      cmo: '#a78bfa',
      pm: '#34d399',
      dev: '#60a5fa',
      designer: '#f472b6',
      claw: '#fb923c'
    },

    render(t) {
      const container = document.getElementById('personasGrid');
      if (!container || !t?.personas?.cards) return;

      const en = I18n.translations['en'];
      const learnMore = t.personas?.learnMore || en?.personas?.learnMore || 'Learn more →';
      const cards = t.personas.cards;

      const urlMap = {
        founder: 'for-founders.html',
        cmo: 'for-cmos.html',
        pm: 'for-pms.html',
        dev: 'for-tech-teams.html',
        designer: 'for-designers.html',
        claw: 'for-claw-family.html'
      };

      container.innerHTML = '';
      cards.forEach((card, i) => {
        const accent = this.accentColors[card.id] || '#22d3ee';
        const delay = i + 1;

        const el = document.createElement('a');
        el.href = urlMap[card.id] || `persona.html?p=${card.id}`;
        el.className = `persona-home-card reveal reveal-delay-${delay}`;
        el.style.setProperty('--card-accent', accent);
        el.innerHTML = `
          <div class="persona-home-card__header">
            <span class="persona-home-card__emoji">${card.emoji}</span>
            <h3 class="persona-home-card__title">${card.title}</h3>
            <p class="persona-home-card__tagline">${card.tagline}</p>
          </div>
          <ul class="persona-home-card__pains">
            ${card.pains.map(p => `<li>😤 ${p}</li>`).join('')}
          </ul>
          <p class="persona-home-card__dream">✨ ${card.dream}</p>
          <span class="persona-home-card__link">${learnMore}</span>
        `;
        container.appendChild(el);
      });

      // Re-initialize ScrollReveal for new elements
      if (ScrollReveal.observer) {
        container.querySelectorAll('.reveal').forEach(el => {
          ScrollReveal.observer.observe(el);
        });
      }
    }
  };

  // ─── Scroll Reveal ──────────────────────────────
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

      document.querySelectorAll('.reveal').forEach(el => {
        this.observer.observe(el);
      });
    }
  };

  // ─── Counter Animation ──────────────────────────
  const CounterAnimation = {
    animated: false,

    init() {
      const statsSection = document.getElementById('stats');
      if (!statsSection) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.animated) {
              this.animated = true;
              this.animateAll();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(statsSection);
    },

    animateAll() {
      document.querySelectorAll('.stat__number[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        this.animateNumber(el, 0, target, suffix, 1500);
      });
    },

    animateNumber(el, start, end, suffix, duration) {
      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);

        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    }
  };

  // ─── Typewriter Effect ──────────────────────────
  const Typewriter = {
    element: null,
    phrases: [],
    phraseIndex: 0,
    charIndex: 0,
    isDeleting: false,
    timer: null,
    typingSpeed: 100,
    deletingSpeed: 50,
    delayBetweenPhrases: 2000,

    init() {
      this.element = document.getElementById('hero-typing');
      if (!this.element) return;
      this.updatePhrases();
    },

    updatePhrases() {
      const t = I18n.translations[I18n.currentLang];
      const en = I18n.translations['en'];
      
      let phrases = I18n.resolve(t, 'hero.typingPhrases');
      if (!phrases && en) {
        phrases = I18n.resolve(en, 'hero.typingPhrases');
      }
      
      this.phrases = phrases || ['products'];
      this.phraseIndex = 0;
      this.charIndex = 0;
      this.isDeleting = false;
      if (this.element) this.element.textContent = '';
      
      const hiddenSpan = document.getElementById('hero-hidden');
      if (hiddenSpan && this.phrases.length > 0) {
        hiddenSpan.textContent = this.phrases[0];
      }

      clearTimeout(this.timer);
      this.type();
    },

    type() {
      if (!this.element || !this.phrases.length) return;

      const currentPhrase = this.phrases[this.phraseIndex % this.phrases.length];
      
      if (!this.isDeleting && this.charIndex === 0) {
        const hiddenSpan = document.getElementById('hero-hidden');
        if (hiddenSpan) {
          hiddenSpan.textContent = currentPhrase;
        }
      }

      if (this.isDeleting) {
        this.charIndex--;
      } else {
        this.charIndex++;
      }

      this.element.textContent = currentPhrase.substring(0, this.charIndex);

      let typeSpeed = this.isDeleting ? this.deletingSpeed : this.typingSpeed;

      if (!this.isDeleting) {
        typeSpeed += Math.random() * 50;
      }

      if (!this.isDeleting && this.charIndex === currentPhrase.length) {
        typeSpeed = this.delayBetweenPhrases;
        this.isDeleting = true;
      } else if (this.isDeleting && this.charIndex === 0) {
        this.isDeleting = false;
        this.phraseIndex++;
        typeSpeed = 500;
      }

      this.timer = setTimeout(() => this.type(), typeSpeed);
    }
  };

  // ─── Navigation ─────────────────────────────────
  const Navigation = {
    init() {
      const nav = document.getElementById('nav');
      const hamburger = document.getElementById('hamburger');
      const navLinks = document.getElementById('navLinks');

      // Sticky nav border on scroll
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });

      // Mobile hamburger toggle
      if (hamburger) {
        hamburger.addEventListener('click', () => {
          navLinks.classList.toggle('open');
          hamburger.classList.toggle('active');
        });

        // Close mobile menu on plain link click
        navLinks.querySelectorAll('.nav__link').forEach(link => {
          if (!link.classList.contains('nav-dropdown__toggle')) {
            link.addEventListener('click', () => {
              navLinks.classList.remove('open');
              hamburger.classList.remove('active');
            });
          }
        });

        // Mobile dropdown toggle (click to open)
        document.querySelectorAll('.nav-dropdown__toggle').forEach(toggle => {
          toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parent = toggle.closest('.nav-dropdown');
            parent.classList.toggle('active');
          });
        });
      }

      // Smooth scroll for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const href = anchor.getAttribute('href');
          if (href === '#') return;

          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }
  };

  // ─── Parallax Orbs ──────────────────────────────
  const Parallax = {
    init() {
      const orbs = document.querySelectorAll('.hero__orb');
      if (!orbs.length) return;

      window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        orbs.forEach((orb, i) => {
          const factor = (i + 1) * 15;
          orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
      }, { passive: true });
    }
  };

  // ─── Card Tilt Effect ───────────────────────────
  const CardTilt = {
    init() {
      document.querySelectorAll('.feature-card, .step-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          card.style.transform = `perspective(800px) rotateX(${y * -4}deg) rotateY(${x * 4}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }
  };

  // ─── Initialize Everything ──────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    // Init i18n first (populates dynamic content)
    await I18n.init();

    // Init Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Init all modules
    Typewriter.init();
    Navigation.init();
    ScrollReveal.init();
    CounterAnimation.init();
    Parallax.init();
    CardTilt.init();
  });

  // Expose I18n globally for page-specific scripts
  window.I18n = I18n;

})();
