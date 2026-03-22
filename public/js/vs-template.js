// vs-template.js — Shared nav & footer for vs-detail pages
(function() {
  const NAV_HTML = `<nav class="nav" id="nav">
    <a href="index.html" class="nav__logo"><span class="nav__logo-icon">⚡</span><span>CodyMaster</span></a>
    <ul class="nav__links" id="navLinks">
      <li><a href="brain.html" class="nav__link nav__link--brain"><span data-i18n="nav.brain">Brain</span></a></li>
      <li><a href="playbook.html" class="nav__link" data-i18n="nav.playbook">Playbook</a></li>
      <li><a href="skills.html" class="nav__link" data-i18n="nav.skills">Skills</a></li>
      <li class="nav-dropdown"><button class="nav-dropdown__toggle"><span data-i18n="nav.personas">For You</span><i data-lucide="chevron-down" style="width:14px;height:14px;"></i></button>
        <div class="nav-dropdown__menu">
          <a href="for-founders.html" class="nav-dropdown__item"><span class="lang-flag">🚀</span> <span data-i18n="personas.cards.0.title">For Founders</span></a>
          <a href="for-cmos.html" class="nav-dropdown__item"><span class="lang-flag">📢</span> <span data-i18n="personas.cards.1.title">For CMOs</span></a>
          <a href="for-pms.html" class="nav-dropdown__item"><span class="lang-flag">📋</span> <span data-i18n="personas.cards.2.title">For PMs</span></a>
          <a href="for-tech-teams.html" class="nav-dropdown__item"><span class="lang-flag">💻</span> <span data-i18n="personas.cards.3.title">For Tech Teams</span></a>
          <a href="for-designers.html" class="nav-dropdown__item"><span class="lang-flag">🎨</span> <span data-i18n="personas.cards.4.title">For Designers</span></a>
          <a href="for-claw-family.html" class="nav-dropdown__item"><span class="lang-flag">🦞</span> <span data-i18n="personas.cards.5.title">For Claw Family</span></a>
        </div>
      </li>
      <li><a href="cli.html" class="nav__link" data-i18n="nav.cli">CLI</a></li>
      <li><a href="/docs/" class="nav__link" data-i18n="nav.docs">Docs</a></li>
      <li><a href="story.html" class="nav__link" data-i18n="nav.story">Our Story</a></li>
      <li><div class="lang-switcher" id="lang-switcher"><button class="lang-btn" id="lang-toggle" aria-label="Select language" aria-expanded="false"><span class="lang-btn-icon">🌍</span><span class="lang-btn-text" id="lang-btn-text">EN</span><span class="lang-btn-caret">▾</span></button>
        <div class="lang-menu" id="lang-menu">
          <button class="lang-option" data-lang="en"><span class="lang-flag">🇬🇧</span> <span class="lang-name">English</span></button>
          <button class="lang-option" data-lang="vi"><span class="lang-flag">🇻🇳</span> <span class="lang-name">Tiếng Việt</span></button>
          <button class="lang-option" data-lang="zh"><span class="lang-flag">🇨🇳</span> <span class="lang-name">中文</span></button>
          <button class="lang-option" data-lang="ru"><span class="lang-flag">🇷🇺</span> <span class="lang-name">Русский</span></button>
          <button class="lang-option" data-lang="ko"><span class="lang-flag">🇰🇷</span> <span class="lang-name">한국어</span></button>
          <button class="lang-option" data-lang="hi"><span class="lang-flag">🇮🇳</span> <span class="lang-name">हिन्दी</span></button>
        </div></div></li>
      <li><a href="start.html" class="nav__cta" data-i18n="nav.getStarted">Get Started</a></li>
    </ul>
    <div class="nav__hamburger" id="hamburger"><span></span><span></span><span></span></div>
  </nav>`;

  const FOOTER_HTML = `<footer class="footer">
    <div class="footer__grid">
      <div class="footer__brand"><span class="footer__logo">⚡ CodyMaster Kit</span><p class="footer__tagline" data-i18n="footer.tagline">Turn Ideas into Products 10x Faster</p></div>
      <div class="footer__links"><a href="index.html" data-i18n="footer.home">Home</a><a href="skills.html" data-i18n="footer.skills">Skills</a><a href="start.html" data-i18n="footer.start">Get Started</a></div>
    </div>
    <div class="footer__bottom"><p data-i18n="footer.copy">© 2026 CodyMaster Kit. Free & Open Source.</p></div>
  </footer>`;

  // Inject nav at document start, footer before scripts
  document.addEventListener('DOMContentLoaded', function() {
    const navEl = document.getElementById('vs-nav');
    const footerEl = document.getElementById('vs-footer');
    if (navEl) navEl.innerHTML = NAV_HTML;
    if (footerEl) footerEl.innerHTML = FOOTER_HTML;

    // Reveal animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    if (window.lucide) lucide.createIcons();
  });
})();
