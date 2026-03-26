/**
 * CM Growth Hacking — BottomSheetEngine
 * 
 * Universal bottom sheet component.
 * Create, show, hide, swipe-to-dismiss, multi-step content.
 * Zero dependencies.
 * 
 * Usage:
 *   const sheet = new BottomSheetEngine({
 *     id: 'booking',
 *     size: 'standard',
 *     content: '<h3>Đặt Lịch</h3>...',
 *     backdrop: false,
 *     onDismiss: () => trackEngagement('cro_sheet_dismissed'),
 *     onShow: () => trackEngagement('cro_sheet_shown'),
 *   });
 *   sheet.show();
 */

(function () {
  'use strict';

  const SWIPE_THRESHOLD = 80;    // px to trigger dismiss
  const VELOCITY_THRESHOLD = 0.5; // px/ms for fast swipe

  class BottomSheetEngine {
    constructor(config) {
      this.config = {
        id: config.id || 'eng-sheet-' + Date.now(),
        size: config.size || 'standard',       // compact | standard | full
        content: config.content || '',
        backdrop: config.backdrop ?? false,     // show backdrop overlay
        dismissible: config.dismissible ?? true,
        swipeToDismiss: config.swipeToDismiss ?? true,
        closeButton: config.closeButton ?? true,
        ariaLabel: config.ariaLabel || 'Dialog',
        desktopPosition: config.desktopPosition || 'center', // center | right
        onDismiss: config.onDismiss || null,
        onShow: config.onShow || null,
      };

      this.el = null;
      this.backdropEl = null;
      this.isVisible = false;
      this._previousFocus = null;
      this._shownAt = null;

      // Touch tracking
      this._startY = 0;
      this._startTime = 0;
      this._currentY = 0;

      this._build();
    }

    // ─── DOM Construction ───────────────────────────────
    _build() {
      // Backdrop
      if (this.config.backdrop) {
        this.backdropEl = document.createElement('div');
        this.backdropEl.className = 'eng-backdrop';
        this.backdropEl.dataset.sheetId = this.config.id;
        if (this.config.dismissible) {
          this.backdropEl.addEventListener('click', () => this.hide());
        }
      }

      // Sheet
      this.el = document.createElement('div');
      this.el.className = `eng-sheet eng-sheet--${this.config.size}`;
      if (this.config.desktopPosition === 'right') {
        this.el.classList.add('eng-sheet--desktop-right');
      }
      this.el.dataset.sheetId = this.config.id;
      this.el.setAttribute('role', 'dialog');
      this.el.setAttribute('aria-modal', this.config.backdrop ? 'true' : 'false');
      this.el.setAttribute('aria-label', this.config.ariaLabel);

      const inner = document.createElement('div');
      inner.className = 'eng-sheet__inner';

      // Handle
      const handle = document.createElement('div');
      handle.className = 'eng-sheet__handle';
      handle.setAttribute('aria-hidden', 'true');
      const handleBar = document.createElement('div');
      handleBar.className = 'eng-sheet__handle-bar';
      handle.appendChild(handleBar);
      inner.appendChild(handle);

      // Close button
      if (this.config.closeButton && this.config.dismissible) {
        const close = document.createElement('button');
        close.className = 'eng-sheet__close';
        close.setAttribute('aria-label', 'Đóng');
        close.textContent = '✕';
        close.addEventListener('click', () => this.hide());
        inner.appendChild(close);
      }

      // Content
      this._contentEl = document.createElement('div');
      this._contentEl.className = 'eng-sheet__content';
      this._contentEl.innerHTML = this.config.content;
      inner.appendChild(this._contentEl);

      this.el.appendChild(inner);

      // Touch events for swipe-to-dismiss
      if (this.config.swipeToDismiss) {
        this._initSwipe(handle);
      }

      // Keyboard: Escape to close
      if (this.config.dismissible) {
        this._onKeyDown = (e) => {
          if (e.key === 'Escape' && this.isVisible) {
            this.hide();
          }
        };
        document.addEventListener('keydown', this._onKeyDown);
      }
    }

    // ─── Swipe-to-Dismiss ───────────────────────────────
    _initSwipe(handle) {
      handle.addEventListener('touchstart', (e) => {
        this._startY = e.touches[0].clientY;
        this._startTime = Date.now();
        this.el.classList.add('dragging');
      }, { passive: true });

      handle.addEventListener('touchmove', (e) => {
        const dy = e.touches[0].clientY - this._startY;
        this._currentY = dy;
        if (dy > 0) {
          // Only allow downward drag
          this.el.style.transform = `translateY(${dy}px)`;
        }
      }, { passive: true });

      handle.addEventListener('touchend', () => {
        this.el.classList.remove('dragging');
        const elapsed = Date.now() - this._startTime;
        const velocity = this._currentY / elapsed; // px/ms

        if (this._currentY > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
          this.hide();
        } else {
          // Snap back
          this.el.style.transform = '';
          requestAnimationFrame(() => {
            this.el.classList.add('active');
          });
        }
        this._currentY = 0;
      }, { passive: true });
    }

    // ─── Public API ─────────────────────────────────────

    show() {
      if (this.isVisible) return;

      this._previousFocus = document.activeElement;
      this._shownAt = Date.now();

      // Append to DOM
      if (this.backdropEl) document.body.appendChild(this.backdropEl);
      document.body.appendChild(this.el);

      // Trigger animation (double rAF for initial paint)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.backdropEl) this.backdropEl.classList.add('active');
          this.el.classList.add('active');
          this.el.style.transform = '';
        });
      });

      this.isVisible = true;

      // Focus trap: focus the sheet
      const firstFocusable = this.el.querySelector('button, a, input, select, textarea');
      if (firstFocusable) firstFocusable.focus();

      if (typeof this.config.onShow === 'function') {
        this.config.onShow(this);
      }
    }

    hide() {
      if (!this.isVisible) return;

      if (this.backdropEl) this.backdropEl.classList.remove('active');
      this.el.classList.remove('active');
      this.el.style.transform = 'translateY(100%)';

      this.isVisible = false;

      const visibleDuration = this._shownAt ? Date.now() - this._shownAt : 0;

      // Remove from DOM after animation
      setTimeout(() => {
        if (this.backdropEl && this.backdropEl.parentNode) {
          this.backdropEl.remove();
        }
        if (this.el.parentNode) {
          this.el.remove();
        }
      }, 400);

      // Restore focus
      if (this._previousFocus) {
        this._previousFocus.focus();
      }

      if (typeof this.config.onDismiss === 'function') {
        this.config.onDismiss(this, visibleDuration);
      }
    }

    setContent(html) {
      if (this._contentEl) {
        this._contentEl.innerHTML = html;
      }
    }

    setSize(size) {
      this.el.classList.remove('eng-sheet--compact', 'eng-sheet--standard', 'eng-sheet--full');
      this.el.classList.add(`eng-sheet--${size}`);
    }

    destroy() {
      this.hide();
      if (this._onKeyDown) {
        document.removeEventListener('keydown', this._onKeyDown);
      }
      this.el = null;
      this.backdropEl = null;
    }
  }

  // ─── Toast Helper ───────────────────────────────────
  function showToast(type, message, duration) {
    const toast = document.createElement('div');
    toast.className = `eng-toast eng-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('active');
      });
    });

    const autoDismiss = duration || (type === 'success' ? 4000 : type === 'error' ? 8000 : 5000);

    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, autoDismiss);
  }

  // ─── Export ─────────────────────────────────────────
  window.BottomSheetEngine = BottomSheetEngine;
  window.showEngToast = showToast;

})();
