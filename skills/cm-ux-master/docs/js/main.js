/* ============================================
   MasterDesign Agent — Main Scripts
   Scroll reveal, counters, sharing, mobile menu
   ============================================ */

// --- Scroll Reveal ---
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 60);
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// --- Counter Animation ---
function animateCounters() {
    document.querySelectorAll('[data-target]').forEach((el) => {
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const duration = 1400;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    });
}

const heroObserver = new IntersectionObserver(
    (entries) => {
        if (entries[0].isIntersecting) {
            animateCounters();
            heroObserver.disconnect();
        }
    },
    { threshold: 0.3 }
);

const statEl = document.querySelector('.stat-value');
if (statEl) heroObserver.observe(statEl.closest('div').parentElement);

// --- Share Functions ---
const shareText =
    'MasterDesign Agent — turn any AI into a professional design studio. 838+ rules, 48 UX Laws. Free forever.';
const shareUrl = window.location.href;

function shareTwitter() {
    window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank'
    );
}

function shareLinkedIn() {
    window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        '_blank'
    );
}

function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = 'Copy Link'), 2000);
    });
}

// --- Mobile Menu ---
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
}

window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMobileMenu();
});

// --- Theme Switcher ---
let defaultTheme = localStorage.getItem('theme');
if (!defaultTheme) {
    const hour = new Date().getHours();
    defaultTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

function setTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        document.documentElement.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.documentElement.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    setTheme(isLight ? 'dark' : 'light');
}

// Run immediately
setTheme(defaultTheme);
