# Tracking Events

> Engagement-specific dataLayer events cho GTM.
> Kế thừa `cm-ads-tracker` convention, thêm engagement-specific events.

---

## 🎯 Event Naming Convention

Prefix: **`cro_`** — consistent with `cm-ads-tracker` skill.

| Event | dataLayer event name | When to fire |
|-------|---------------------|--------------|
| Sheet shown | `cro_sheet_shown` | Bottom sheet becomes visible |
| Sheet dismissed | `cro_sheet_dismissed` | User closes/swipes sheet |
| Sheet interaction | `cro_sheet_interact` | User interacts with sheet content |
| Booking submitted | `cro_booking_submit` | Booking form success |
| Calendar added | `cro_calendar_add` | User adds to GCal or downloads ICS |
| Lead captured | `cro_lead_capture` | Lead form success |
| Promo engaged | `cro_promo_engage` | User clicks promo CTA |
| Survey completed | `cro_survey_complete` | User submits survey/rating |
| Chat initiated | `cro_chat_initiate` | User clicks Zalo/Messenger |
| Re-engaged | `cro_reengagement` | Return visitor interacts |

---

## 📦 DataLayer Push Schemas

### Sheet Shown

```javascript
dataLayer.push({
  event: 'cro_sheet_shown',
  event_id: generateUUID(),
  sheet_type: 'booking',        // booking | lead | promo | survey | chat | reengagement
  trigger_type: 'scroll',       // scroll | time | exit | click | return | interaction | dual
  page_path: window.location.pathname,
  industry: 'healthcare'        // from config
});
```

### Sheet Dismissed

```javascript
dataLayer.push({
  event: 'cro_sheet_dismissed',
  event_id: generateUUID(),
  sheet_type: 'booking',
  dismiss_method: 'swipe',      // swipe | close_button | backdrop | escape
  time_visible: 5200,           // ms sheet was visible
  interacted: false             // did user interact before dismissing?
});
```

### Booking Submitted

```javascript
dataLayer.push({
  event: 'cro_booking_submit',
  event_id: generateUUID(),
  content_name: 'Khám thai',     // service name
  value: 500000,                  // conversion value
  currency: 'VND',
  booking_date: '2025-02-15',
  booking_time: '09:00',
  industry: 'healthcare',
  source_sheet: true              // submitted from bottom sheet (vs inline)
});
```

### Calendar Added

```javascript
dataLayer.push({
  event: 'cro_calendar_add',
  event_id: generateUUID(),
  content_name: 'Khám thai',
  calendar_type: 'gcal',         // gcal | ics
  device_type: 'android',        // ios | android | desktop
  appointments_count: 1,
  industry: 'healthcare'
});
```

### Lead Captured

```javascript
dataLayer.push({
  event: 'cro_lead_capture',
  event_id: generateUUID(),
  content_name: 'Tài liệu thai kỳ',
  trigger_type: 'exit',
  value: 50000,                   // estimated lead value
  currency: 'VND',
  email_hashed: '[SHA256]',       // optional
  phone_hashed: '[SHA256]'        // optional
});
```

### Survey Completed

```javascript
dataLayer.push({
  event: 'cro_survey_complete',
  event_id: generateUUID(),
  rating: 5,                     // 1-5 star rating
  has_feedback: true,             // user wrote additional text
  survey_type: 'post_service',    // post_service | post_booking | nps
  industry: 'healthcare'
});
```

### Chat Initiated

```javascript
dataLayer.push({
  event: 'cro_chat_initiate',
  event_id: generateUUID(),
  channel: 'zalo',               // zalo | messenger | phone | whatsapp
  trigger_type: 'scroll',
  page_path: window.location.pathname
});
```

---

## 🔧 Helper Functions

### UUID Generator

```javascript
function generateUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### SHA256 Hash (for Enhanced Matching)

```javascript
async function sha256Hash(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Usage for phone: strip non-digits first
async function hashPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return sha256Hash(digits);
}
```

### Track Engagement (Unified Helper)

```javascript
function trackEngagement(eventName, data = {}) {
  const payload = {
    event: eventName,
    event_id: generateUUID(),
    page_path: window.location.pathname,
    timestamp: Date.now(),
    ...data
  };
  
  // Push to GTM dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  
  // Also store locally for analytics dashboard
  try {
    const key = 'eng_analytics';
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.push(payload);
    // Keep last 100 events
    if (stored.length > 100) stored.splice(0, stored.length - 100);
    localStorage.setItem(key, JSON.stringify(stored));
  } catch { /* noop */ }
}
```

---

## 🏷️ GTM Tag Mapping

For each engagement event, create corresponding GTM tags:

| Event | Facebook Pixel | TikTok Pixel | Google Ads | GA4 |
|-------|---------------|-------------|------------|-----|
| `cro_booking_submit` | Lead | SubmitForm | Lead Conversion | booking_submit |
| `cro_calendar_add` | — | — | — | calendar_add (custom) |
| `cro_lead_capture` | Lead | SubmitForm | Lead Conversion | lead_capture |
| `cro_promo_engage` | ViewContent | ClickButton | — | promo_engage (custom) |
| `cro_survey_complete` | — | — | — | survey_complete (custom) |
| `cro_chat_initiate` | Contact | Contact | — | chat_initiate (custom) |
| `cro_sheet_shown` | — | — | — | sheet_shown (custom) |

> 📌 Only fire ad platform events for **conversion events** (booking, lead). Sheet shown/dismissed are GA4 only for internal analytics.

---

## 📊 Analytics Dashboard (Local)

Simple localStorage-based tracking for non-GTM sites:

```javascript
function getEngagementStats() {
  try {
    const events = JSON.parse(localStorage.getItem('eng_analytics') || '[]');
    
    const stats = {};
    events.forEach(e => {
      const key = e.event;
      if (!stats[key]) stats[key] = { count: 0, last: null };
      stats[key].count++;
      stats[key].last = new Date(e.timestamp).toLocaleString();
    });
    
    console.table(stats);
    return stats;
  } catch { return {}; }
}

// Call: getEngagementStats() in console
```

---

## 🔗 Skill Inheritance

| Feature | Source |
|---------|-------|
| Event naming (`cro_` prefix) | `cm-ads-tracker` |
| GTM architecture (dataLayer-first) | `cm-ads-tracker` |
| SHA256 hashing for Enhanced Matching | `cm-ads-tracker` |
| UTM conventions | `cm-ads-tracker` |
| UUID deduplication pattern | `cm-ads-tracker` |

> 📌 **Rule:** For full GTM container setup (tags, triggers, variables), delegate to `cm-ads-tracker` skill. This module provides the **engagement-specific event schemas** that plug into that architecture.
