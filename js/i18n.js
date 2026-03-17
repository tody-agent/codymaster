/**
 * CodyMaster i18n Engine v2
 * Multi-language support with:
 *   - Inline bundled data fallback (works on file:// protocol)
 *   - localStorage caching of selected language
 *   - IP-based geo-detection (via free API, http/https only)
 *   - Default: English
 */
const i18n = {
  currentLang: 'en',
  translations: {},
  supportedLangs: ['en', 'ru', 'zh', 'vi'],
  langNames: {
    en: 'English',
    ru: 'Русский',
    zh: '中文',
    vi: 'Tiếng Việt'
  },
  langFlags: {
    en: '🇬🇧',
    ru: '🇷🇺',
    zh: '🇨🇳',
    vi: '🇻🇳'
  },

  // Map country codes to supported languages
  _countryLangMap: {
    RU: 'ru', BY: 'ru', KZ: 'ru', UA: 'ru', KG: 'ru',
    CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', SG: 'zh',
    VN: 'vi',
  },

  async init(lang) {
    // Priority: explicit lang > localStorage > IP detection > browser lang > 'en'
    this.currentLang = lang || localStorage.getItem('cm-lang') || null;

    // If no cached lang, try IP-based detection (http/https only), then browser lang
    if (!this.currentLang) {
      this.currentLang = await this._detectLangByIP() || this._detectBrowserLang() || 'en';
    }

    if (!this.supportedLangs.includes(this.currentLang)) {
      this.currentLang = 'en';
    }

    // Save chosen language to localStorage
    localStorage.setItem('cm-lang', this.currentLang);

    // Load translations
    await this._loadTranslations(this.currentLang);

    this.apply();
    this._updateLangUI();
  },

  async _loadTranslations(lang) {
    // Strategy 1: Try fetch (works on http/https)
    try {
      const basePath = this._getBasePath();
      const res = await fetch(`${basePath}i18n/${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.translations = await res.json();
      return;
    } catch (e) {
      // Fetch failed (likely file:// protocol or network error)
    }

    // Strategy 2: Use bundled inline data (always works, even on file://)
    if (window.__I18N_DATA__ && window.__I18N_DATA__[lang]) {
      this.translations = window.__I18N_DATA__[lang];
      return;
    }

    // Strategy 3: Fallback to English via bundled data
    if (lang !== 'en' && window.__I18N_DATA__ && window.__I18N_DATA__['en']) {
      console.warn(`i18n: Failed to load ${lang}, falling back to en (bundled)`);
      this.translations = window.__I18N_DATA__['en'];
      this.currentLang = 'en';
      localStorage.setItem('cm-lang', 'en');
      return;
    }

    // Strategy 4: If nothing works, empty translations (show hardcoded HTML)
    console.warn('i18n: No translation data available');
    this.translations = {};
  },

  _getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/website/')) {
      return path.substring(0, path.indexOf('/website/') + '/website/'.length);
    }
    return './';
  },

  /**
   * Auto-detect language by IP via free geo API
   * Only runs on http/https (skipped on file://)
   */
  async _detectLangByIP() {
    if (window.location.protocol === 'file:') return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      const country = (data.country_code || '').toUpperCase();
      return this._countryLangMap[country] || null;
    } catch {
      return null;
    }
  },

  /**
   * Detect language from browser navigator.language
   */
  _detectBrowserLang() {
    const nav = navigator.language || navigator.userLanguage || '';
    const short = nav.split('-')[0].toLowerCase();
    return this.supportedLangs.includes(short) ? short : null;
  },

  t(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.translations) || `[${key}]`;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = this.t(el.dataset.i18n);
      if (val && !val.startsWith('[')) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = this.t(el.dataset.i18nHtml);
      if (val && !val.startsWith('[')) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = this.t(el.dataset.i18nPlaceholder);
      if (val && !val.startsWith('[')) el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const val = this.t(el.dataset.i18nTitle);
      if (val && !val.startsWith('[')) el.setAttribute('title', val);
    });
    document.documentElement.lang = this.currentLang;
    // Update page title
    const titleKey = document.querySelector('title')?.dataset?.i18n;
    if (titleKey) {
      const val = this.t(titleKey);
      if (val && !val.startsWith('[')) document.title = val;
    }
  },

  _updateLangUI() {
    // Update lang button text
    const btn = document.querySelector('.lang-btn-text');
    if (btn) {
      btn.textContent = `${this.langFlags[this.currentLang]} ${this.currentLang.toUpperCase()}`;
    }
    // Active state on options
    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === this.currentLang);
    });
  },

  async switchTo(lang) {
    if (!this.supportedLangs.includes(lang)) return;
    localStorage.setItem('cm-lang', lang);
    await this.init(lang);
  }
};
