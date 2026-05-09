/**
 * CM Growth Hacking — TriggerManager
 * 
 * When to show the bottom sheet? This module decides.
 * Supports: scroll, time, exit-intent, click, return-visitor, interaction, dual.
 * 
 * Usage:
 *   const trigger = new TriggerManager({
 *     trigger: { type: 'scroll', value: 0.3 },
 *     session: { dismissKey: 'eng_booking_dismissed', storage: 'sessionStorage' },
 *     onTrigger: () => bookingSheet.show(),
 *   });
 *   trigger.init();
 */

(function () {
  'use strict';

  class TriggerManager {
    constructor(config) {
      this.config = config;
      this.triggered = false;
      this._listeners = [];
      this._timers = [];
    }

    // ─── Public API ─────────────────────────────────────
    init() {
      if (this._isDismissed()) return;
      if (this._respectsReducedMotion()) return;

      var type = this.config.trigger.type;

      switch (type) {
        case 'scroll':      this._initScroll(); break;
        case 'time':        this._initTime(); break;
        case 'exit':        this._initExitIntent(); break;
        case 'click':       this._initClick(); break;
        case 'return':      this._initReturnVisitor(); break;
        case 'interaction': this._initInteraction(); break;
        case 'dual':        this._initDual(); break;
        default:
          console.warn('[TriggerManager] Unknown trigger type:', type);
      }
    }

    fire() {
      if (this.triggered) return;
      this.triggered = true;
      this._cleanup();

      if (typeof this.config.onTrigger === 'function') {
        this.config.onTrigger();
      }
    }

    destroy() {
      this._cleanup();
      this.triggered = true;
    }

    // ─── Scroll Trigger ─────────────────────────────────
    _initScroll() {
      var self = this;
      var threshold = this.config.trigger.value || 0.3;
      var delay = this.config.trigger.delay || 0;

      var onScroll = function () {
        var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        var pct = window.scrollY / scrollHeight;

        if (pct >= threshold) {
          if (delay > 0) {
            var t = setTimeout(function () { self.fire(); }, delay);
            self._timers.push(t);
          } else {
            self.fire();
          }
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this._listeners.push({ el: window, event: 'scroll', fn: onScroll });

      // Check immediately
      onScroll();
    }

    // ─── Time Trigger ───────────────────────────────────
    _initTime() {
      var self = this;
      var delay = this.config.trigger.value || 15000;

      var t = setTimeout(function () { self.fire(); }, delay);
      this._timers.push(t);
    }

    // ─── Exit Intent (Desktop Only) ─────────────────────
    _initExitIntent() {
      // Touch devices don't have exit intent
      if ('ontouchstart' in window) {
        // Fallback: use time trigger
        this.config.trigger.value = this.config.trigger.fallbackDelay || 20000;
        this._initTime();
        return;
      }

      var self = this;
      var debounceTimer;

      var onMouseLeave = function (e) {
        if (e.clientY <= 0) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function () { self.fire(); }, 300);
        }
      };

      document.addEventListener('mouseleave', onMouseLeave);
      this._listeners.push({ el: document, event: 'mouseleave', fn: onMouseLeave });
    }

    // ─── Click Trigger ──────────────────────────────────
    _initClick() {
      var self = this;
      var selector = this.config.trigger.value;

      var elements = document.querySelectorAll(selector);
      elements.forEach(function (el) {
        var onClick = function (e) {
          e.preventDefault();
          self.fire();
        };
        el.addEventListener('click', onClick);
        self._listeners.push({ el: el, event: 'click', fn: onClick });
      });
    }

    // ─── Return Visitor ─────────────────────────────────
    _initReturnVisitor() {
      var self = this;
      var VISIT_KEY = 'eng_visit_count';
      var minVisits = this.config.trigger.value || 2;

      try {
        var visits = parseInt(localStorage.getItem(VISIT_KEY) || '0');
        visits++;
        localStorage.setItem(VISIT_KEY, visits.toString());

        if (visits >= minVisits) {
          var delay = this.config.trigger.delay || 3000;
          var t = setTimeout(function () { self.fire(); }, delay);
          self._timers.push(t);
        }
      } catch (e) { /* localStorage blocked */ }
    }

    // ─── Interaction Trigger ────────────────────────────
    _initInteraction() {
      var self = this;
      var opts = this.config.trigger.value; // { selector, minCount }

      if (!opts || !opts.selector || !opts.minCount) {
        console.warn('[TriggerManager] Interaction trigger requires { selector, minCount }');
        return;
      }

      var elements = document.querySelectorAll(opts.selector);

      var checkCount = function () {
        var interacted = document.querySelectorAll(opts.selector + ':checked').length;
        if (interacted >= opts.minCount) {
          self.fire();
        }
      };

      elements.forEach(function (el) {
        el.addEventListener('change', checkCount);
        self._listeners.push({ el: el, event: 'change', fn: checkCount });
      });
    }

    // ─── Dual Trigger (Time + Scroll) ───────────────────
    _initDual() {
      var self = this;
      var timeReady = false;
      var scrollReady = false;

      var tryFire = function () {
        if (timeReady && scrollReady) self.fire();
      };

      // Time leg
      var delay = (this.config.trigger.value && this.config.trigger.value.time) || 15000;
      var t = setTimeout(function () { timeReady = true; tryFire(); }, delay);
      this._timers.push(t);

      // Scroll leg
      var threshold = (this.config.trigger.value && this.config.trigger.value.scroll) || 0.25;
      var onScroll = function () {
        var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        var pct = window.scrollY / scrollHeight;
        if (pct >= threshold) {
          scrollReady = true;
          window.removeEventListener('scroll', onScroll);
          tryFire();
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this._listeners.push({ el: window, event: 'scroll', fn: onScroll });
      onScroll();
    }

    // ─── Session Management ─────────────────────────────
    _isDismissed() {
      var key = (this.config.session && this.config.session.dismissKey) || 'eng_dismissed';
      var storageType = (this.config.session && this.config.session.storage) || 'sessionStorage';
      var storage = storageType === 'localStorage' ? localStorage : sessionStorage;

      try { return storage.getItem(key) === '1'; }
      catch (e) { return false; }
    }

    setDismissed() {
      var key = (this.config.session && this.config.session.dismissKey) || 'eng_dismissed';
      var storageType = (this.config.session && this.config.session.storage) || 'sessionStorage';
      var storage = storageType === 'localStorage' ? localStorage : sessionStorage;

      try { storage.setItem(key, '1'); }
      catch (e) { /* noop */ }
    }

    _respectsReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ─── Cleanup ────────────────────────────────────────
    _cleanup() {
      this._listeners.forEach(function (l) {
        l.el.removeEventListener(l.event, l.fn);
      });
      this._listeners = [];

      this._timers.forEach(function (t) { clearTimeout(t); });
      this._timers = [];
    }
  }

  // ─── Export ─────────────────────────────────────────
  window.TriggerManager = TriggerManager;

})();
