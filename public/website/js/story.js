/* ============================================
   CodyMaster Story — Interactive JavaScript v5
   ENHANCED: Typing · Copy · Progress · Stagger
   ============================================ */

(function() {
  'use strict';

  // ========================================
  // Ocean Particle Background
  // ========================================
  function initOceanParticles() {
    const canvas = document.getElementById('ocean-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.2 - 0.1;
        this.opacity = Math.random() * 0.3 + 0.05;
        const colors = [
          [6, 182, 212],
          [34, 211, 238],
          [16, 185, 129],
          [52, 211, 153],
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.01 + Date.now() * 0.0005) * 0.2;
        if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) {
          this.reset();
          this.y = this.speedY < 0 ? h : 0;
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${this.opacity})`;
        ctx.fill();
      }
    }

    const count = window.innerWidth < 768 ? 30 : 60;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ========================================
  // Scroll Progress Bar
  // ========================================
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ========================================
  // Counter Animation (for crisis stats)
  // ========================================
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          if (target === 0) {
            el.textContent = '∞';
            observer.unobserve(el);
            return;
          }
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el, target) {
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo for snappier feel
      const eased = 1 - Math.pow(2, -10 * progress);
      const current = Math.round(target * eased);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  // ========================================
  // Nightmare Card Flip (mobile tap support)
  // ========================================
  function initNightmareCards() {
    const cards = document.querySelectorAll('.nightmare-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (window.matchMedia('(hover: none)').matches) {
          card.classList.toggle('flipped');
        }
      });
    });
  }

  // ========================================
  // Enhanced Scroll Reveal with Stagger
  // ========================================
  function initScrollReveal() {
    const elements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .stagger');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  // ========================================
  // Smooth Chapter Navigation
  // ========================================
  function initChapterNav() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ========================================
  // Terminal Typing Animation
  // ========================================
  function initTerminalTyping() {
    const terminalText = document.getElementById('terminal-text');
    const terminalCursor = document.getElementById('terminal-cursor');
    const terminalOutput = document.getElementById('terminal-output');
    if (!terminalText) return;

    const command = 'curl -sL codymaster.dev/install | bash';
    let typed = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !typed) {
          typed = true;
          typeCommand(terminalText, terminalCursor, terminalOutput, command);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    const block = document.getElementById('terminal-block');
    if (block) observer.observe(block);
  }

  function typeCommand(textEl, cursorEl, outputEl, command) {
    let i = 0;
    const speed = 40;

    function type() {
      if (i < command.length) {
        textEl.textContent += command[i];
        i++;
        setTimeout(type, speed + Math.random() * 30);
      } else {
        // Typing done — hide cursor, show output
        setTimeout(() => {
          if (cursorEl) cursorEl.style.display = 'none';
          if (outputEl) outputEl.classList.add('visible');
        }, 500);
      }
    }

    // Start with a small delay
    setTimeout(type, 600);
  }

  // ========================================
  // Copy to Clipboard
  // ========================================
  function initCopyButton() {
    const btn = document.getElementById('copy-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const command = btn.dataset.command || '';
      try {
        await navigator.clipboard.writeText(command);
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = command;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  }

  // ========================================
  // Init All
  // ========================================
  document.addEventListener('DOMContentLoaded', () => {
    initOceanParticles();
    initScrollProgress();
    initCounters();
    initNightmareCards();
    initScrollReveal();
    initChapterNav();
    initTerminalTyping();
    initCopyButton();
  });

})();
