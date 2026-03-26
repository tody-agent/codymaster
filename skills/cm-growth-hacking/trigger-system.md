# Trigger System

> Khi nào hiện bottom sheet? Trigger system quyết định.
> Hỗ trợ: scroll, time, exit-intent, click, return-visitor, interaction.

---

## 🎯 Trigger Types

| Type | Description | Best For |
|------|-------------|----------|
| `scroll` | User scrolls past X% of page | Service pages, blog content |
| `time` | X seconds after page load | Homepage, landing pages |
| `exit` | Mouse moves toward browser chrome (desktop) | Lead capture, promo |
| `click` | User clicks specific element | Manual CTA buttons |
| `return` | Returning visitor (cookie-based) | Re-engagement, loyalty |
| `interaction` | User completes N interactions | Surveys after using tool |
| `dual` | Time + Scroll combined (both must fire) | Audio CRO, booking nudge |

---

## ⚙️ TriggerManager Architecture

```javascript
class TriggerManager {
  constructor(config) {
    this.config = config;
    this.triggered = false;
    this.listeners = [];
  }
  
  init() {
    if (this.isDismissed()) return;
    if (this.respectsReducedMotion()) return;
    
    const type = this.config.trigger.type;
    
    switch (type) {
      case 'scroll': this.initScroll(); break;
      case 'time': this.initTime(); break;
      case 'exit': this.initExitIntent(); break;
      case 'click': this.initClick(); break;
      case 'return': this.initReturnVisitor(); break;
      case 'interaction': this.initInteraction(); break;
      case 'dual': this.initDual(); break;
    }
  }
  
  fire() {
    if (this.triggered) return;
    this.triggered = true;
    this.cleanup();
    if (typeof this.config.onTrigger === 'function') {
      this.config.onTrigger();
    }
  }
  
  cleanup() {
    this.listeners.forEach(({ el, event, fn }) => el.removeEventListener(event, fn));
    this.listeners = [];
  }
  
  destroy() {
    this.cleanup();
    this.triggered = true;
  }
}
```

---

## 📜 Scroll Trigger

```javascript
initScroll() {
  const threshold = this.config.trigger.value || 0.3; // 30% default
  const delay = this.config.trigger.delay || 0;
  
  const onScroll = () => {
    const scrollPct = window.scrollY / 
      (document.documentElement.scrollHeight - window.innerHeight);
    
    if (scrollPct >= threshold) {
      if (delay > 0) {
        setTimeout(() => this.fire(), delay);
      } else {
        this.fire();
      }
    }
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });
  this.listeners.push({ el: window, event: 'scroll', fn: onScroll });
  
  // Check immediately (user may already be scrolled)
  onScroll();
}
```

**Recommended thresholds:**

| Page Type | Scroll % | Rationale |
|-----------|----------|-----------|
| Homepage | 30% | After hero + intro |
| Service page | 25% | After service description |
| Blog/article | 40% | After first section |
| Product page | 20% | After product image |

---

## ⏱️ Time Trigger

```javascript
initTime() {
  const delay = this.config.trigger.value || 15000; // 15s default
  
  const timer = setTimeout(() => this.fire(), delay);
  
  // Store for cleanup
  this._timer = timer;
}

// Override cleanup to clear timer
cleanup() {
  super.cleanup();
  if (this._timer) clearTimeout(this._timer);
}
```

**Recommended delays:**

| Page Type | Delay | Rationale |
|-----------|-------|-----------|
| Homepage | 20-25s | Let user explore first |
| Landing page | 10-15s | Faster engagement needed |
| Service page | 15-20s | After reading key info |
| Blog | 25-30s | Don't interrupt reading |

---

## 🚪 Exit Intent Trigger (Desktop Only)

```javascript
initExitIntent() {
  // Only works on desktop (mouse-based)
  if ('ontouchstart' in window) return;
  
  const onMouseLeave = (e) => {
    // Mouse moved above viewport (toward browser chrome)
    if (e.clientY <= 0) {
      this.fire();
    }
  };
  
  document.addEventListener('mouseleave', onMouseLeave);
  this.listeners.push({ el: document, event: 'mouseleave', fn: onMouseLeave });
}
```

**Mobile alternative:** Use `time` or `scroll` trigger instead. Exit intent doesn't exist on touch devices.

**Enhancement — debounce:**

```javascript
// Prevent rapid-fire on mouse-near-top
let exitTimeout;
const onMouseLeave = (e) => {
  if (e.clientY <= 0) {
    clearTimeout(exitTimeout);
    exitTimeout = setTimeout(() => this.fire(), 300);
  }
};
```

---

## 🖱️ Click Trigger

```javascript
initClick() {
  const selector = this.config.trigger.value; // CSS selector
  
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    const onClick = (e) => {
      e.preventDefault();
      this.fire();
    };
    el.addEventListener('click', onClick);
    this.listeners.push({ el, event: 'click', fn: onClick });
  });
}
```

**Use case:** Manual CTA buttons that open bottom sheets.

```html
<button data-trigger="booking-sheet">📅 Đặt Lịch</button>
```

```javascript
new TriggerManager({
  trigger: { type: 'click', value: '[data-trigger="booking-sheet"]' },
  onTrigger: () => bookingSheet.show()
});
```

---

## 🔄 Return Visitor Trigger

```javascript
initReturnVisitor() {
  const VISIT_KEY = 'eng_visit_count';
  const minVisits = this.config.trigger.value || 2; // minimum visits to trigger
  
  try {
    let visits = parseInt(localStorage.getItem(VISIT_KEY) || '0');
    visits++;
    localStorage.setItem(VISIT_KEY, visits.toString());
    
    if (visits >= minVisits) {
      // Add time delay so page loads first
      setTimeout(() => this.fire(), this.config.trigger.delay || 3000);
    }
  } catch { /* localStorage blocked */ }
}
```

---

## 🎮 Interaction Trigger

```javascript
initInteraction() {
  const { selector, minCount } = this.config.trigger.value;
  // e.g., { selector: '.checklist input[type=checkbox]', minCount: 3 }
  
  const elements = document.querySelectorAll(selector);
  
  const checkCount = () => {
    const interacted = document.querySelectorAll(selector + ':checked').length;
    if (interacted >= minCount) {
      this.fire();
    }
  };
  
  elements.forEach(el => {
    el.addEventListener('change', checkCount);
    this.listeners.push({ el, event: 'change', fn: checkCount });
  });
}
```

**Use case:** After user checks 3+ symptoms → show "Đặt lịch khám" sheet.

---

## 🔀 Dual Trigger (Time + Scroll)

Both conditions must be met before firing:

```javascript
initDual() {
  let timeReady = false;
  let scrollReady = false;
  
  const tryFire = () => {
    if (timeReady && scrollReady) this.fire();
  };
  
  // Time leg
  const delay = this.config.trigger.value?.time || 15000;
  setTimeout(() => { timeReady = true; tryFire(); }, delay);
  
  // Scroll leg
  const threshold = this.config.trigger.value?.scroll || 0.25;
  const onScroll = () => {
    const pct = window.scrollY / 
      (document.documentElement.scrollHeight - window.innerHeight);
    if (pct >= threshold) {
      scrollReady = true;
      window.removeEventListener('scroll', onScroll);
      tryFire();
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  this.listeners.push({ el: window, event: 'scroll', fn: onScroll });
  onScroll();
}
```

---

## 💾 Session Management

```javascript
// Check if user dismissed this engagement
isDismissed() {
  const key = this.config.session?.dismissKey || 'eng_dismissed';
  const storage = this.config.session?.storage === 'localStorage' 
    ? localStorage : sessionStorage;
  try { return storage.getItem(key) === '1'; } 
  catch { return false; }
}

// Mark as dismissed
setDismissed() {
  const key = this.config.session?.dismissKey || 'eng_dismissed';
  const storage = this.config.session?.storage === 'localStorage' 
    ? localStorage : sessionStorage;
  try { storage.setItem(key, '1'); } 
  catch { /* noop */ }
}

// Respect prefers-reduced-motion
respectsReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

### Storage Strategy

| Behavior | Storage | Result |
|----------|---------|--------|
| Show once per tab session | `sessionStorage` | Resets on browser close |
| Show once per device forever | `localStorage` | Persistent |
| Show once per day | `localStorage` + timestamp check | Custom expiry |

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|------|
| Trigger popup on page load without delay | Minimum 10s or 20% scroll |
| Use exit-intent on mobile | Fallback to scroll/time trigger |
| Trigger on checkout/payment pages | Exclude conversion-critical pages |
| Trigger multiple sheets at once | Queue or prioritize |
| Ignore `prefers-reduced-motion` | Skip trigger for such users |
| Trigger every page visit | Respect session dismiss state |
| Use `setInterval` for scroll check | Use passive scroll event listener |
