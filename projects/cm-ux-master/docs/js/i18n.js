/* ============================================
   MasterDesign Agent — i18n System
   Supports 11 languages with auto-detection
   ============================================ */

const LANGS = [
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
    { code: 'zh', flag: '🇨🇳', label: '中文' },
    { code: 'ja', flag: '🇯🇵', label: '日本語' },
    { code: 'ko', flag: '🇰🇷', label: '한국어' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' },
    { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'id', flag: '🇮🇩', label: 'Bahasa' },
    { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' }
];

// Translation data loaded from external files
window.T = window.T || {};
let currentLang = 'en';

// Detect best language on first visit
function detectLang() {
    const stored = localStorage.getItem('ux-master-lang');
    if (stored && LANGS.find(l => l.code === stored)) return stored;
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    if (LANGS.find(l => l.code === nav)) return nav;
    return 'en';
}

// Apply translations to all [data-i18n] elements
function applyLang(code) {
    if (!window.T[code]) return;
    currentLang = code;
    document.documentElement.lang = code;
    localStorage.setItem('ux-master-lang', code);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = window.T[code][key];
        if (val) el.innerHTML = val;
    });

    // Update dropdown label
    const info = LANGS.find(l => l.code === code);
    const label = document.getElementById('currentLangLabel');
    if (label && info) label.textContent = info.flag + ' ' + info.code.toUpperCase();

    // Mark active in menu
    document.querySelectorAll('.lang-menu button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === code);
    });
}

function setLang(code) {
    applyLang(code);
    closeLangMenu();
}

function toggleLangMenu() {
    document.getElementById('langMenu').classList.toggle('open');
}

function closeLangMenu() {
    const m = document.getElementById('langMenu');
    if (m) m.classList.remove('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-dropdown')) closeLangMenu();
});

// Load a translation module
function loadTranslation(code, data) {
    window.T[code] = data;
}

// Initialize after all translation scripts are loaded
function initI18n() {
    currentLang = detectLang();
    applyLang(currentLang);
}
