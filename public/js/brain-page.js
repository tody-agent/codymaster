/* ============================================
   Brain Page — Animations & Interactions
   ============================================ */

(function () {
  'use strict';

  // Wait for kit.js to init I18n
  document.addEventListener('DOMContentLoaded', () => {
    // Animate decay bars on scroll
    const decaySection = document.getElementById('brainDecay');
    if (decaySection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              decaySection.querySelectorAll('.brain-decay__bar').forEach(bar => {
                const target = bar.dataset.width;
                if (target) {
                  bar.style.width = '0%';
                  requestAnimationFrame(() => {
                    bar.style.width = target;
                  });
                }
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(decaySection);
    }

    // Card tilt for brain-specific cards
    document.querySelectorAll('.brain-tier, .brain-heal__step, .brain-problem__card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${y * -3}deg) rotateY(${x * 3}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  });
})();
