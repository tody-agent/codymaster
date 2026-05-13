/**
 * Blog Audio Reader — Substack-inspired, simplified
 * Uses native SpeechSynthesis API (zero dependencies)
 * Reads only core content, strips CTA/tags/related
 */

(function () {
    'use strict';

    if (!('speechSynthesis' in window)) return;

    let synth = window.speechSynthesis;
    let utterances = [];
    let currentIdx = 0;
    let isPlaying = false;
    let isPaused = false;
    let playerBar = null;
    let triggerBtn = null;
    let articleTitle = '';

    /* ── Extract core text ── */

    function extractCoreText() {
        const article = document.getElementById('article-content');
        if (!article || !article.textContent.trim()) return '';

        const clone = article.cloneNode(true);
        // Strip non-content elements
        clone.querySelectorAll(
            '.blog-cta-box, .blog-tags, .blog-related, .contextual-cta-inner, ' +
            'script, style, nav, footer, iframe, img, video, audio, svg, figure, ' +
            '[aria-hidden="true"]'
        ).forEach(el => el.remove());

        return clone.innerText
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    /* ── Split text into chunks (browser TTS limit ~3000 chars) ── */

    function splitIntoChunks(text, maxLen) {
        maxLen = maxLen || 2500;
        const chunks = [];
        const sentences = text.split(/(?<=[.!?。？！\n])\s+/);
        let current = '';

        for (const sentence of sentences) {
            if ((current + ' ' + sentence).length > maxLen && current) {
                chunks.push(current.trim());
                current = sentence;
            } else {
                current += (current ? ' ' : '') + sentence;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        return chunks;
    }

    /* ── Pick best Vietnamese voice ── */

    function getViVoice() {
        const voices = synth.getVoices();
        // Prefer vi-VN voices
        const vi = voices.find(v => v.lang === 'vi-VN' && v.localService)
            || voices.find(v => v.lang === 'vi-VN')
            || voices.find(v => v.lang.startsWith('vi'));
        return vi || null;
    }

    /* ── Create utterances from chunks ── */

    function buildUtterances(text) {
        const chunks = splitIntoChunks(text);
        const voice = getViVoice();

        return chunks.map((chunk, i) => {
            const u = new SpeechSynthesisUtterance(chunk);
            u.lang = 'vi-VN';
            u.rate = 1.0;
            u.pitch = 1.0;
            if (voice) u.voice = voice;

            u.onend = function () {
                if (i < chunks.length - 1) {
                    currentIdx = i + 1;
                    synth.speak(utterances[currentIdx]);
                    updateProgress();
                } else {
                    stopReading();
                }
            };

            u.onerror = function () {
                stopReading();
            };

            return u;
        });
    }

    /* ── Player bar ── */

    function createPlayerBar() {
        if (playerBar) return;

        playerBar = document.createElement('div');
        playerBar.className = 'blog-reader-bar';
        playerBar.innerHTML = `
            <div class="reader-bar-inner">
                <div class="reader-bar-info">
                    <span class="reader-bar-icon">🔊</span>
                    <span class="reader-bar-title">${escText(articleTitle)}</span>
                </div>
                <div class="reader-bar-controls">
                    <button class="reader-bar-btn reader-btn-toggle" aria-label="Tạm dừng" title="Tạm dừng">
                        <svg class="icon-pause" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1"/>
                            <rect x="14" y="4" width="4" height="16" rx="1"/>
                        </svg>
                        <svg class="icon-play" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="reader-bar-btn reader-btn-close" aria-label="Đóng" title="Đóng">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="reader-bar-progress"><div class="reader-bar-progress-fill"></div></div>
        `;

        document.body.appendChild(playerBar);

        // Bind events
        playerBar.querySelector('.reader-btn-toggle').addEventListener('click', togglePause);
        playerBar.querySelector('.reader-btn-close').addEventListener('click', stopReading);

        // Animate in
        requestAnimationFrame(() => playerBar.classList.add('active'));
    }

    function showPlayerBar() {
        createPlayerBar();
        playerBar.classList.add('active');
        document.body.style.paddingBottom = '72px';
    }

    function hidePlayerBar() {
        if (!playerBar) return;
        playerBar.classList.remove('active');
        document.body.style.paddingBottom = '';
        setTimeout(() => {
            if (playerBar && !playerBar.classList.contains('active')) {
                playerBar.remove();
                playerBar = null;
            }
        }, 400);
    }

    function updateProgress() {
        if (!playerBar || !utterances.length) return;
        const pct = ((currentIdx + 1) / utterances.length) * 100;
        const fill = playerBar.querySelector('.reader-bar-progress-fill');
        if (fill) fill.style.width = pct + '%';
    }

    function updateToggleIcon() {
        if (!playerBar) return;
        const iconPause = playerBar.querySelector('.icon-pause');
        const iconPlay = playerBar.querySelector('.icon-play');
        const btn = playerBar.querySelector('.reader-btn-toggle');
        if (isPaused) {
            iconPause.style.display = 'none';
            iconPlay.style.display = '';
            btn.setAttribute('aria-label', 'Tiếp tục');
            btn.setAttribute('title', 'Tiếp tục');
        } else {
            iconPause.style.display = '';
            iconPlay.style.display = 'none';
            btn.setAttribute('aria-label', 'Tạm dừng');
            btn.setAttribute('title', 'Tạm dừng');
        }
    }

    /* ── Controls ── */

    function startReading() {
        const text = extractCoreText();
        if (!text) return;

        synth.cancel();
        utterances = buildUtterances(text);
        currentIdx = 0;
        isPlaying = true;
        isPaused = false;

        articleTitle = document.getElementById('article-title')?.textContent || 'Bài viết';
        showPlayerBar();
        updateToggleIcon();
        updateTriggerBtn();

        synth.speak(utterances[0]);
        updateProgress();

        // Chrome bug workaround: keep alive
        startKeepAlive();
    }

    function togglePause() {
        if (!isPlaying) return;

        if (isPaused) {
            synth.resume();
            isPaused = false;
        } else {
            synth.pause();
            isPaused = true;
        }
        updateToggleIcon();
        updateTriggerBtn();
    }

    function stopReading() {
        synth.cancel();
        isPlaying = false;
        isPaused = false;
        utterances = [];
        currentIdx = 0;
        hidePlayerBar();
        updateTriggerBtn();
        stopKeepAlive();
    }

    /* ── Chrome keep-alive (prevents TTS from stopping on long text) ── */

    let keepAliveTimer = null;

    function startKeepAlive() {
        stopKeepAlive();
        keepAliveTimer = setInterval(() => {
            if (synth.speaking && !synth.paused) {
                synth.pause();
                synth.resume();
            }
        }, 10000);
    }

    function stopKeepAlive() {
        if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = null;
        }
    }

    /* ── Trigger button ── */

    function updateTriggerBtn() {
        if (!triggerBtn) return;
        if (isPlaying && !isPaused) {
            triggerBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
            triggerBtn.classList.add('reading');
        } else if (isPlaying && isPaused) {
            triggerBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            triggerBtn.classList.add('reading');
        } else {
            triggerBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            triggerBtn.classList.remove('reading');
        }
    }

    function injectTriggerBtn() {
        const topbarActions = document.getElementById('detail-topbar-actions');
        if (!topbarActions) return;

        triggerBtn = document.createElement('button');
        triggerBtn.className = 'topbar-audio-btn';
        triggerBtn.setAttribute('aria-label', 'Nghe bài viết bằng giọng đọc');
        triggerBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
        triggerBtn.addEventListener('click', function () {
            if (!isPlaying) {
                startReading();
            } else if (isPaused) {
                togglePause();
            } else {
                togglePause();
            }
        });

        topbarActions.prepend(triggerBtn);
    }

    /* ── Helpers ── */

    function escText(str) {
        var d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    /* ── Init ── */

    function init() {
        // Only on detail page
        if (!document.getElementById('article-content')) return;

        // Wait for voices to load (async on some browsers)
        if (synth.getVoices().length === 0) {
            synth.addEventListener('voiceschanged', function onVoices() {
                synth.removeEventListener('voiceschanged', onVoices);
            });
        }

        // Wait for article content to be rendered by blog.js
        var observer = new MutationObserver(function (mutations, obs) {
            var content = document.getElementById('article-content');
            if (content && content.textContent.trim()) {
                obs.disconnect();
                injectTriggerBtn();
            }
        });

        observer.observe(document.getElementById('article-content'), {
            childList: true,
            subtree: true
        });

        // Fallback: if content already loaded
        var content = document.getElementById('article-content');
        if (content && content.textContent.trim()) {
            observer.disconnect();
            injectTriggerBtn();
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', function () {
            synth.cancel();
            stopKeepAlive();
        });
    }

    // Run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
