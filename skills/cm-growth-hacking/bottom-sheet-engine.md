# Bottom Sheet Engine

> Core module cho mọi engagement UI. Modular, responsive, accessible.
> Một engine — nhiều content types.

---

## 🏗️ Architecture

```
BottomSheetEngine
├── create(config)      → Build DOM + attach events
├── show()              → Slide up animation
├── hide()              → Slide down + cleanup
├── destroy()           → Remove from DOM entirely
├── setContent(html)    → Swap inner content dynamically
├── setSize(size)       → Switch compact/standard/full
└── onDismiss(callback) → Hook for tracking/state
```

### 3 Size Variants

| Size | Height | Use Case |
|------|--------|----------|
| `compact` | ~120px | Simple CTA, chat buttons, promo banner |
| `standard` | ~320px | Booking form, lead capture, calendar CTA |
| `full` | ~80vh | Survey, multi-step form, detailed content |

### DOM Structure

```html
<!-- Backdrop (optional, for full-size sheets) -->
<div class="eng-backdrop" data-sheet-id="booking"></div>

<!-- Bottom Sheet -->
<div class="eng-sheet eng-sheet--standard" data-sheet-id="booking" role="dialog" aria-modal="true" aria-label="Đặt Lịch Khám">
  <!-- Drag handle -->
  <div class="eng-sheet__handle" aria-hidden="true">
    <div class="eng-sheet__handle-bar"></div>
  </div>
  
  <!-- Close button -->
  <button class="eng-sheet__close" aria-label="Đóng">✕</button>
  
  <!-- Content area (swappable) -->
  <div class="eng-sheet__content">
    <!-- Dynamic content injected here -->
  </div>
</div>
```

---

## 🎨 Styling Principles

### Must-Have CSS Features

| Feature | Why |
|---------|-----|
| `position: fixed; bottom: 0` | Anchored to viewport bottom |
| `transform: translateY(100%)` → `translateY(0)` | Smooth slide-up animation |
| `backdrop-filter: blur(24px)` | Glassmorphism, premium feel |
| `border-radius: 20px 20px 0 0` | iOS-style rounded top corners |
| `padding-bottom: env(safe-area-inset-bottom)` | Safe area for notched devices |
| `z-index: 1100` | Above nav bars but below modals |
| Drag handle pseudo-element | Visual signal "this is draggable" |

### Animation Timing

```css
/* Open: slightly bouncy, feels natural */
transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);

/* Close: quick, decisive */
transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
```

### Responsive Rules

| Viewport | Behavior |
|----------|----------|
| Mobile (< 768px) | Full-width, touch-optimized, swipe dismiss |
| Tablet (768-1024px) | Max-width 480px, centered |
| Desktop (> 1024px) | Max-width 480px, right-aligned or centered |

---

## 👆 Touch Interactions

### Swipe-to-Dismiss

```
touchstart → record startY
touchmove → calculate deltaY
  if deltaY > 0 → sheet follows finger (translateY)
  if deltaY > threshold (80px) → dismiss
touchend → snap back or dismiss based on velocity
```

**Key Rules:**
- Only allow downward swipe (deltaY > 0)
- Apply `will-change: transform` during drag for perf
- Use velocity calculation: fast swipe = dismiss even if < 80px
- Add `touch-action: none` on the drag handle only

### Focus Trap (Accessibility)

```
When sheet opens:
1. Save currently focused element
2. Move focus to sheet
3. Trap Tab/Shift+Tab within sheet
4. On close: restore focus to saved element
```

---

## 📦 Content Type Patterns

### 1. Booking Form Content

```html
<div class="eng-sheet__content">
  <div class="eng-content-booking">
    <h3 class="eng-content__title">📅 Đặt Lịch Khám</h3>
    <form data-form-type="booking" onsubmit="window.submitToGoogleSheet(event)">
      <input type="hidden" name="url" value="">
      <input type="text" name="name" placeholder="Họ tên" required>
      <input type="tel" name="phone" placeholder="Số điện thoại" required>
      <div class="eng-date-chips" id="dateChips"><!-- JS generated --></div>
      <div class="eng-time-slots" id="timeSlots"><!-- JS generated --></div>
      <select name="service"><!-- Industry-specific options --></select>
      <textarea name="note" placeholder="Ghi chú (tùy chọn)"></textarea>
      <button type="submit" class="eng-btn eng-btn--primary">Xác Nhận Đặt Lịch</button>
    </form>
  </div>
</div>
```

### 2. Calendar CTA Content (Post-Submit)

```html
<div class="eng-content-calendar">
  <div class="eng-content__icon">✅</div>
  <h3 class="eng-content__title">Đặt lịch thành công!</h3>
  <p class="eng-content__subtitle">Thêm vào lịch để không quên nhé</p>
  <div class="eng-calendar-buttons">
    <button onclick="addToGoogleCal()" class="eng-btn eng-btn--gcal">
      <img src="gcal-icon.svg" alt="" width="20"> Google Calendar
    </button>
    <button onclick="downloadICS()" class="eng-btn eng-btn--ics">
      📥 Apple Calendar / Khác
    </button>
  </div>
  <p class="eng-content__benefit">💡 Lịch sẽ tự nhắc bạn — hoàn toàn miễn phí</p>
</div>
```

### 3. Lead Capture Content

```html
<div class="eng-content-lead">
  <div class="eng-content__icon">🎁</div>
  <h3 class="eng-content__title">Nhận tài liệu miễn phí</h3>
  <p class="eng-content__subtitle">Để lại SĐT, chúng tôi gửi ngay</p>
  <form data-form-type="lead" onsubmit="window.submitToGoogleSheet(event)">
    <input type="hidden" name="url" value="">
    <input type="tel" name="phone" placeholder="Số điện thoại" required>
    <button type="submit" class="eng-btn eng-btn--primary">Gửi Cho Tôi</button>
  </form>
</div>
```

### 4. Flash Sale Content

```html
<div class="eng-content-promo">
  <div class="eng-content__icon">🔥</div>
  <h3 class="eng-content__title">Ưu đãi đặc biệt!</h3>
  <div class="eng-countdown" id="countdown">
    <span class="eng-countdown__unit"><span id="hours">00</span>h</span>
    <span class="eng-countdown__unit"><span id="minutes">00</span>m</span>
    <span class="eng-countdown__unit"><span id="seconds">00</span>s</span>
  </div>
  <p class="eng-content__subtitle">Giảm 30% khi đặt lịch hôm nay</p>
  <a href="#booking" class="eng-btn eng-btn--primary">Đặt Ngay →</a>
  <button class="eng-btn eng-btn--outline" onclick="addDeadlineToCalendar()">
    📅 Nhắc tôi trước khi hết hạn
  </button>
</div>
```

### 5. Survey / Feedback Content

```html
<div class="eng-content-survey">
  <h3 class="eng-content__title">⭐ Đánh giá trải nghiệm</h3>
  <div class="eng-rating" id="starRating">
    <button data-rating="1" aria-label="1 sao">⭐</button>
    <button data-rating="2" aria-label="2 sao">⭐</button>
    <button data-rating="3" aria-label="3 sao">⭐</button>
    <button data-rating="4" aria-label="4 sao">⭐</button>
    <button data-rating="5" aria-label="5 sao">⭐</button>
  </div>
  <textarea name="feedback" placeholder="Chia sẻ thêm (tùy chọn)"></textarea>
  <button class="eng-btn eng-btn--primary" onclick="submitSurvey()">Gửi Đánh Giá</button>
</div>
```

### 6. Chat / Contact CTA

```html
<div class="eng-content-chat">
  <p class="eng-content__title">💬 Cần tư vấn?</p>
  <div class="eng-chat-buttons">
    <a href="https://zalo.me/PHONE" class="eng-btn eng-btn--zalo">Zalo</a>
    <a href="tel:PHONE" class="eng-btn eng-btn--phone">📞 Gọi ngay</a>
    <a href="https://m.me/PAGE" class="eng-btn eng-btn--messenger">Messenger</a>
  </div>
</div>
```

---

## 🔄 Multi-Step Flow

For complex interactions (e.g., booking → success → calendar CTA):

```javascript
// Step 1: Show booking form
sheet.setContent(bookingFormHTML);
sheet.show();

// Step 2: On form success → swap to calendar CTA
onFormSuccess(() => {
  sheet.setContent(calendarCTAHTML);
  // Track transition
  trackEngagement('cro_booking_submit', { service: formData.service });
});

// Step 3: On calendar add → show thank you + close
onCalendarAdd(() => {
  trackEngagement('cro_calendar_add', { type: 'gcal' });
  sheet.hide();
  showToast('success', 'Đã thêm vào lịch! 🎉');
});
```

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|------|
| Nest sheets inside sheets | One sheet at a time, swap content |
| Hardcode content | Use setContent() for flexibility |
| Forget backdrop for full sheets | Add backdrop + blur for full-size |
| Skip keyboard navigation | Trap Tab key, close on Escape |
| Ignore safe-area-inset | Always pad for notched phones |
| Use `overflow: hidden` on body | Use `overscroll-behavior: contain` on sheet |
| Animate with JS | Use CSS transitions + `requestAnimationFrame` |
