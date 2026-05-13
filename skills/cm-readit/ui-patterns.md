# UI Patterns — Player Bars & Bottom Sheets

> CSS and HTML patterns for audio player UI. Responsive, accessible, animated.

---

## Player Bar (Bottom-Fixed)

### HTML Structure

```html
<div class="reader-bar">
    <div class="reader-bar-inner">
        <div class="reader-bar-info">
            <span class="reader-bar-icon">🔊</span>
            <span class="reader-bar-title">Article Title</span>
        </div>
        <div class="reader-bar-controls">
            <button class="reader-bar-btn reader-btn-toggle" aria-label="Pause">
                <!-- Pause/Play SVG icons -->
            </button>
            <button class="reader-bar-btn reader-btn-close" aria-label="Close">
                <!-- Close SVG icon -->
            </button>
        </div>
    </div>
    <div class="reader-bar-progress">
        <div class="reader-bar-progress-fill"></div>
    </div>
</div>
```

### CSS

```css
.reader-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    /* safe-area for notched devices */
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.reader-bar.active {
    transform: translateY(0);
}

.reader-bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
}

/* Dark mode variant */
@media (prefers-color-scheme: dark) {
    .reader-bar-inner {
        background: rgba(30, 30, 30, 0.95);
        border-top-color: rgba(255, 255, 255, 0.08);
    }
}

.reader-bar-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.reader-bar-title {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.reader-bar-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.reader-bar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    color: inherit;
    transition: background 0.15s ease;
}

.reader-bar-btn:hover {
    background: rgba(0, 0, 0, 0.06);
}

/* Progress bar */
.reader-bar-progress {
    height: 3px;
    background: rgba(0, 0, 0, 0.08);
}

.reader-bar-progress-fill {
    height: 100%;
    width: 0%;
    background: #c9a84c; /* gold accent */
    border-radius: 0 3px 3px 0;
    transition: width 0.3s linear;
}
```

### Body Padding (Prevent Content Overlap)

```javascript
// When showing bar
document.body.style.paddingBottom = '72px';

// When hiding bar
document.body.style.paddingBottom = '';
```

---

## Bottom Sheet

### HTML Structure

```html
<div class="audio-sheet">
    <div class="audio-sheet-inner">
        <button class="audio-sheet-close" aria-label="Close">✕</button>
        <div class="audio-sheet-icon">🎧</div>
        <p class="audio-sheet-text">Want to hear a quick introduction?</p>
        <div class="audio-sheet-actions">
            <button class="btn btn-primary">🔊 Listen Now</button>
            <button class="btn btn-outline">Later</button>
        </div>
    </div>
</div>
```

### CSS

```css
.audio-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1100;
    transform: translateY(100%);
    transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
    pointer-events: none;
}

.audio-sheet.active {
    transform: translateY(0);
    pointer-events: auto;
}

.audio-sheet-inner {
    position: relative;
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 20px 20px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.12);
    text-align: center;
}

/* Drag handle indicator */
.audio-sheet-inner::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
    margin: 0 auto 16px;
}

.audio-sheet-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
}

.audio-sheet-icon {
    font-size: 40px;
    margin-bottom: 12px;
    line-height: 1;
}

.audio-sheet-text {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    line-height: 1.5;
}

.audio-sheet-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.audio-sheet-actions .btn {
    flex: 1;
    max-width: 180px;
}
```

### Swipe-to-Dismiss (Mobile)

```javascript
let startY = 0;

sheet.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
}, { passive: true });

sheet.addEventListener('touchmove', (e) => {
    const dy = e.touches[0].clientY - startY;
    if (dy > 60) dismiss(sheet);
}, { passive: true });
```

---

## Animation Pattern

### Enter (slide up)

```javascript
// Create element → append to DOM → next frame add active class
document.body.appendChild(element);
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        element.classList.add('active');
    });
});
```

**Double `requestAnimationFrame`:** Ensures the browser has painted the initial state (translateY 100%) before transitioning to the active state.

### Exit (slide down)

```javascript
element.classList.remove('active');
setTimeout(() => element.remove(), 400); // match transition duration
```

---

## Trigger Button (Topbar)

```css
.topbar-audio-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.topbar-audio-btn:hover {
    background: rgba(0, 0, 0, 0.06);
}

/* Active state when reading */
.topbar-audio-btn.reading {
    color: #2d5016; /* moss green or brand color */
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
```

---

## Responsive Considerations

```css
@media (max-width: 768px) {
    .reader-bar-inner {
        padding: 8px 12px;
        gap: 8px;
    }

    .reader-bar-btn {
        width: 36px;
        height: 36px;
    }

    .reader-bar-title {
        font-size: 13px;
    }

    .audio-sheet-inner {
        padding: 20px 16px 16px;
        border-radius: 16px 16px 0 0;
    }

    .audio-sheet-icon {
        font-size: 32px;
    }

    .audio-sheet-text {
        font-size: 14px;
    }
}
```

---

## Accessibility

- All buttons must have `aria-label`
- Toggle button must update label between "Play" / "Pause"
- Respect `prefers-reduced-motion`: skip animations
- Ensure sufficient color contrast for controls
- Player bar should not trap focus
