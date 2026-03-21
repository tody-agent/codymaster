/**
 * Voice CRO System — AI Sales Consultant (1-chiều)
 * Trigger-based bottom sheet + pre-generated MP3 + TTS fallback
 * Config-driven, per-page voice scripts & triggers
 */

(function () {
    'use strict';

    /* ─── Page Config ─── */
    const CONFIG = {
        '/': {
            delay: 20000, scroll: 0.30,
            audio: ['/audio/homepage-intro.mp3', '/audio/homepage-full.mp3'],
            sheetIcon: '🎧',
            sheetText: 'Bạn muốn nghe giới thiệu nhanh về dịch vụ?',
            ctaText: 'Đặt Lịch Ngay', ctaHref: '#uu-dai'
        },
        '/index.html': null, // alias → use '/'
        '/tri-lieu-co-vai-gay.html': {
            delay: 15000, scroll: 0.25,
            audio: ['/audio/vai-gay-intro.mp3', '/audio/vai-gay-full.mp3'],
            sheetIcon: '💆',
            sheetText: 'Đau vai gáy lâu rồi? Nghe tư vấn nhanh từ chuyên gia',
            ctaText: 'Đặt Lịch Ngay', ctaHref: '#dat-lich'
        },
        '/tri-mat-ngu.html': {
            delay: 18000, scroll: 0.30,
            audio: ['/audio/mat-ngu-intro.mp3', '/audio/mat-ngu-full.mp3'],
            sheetIcon: '🌙',
            sheetText: 'Mất ngủ kiệt sức? Dưỡng sinh tạng giúp lấy lại giấc ngủ sâu',
            ctaText: 'Đặt Lịch Dưỡng Sinh', ctaHref: '#dat-lich',
            checkboxTrigger: { selector: '.check-item input[type=checkbox]', minChecked: 2 }
        },
        '/tri-lieu-dau-lung-xuong-khop.html': {
            delay: 20000, scroll: 0.35,
            audio: ['/audio/dau-lung-intro.mp3', '/audio/dau-lung-full.mp3'],
            sheetIcon: '🦴',
            sheetText: 'Tìm hiểu cho bố mẹ? Nghe tư vấn an toàn từ chuyên gia',
            ctaText: 'Tư Vấn Miễn Phí', ctaHref: '#dat-lich'
        },
        '/phuc-hoi-the-thao.html': {
            delay: 12000, scroll: 0.20,
            audio: ['/audio/the-thao-intro.mp3', '/audio/the-thao-full.mp3'],
            sheetIcon: '💪',
            sheetText: 'DOMS kéo dài? Massage Đông y giúp recovery thật sự',
            ctaText: 'Đặt Lịch Massage', ctaHref: '#dat-lich'
        },
        '/cham-soc-me-sau-sinh.html': {
            delay: 18000, scroll: 0.25,
            audio: ['/audio/me-sau-sinh-intro.mp3', '/audio/me-sau-sinh-full.mp3'],
            sheetIcon: '💝',
            sheetText: 'Mẹ ơi, mẹ xứng đáng được chăm sóc',
            ctaText: 'Đặt Lịch Cho Mẹ', ctaHref: '#dat-lich'
        },
        '/thu-gian-premium.html': {
            delay: 22000, scroll: 0.35,
            audio: ['/audio/premium-intro.mp3', '/audio/premium-full.mp3'],
            sheetIcon: '✦',
            sheetText: 'Tìm kiếm trải nghiệm dưỡng sinh toàn diện?',
            ctaText: 'Đặt Lịch Dưỡng Sinh', ctaHref: '#dat-lich'
        },
        '/khoa-hoc-bam-huyet.html': {
            delay: 25000, scroll: 0.40,
            audio: ['/audio/khoa-hoc-intro.mp3', '/audio/khoa-hoc-full.mp3'],
            sheetIcon: '📚',
            sheetText: 'Muốn chuyển nghề? Nghe chia sẻ từ học viên',
            ctaText: 'Đăng Ký Tư Vấn', ctaHref: '#dat-lich'
        }
    };

    /* ─── State ─── */
    const STATE_KEY = 'voiceCroDismissed';
    const STATS_KEY = 'voiceCroStats';
    let currentAudio = null;
    let sheetEl = null;
    let playerEl = null;
    let isPlaying = false;
    let playingPart = 0; // 0=none, 1=intro, 2=full

    /* ─── Helpers ─── */
    function getPageConfig() {
        const path = window.location.pathname;
        // Try exact match, then alias, then root
        let cfg = CONFIG[path];
        if (cfg === null && CONFIG['/']) cfg = CONFIG['/']; // alias
        if (!cfg && path === '/') cfg = CONFIG['/'];
        return cfg || null;
    }

    function isDismissed() {
        try { return sessionStorage.getItem(STATE_KEY) === '1'; } catch { return false; }
    }

    function setDismissed() {
        try { sessionStorage.setItem(STATE_KEY, '1'); } catch { /* noop */ }
    }

    function trackStat(event) {
        try {
            const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
            const page = window.location.pathname;
            if (!stats[page]) stats[page] = {};
            stats[page][event] = (stats[page][event] || 0) + 1;
            stats[page].lastSeen = Date.now();
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch { /* noop */ }
    }

    function getScrollPercent() {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        return h > 0 ? window.scrollY / h : 0;
    }

    /* ─── Audio Playback ─── */
    function playAudio(src, onEnd) {
        stopAudio();
        currentAudio = new Audio(src);
        currentAudio.volume = 0.85;
        currentAudio.addEventListener('ended', () => {
            isPlaying = false;
            if (onEnd) onEnd();
            updatePlayerUI();
        });
        currentAudio.addEventListener('error', () => {
            isPlaying = false;
            if (onEnd) onEnd();
            updatePlayerUI();
        });
        const playPromise = currentAudio.play();
        if (playPromise) {
            playPromise.then(() => {
                isPlaying = true;
                updatePlayerUI();
            }).catch(() => {
                isPlaying = false;
                updatePlayerUI();
            });
        }
    }

    function stopAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        isPlaying = false;
    }

    function togglePause() {
        if (!currentAudio) return;
        if (currentAudio.paused) {
            currentAudio.play();
            isPlaying = true;
        } else {
            currentAudio.pause();
            isPlaying = false;
        }
        updatePlayerUI();
    }

    /* ─── Bottom Sheet ─── */
    function createSheet(cfg) {
        const el = document.createElement('div');
        el.className = 'vcro-sheet';
        el.innerHTML = `
      <div class="vcro-sheet-inner">
        <button class="vcro-sheet-close" aria-label="Đóng">✕</button>
        <div class="vcro-sheet-icon">${cfg.sheetIcon}</div>
        <p class="vcro-sheet-text">${cfg.sheetText}</p>
        <div class="vcro-sheet-actions">
          <button class="vcro-sheet-listen btn btn-primary btn-sm">🔊 Nghe Ngay</button>
          <button class="vcro-sheet-dismiss btn btn-outline btn-sm">Để Sau</button>
        </div>
      </div>
    `;

        // Close
        el.querySelector('.vcro-sheet-close').addEventListener('click', () => dismiss(el));
        el.querySelector('.vcro-sheet-dismiss').addEventListener('click', () => dismiss(el));

        // Listen
        el.querySelector('.vcro-sheet-listen').addEventListener('click', () => {
            trackStat('listen');
            el.classList.remove('active');
            setTimeout(() => el.remove(), 400);
            playIntro(cfg);
        });

        // Swipe down to dismiss (mobile)
        let startY = 0;
        el.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
        el.addEventListener('touchmove', (e) => {
            const dy = e.touches[0].clientY - startY;
            if (dy > 60) dismiss(el);
        }, { passive: true });

        document.body.appendChild(el);
        // Animate in
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('active')));
        sheetEl = el;
        trackStat('shown');
    }

    function dismiss(el) {
        setDismissed();
        trackStat('dismissed');
        el.classList.remove('active');
        setTimeout(() => el.remove(), 400);
    }

    /* ─── Mini Player Bar ─── */
    function createPlayer(cfg) {
        const el = document.createElement('div');
        el.className = 'vcro-player';
        el.innerHTML = `
      <div class="vcro-player-inner">
        <button class="vcro-player-toggle" aria-label="Play/Pause">
          <span class="vcro-player-icon">⏸</span>
        </button>
        <div class="vcro-player-info">
          <span class="vcro-player-label">Đang phát...</span>
          <div class="vcro-player-progress"><div class="vcro-player-bar"></div></div>
        </div>
        <button class="vcro-player-next btn btn-primary btn-sm" style="display:none;">Nghe Tiếp</button>
        <a href="${cfg.ctaHref}" class="vcro-player-cta btn btn-primary btn-sm">${cfg.ctaText}</a>
        <button class="vcro-player-close" aria-label="Đóng">✕</button>
      </div>
    `;

        el.querySelector('.vcro-player-toggle').addEventListener('click', togglePause);
        el.querySelector('.vcro-player-close').addEventListener('click', () => {
            stopAudio();
            el.classList.remove('active');
            setTimeout(() => el.remove(), 400);
            playerEl = null;
        });

        // Next button → play full audio
        el.querySelector('.vcro-player-next').addEventListener('click', () => {
            trackStat('listenFull');
            playingPart = 2;
            el.querySelector('.vcro-player-next').style.display = 'none';
            el.querySelector('.vcro-player-label').textContent = 'Nghe tư vấn chi tiết...';
            playAudio(cfg.audio[1], () => {
                el.querySelector('.vcro-player-label').textContent = 'Cảm ơn bạn đã lắng nghe!';
                el.querySelector('.vcro-player-icon').textContent = '✓';
                el.querySelector('.vcro-player-cta').style.display = 'inline-flex';
            });
        });

        document.body.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('active')));
        playerEl = el;

        // Progress tracking
        startProgressTracking();
    }

    function updatePlayerUI() {
        if (!playerEl) return;
        const icon = playerEl.querySelector('.vcro-player-icon');
        if (isPlaying) {
            icon.textContent = '⏸';
        } else if (currentAudio && !currentAudio.ended) {
            icon.textContent = '▶';
        }
    }

    function startProgressTracking() {
        const update = () => {
            if (!currentAudio || !playerEl) return;
            const bar = playerEl.querySelector('.vcro-player-bar');
            if (bar && currentAudio.duration) {
                bar.style.width = (currentAudio.currentTime / currentAudio.duration * 100) + '%';
            }
            if (isPlaying) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
        // Also re-trigger on play
        if (currentAudio) {
            currentAudio.addEventListener('play', () => requestAnimationFrame(update));
        }
    }

    /* ─── Play Flow ─── */
    function playIntro(cfg) {
        playingPart = 1;
        createPlayer(cfg);
        playerEl.querySelector('.vcro-player-label').textContent = 'Nghe giới thiệu...';
        playerEl.querySelector('.vcro-player-cta').style.display = 'none';

        playAudio(cfg.audio[0], () => {
            // Intro done → show "Nghe Tiếp" button
            if (playerEl) {
                playerEl.querySelector('.vcro-player-label').textContent = 'Bạn muốn nghe thêm?';
                playerEl.querySelector('.vcro-player-next').style.display = 'inline-flex';
                playerEl.querySelector('.vcro-player-icon').textContent = '✓';
                playerEl.querySelector('.vcro-player-cta').style.display = 'inline-flex';
            }
        });
    }

    /* ─── Trigger Logic ─── */
    function initTrigger(cfg) {
        if (isDismissed()) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let timeReady = false;
        let scrollReady = false;
        let checkboxReady = false;
        let triggered = false;

        const tryTrigger = () => {
            if (triggered) return;
            // Normal path: time + scroll
            if (timeReady && scrollReady) {
                triggered = true;
                createSheet(cfg);
                return;
            }
            // Checkbox shortcut (mất ngủ page)
            if (checkboxReady) {
                triggered = true;
                createSheet(cfg);
            }
        };

        // Time trigger
        setTimeout(() => {
            timeReady = true;
            tryTrigger();
        }, cfg.delay);

        // Scroll trigger
        const onScroll = () => {
            if (getScrollPercent() >= cfg.scroll) {
                scrollReady = true;
                window.removeEventListener('scroll', onScroll);
                tryTrigger();
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        // Check immediately in case page is already scrolled
        onScroll();

        // Checkbox trigger (if configured)
        if (cfg.checkboxTrigger) {
            const checkboxes = document.querySelectorAll(cfg.checkboxTrigger.selector);
            if (checkboxes.length) {
                checkboxes.forEach(cb => {
                    cb.addEventListener('change', () => {
                        const checked = document.querySelectorAll(cfg.checkboxTrigger.selector + ':checked').length;
                        if (checked >= cfg.checkboxTrigger.minChecked) {
                            checkboxReady = true;
                            tryTrigger();
                        }
                    });
                });
            }
        }
    }

    /* ─── Init ─── */
    function init() {
        const cfg = getPageConfig();
        if (!cfg) return;

        // Verify audio files exist (preload)
        if (cfg.audio && cfg.audio.length) {
            const preload = new Audio();
            preload.preload = 'none'; // Just check existence later
            preload.src = cfg.audio[0];
        }

        // Don't compete with blog reader
        if (document.querySelector('.reader-player-bar.active')) return;

        initTrigger(cfg);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
