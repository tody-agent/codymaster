---
name: booking-calendar
description: |
  Booking & Calendar CRO Engine — Packages all booking, scheduling, .ics download, and Google Calendar integration into a revenue-boosting system.
  Auto-detect industry → select matching pattern → generate calendar engine + booking UI + export logic.
  Integrates with google-forms-sheet (form → sheet) and cro-tracking-master (conversion events).
  
  ALWAYS trigger for: booking, appointment, calendar, reminder,
  download ics, google calendar, add to calendar, book appointment, schedule,
  "create booking", "add scheduling", "appointment reminder system", "calendar CRO", "reduce no-show"
allowed-tools: Read, Write, Edit, Glob, Grep, Browser
version: 1.0
priority: HIGH
skills:
  - google-forms-sheet
  - cro-tracking-master
---

# Booking Calendar CRO Engine

> **Booking + Calendar Reminders = Replace expensive SMS/notification costs.**
> Auto-detect industry → Ready-made patterns → Generate code → Increase revenue.
> Zero dependencies, works on any static site.

---

## 💰 WHY This Increases Revenue

| Metric | Impact | Mechanism |
|--------|--------|-----------|
| **No-show reduced 30-60%** | Directly increases revenue | Calendar reminder replaces SMS, free |
| **Conversion Rate +15-25%** | "Add to Calendar" CTA = micro-commitment | User commits via action, not just form |
| **LTV increases 2-3x** | Appointments = continuous touchpoints | Brand exposure every time calendar opens |
| **SMS/notification cost = 0** | Saves $0.05-0.10/message | Calendar notification is free forever |
| **Organic referrals** | Calendar events can be shared | "Invite a friend" via calendar |

---

## 🎯 When to Use

| Trigger | Action |
|---------|--------|
| User says "booking", "appointment", "schedule" | Activate — start Phase 1 |
| User says "reminder", "calendar" | Activate — focus calendar export |
| User says "reduce no-show", "increase conversion" | Activate — focus ROI explanation |
| User says "download calendar", "download ics" | Jump to Phase 4 (calendar-export.js) |
| Detected booking form on website | Suggest this skill proactively |

---

## 📋 7-Phase Workflow

```
Phase 1: DISCOVER → Auto-detect industry, scan existing forms/booking
Phase 2: SOCRATIC GATE → Ask 5-7 strategic questions
Phase 3: CONFIGURE → Select industry pattern + customize
Phase 4: BUILD → Generate calendar engine + UI + export
Phase 5: INTEGRATE → Wire to site + google-forms-sheet + cro-tracking
Phase 6: VERIFY → Test ICS, GCal, form submit, tracking events
Phase 7: REVENUE REPORT → Explain ROI to user per feature
```

> 🔴 **Rule:** NEVER skip Phase 1 & 2. Always scan first, ask second.

---

## Phase 1: DISCOVER (Auto-Detect Industry & Scan)

**Goal:** Understand the website's industry and existing booking/form infrastructure.

### 1A. Industry Auto-Detection

Scan the website to classify industry:

```
grep -ri "keywords\|description\|og:title" --include="*.html" --include="*.astro" .
grep -ri "service\|booking\|appointment" --include="*.html" --include="*.astro" .
```

**Detection signals:**

| Signal | Where to Find | Example |
|--------|---------------|---------|
| Meta keywords | `<meta name="keywords">` | "obstetrics, ultrasound" → Healthcare:OB/GYN |
| Page titles | `<title>`, `<h1>` | "Dental Clinic" → Healthcare:Dental |
| Service lists | Service section content | "Haircut, coloring, perming" → Salon |
| Form fields | `<select>` options | "Prenatal exam, 5D ultrasound" → OB/GYN |
| Address/Maps | Google Maps embed | Location-based business |

### 1B. Scan Existing Forms

```
grep -r "data-form-type\|onsubmit\|<form\|booking" --include="*.html" --include="*.astro" .
```

For each form found, extract:

| Info | How to Find |
|------|-------------|
| Form type | `data-form-type` or form class/id |
| Fields | `<input name="...">`, `<select name="...">` |
| Calendar integration | `google.com/calendar`, `.ics`, `VCALENDAR` |
| Submit handler | `onsubmit` attribute or JS handler |

### 1C. Scan Existing Calendar Code

```
grep -r "VCALENDAR\|google.com/calendar\|\.ics\|VEVENT\|VALARM" --include="*.js" --include="*.html" .
```

### Output: Discovery Report

```markdown
## Discovery Report

**Industry detected:** [industry name] (confidence: HIGH/MEDIUM/LOW)
**Detection signals:** [list signals found]
**Existing forms:** [count] forms found
**Existing calendar:** [YES/NO] — [details if yes]
**Recommended pattern:** [industry-pattern key]
```

---

## Phase 2: SOCRATIC GATE (Strategic Questions)

> 🔴 **MANDATORY.** Ask ALL in ONE message. Max 7 questions.

Ask user these questions, adapting language to their industry:

### Core Questions (Always Ask)

1. **Industry confirmation** — I detected your website is [industry]. Is that correct? Any unique specifics?
2. **Appointment frequency** — How often do customers need appointments? (one-time / weekly / monthly / treatment course of X sessions / milestone-based)
3. **Information to collect** — Besides phone + name, what else do you need? (email, ID, address, specific service, notes)
4. **Reminder content** — What should customers prepare before arriving? (fasting required, bring documents, arrive 15 minutes early...)
5. **Reminder timing** — How far in advance to remind? (1 day + 2 hours before is default, need additional 1 week before?)

### Extended Questions (Ask if Relevant)

6. **Google Maps** — Want to embed a Google Maps link in the calendar event? Provide the link or location name.
7. **Follow-up** — After the appointment, do you want to automatically suggest booking the next one? (re-booking prompt)

### User WOW Information

After receiving answers, explain back to user **WHY** each feature increases revenue. This is the "exceeding expectations" moment:

```markdown
## 💡 Why Each Feature Drives Revenue:

1. **Calendar Reminder replaces SMS** → Saves ~$0.05-0.10/message.
   If 100 appointments/month = saves $5-10/month, $60-120/year.

2. **"Add to Calendar" CTA** → Increases commitment 40%.
   Research shows: users who add calendar events have 2.5x higher
   show-up rate compared to form-only submissions.

3. **Google Maps in event** → Reduces "got lost" cancellations 25%.
   Calendar event with location → 1 tap opens navigation → no drop-off.

4. **Preparation reminders** → Reduces cancellations/postponements 35%.
   "Remember to fast for 8 hours" in reminder → patient prepares correctly
   → no rescheduling needed → no lost revenue.

5. **Re-booking prompt** → Increases LTV 2x.
   After 6 months auto-reminds "Time for your next check-up" → recurring revenue.
```

---

## Phase 3: CONFIGURE (Select Pattern & Customize)

**Goal:** Load industry pattern + apply user customizations.

### 3A. Load Industry Pattern

Read `references/industry-patterns.md` → find matching industry → load defaults.

### 3B. Override with User Answers

Merge user answers from Phase 2 onto the industry defaults:

```javascript
const config = {
  ...INDUSTRY_PATTERNS[detectedIndustry],  // defaults
  ...userOverrides,                         // from Phase 2
  // Computed fields
  googleMapsUrl: userGoogleMapsUrl || buildMapsSearchUrl(clinicName, clinicAddress),
  reminderAlarms: buildAlarmConfig(userReminderTiming),
  calendarTitle: `${userServiceName} — ${clinicName}`,
};
```

### 3C. Customization Points

| Setting | Source | Default |
|---------|--------|---------|
| Industry pattern | Auto-detect + user confirm | From detection |
| Clinic/business name | User input | From `<title>` tag |
| Address | User input | From Google Maps embed or contact section |
| Google Maps link | User provides or auto-build | Search URL |
| Reminder content | Industry default + user override | From pattern |
| Reminder timing | User choice | 1 day + 2 hours before |
| Working hours | User input | Mon-Sat 8:00-17:00 |
| Services list | Scan existing `<select>` or user input | From form |
| Follow-up interval | Industry default + user override | From pattern |
| Form fields | Industry default + user additions | phone + name + date + service |

---

## Phase 4: BUILD (Generate Code)

### 4A. Calendar Engine (`templates/calendar-engine.js`)

> See `templates/calendar-engine.js` for the full template.

Core `BookingCalendarEngine` class:

| Method | Purpose |
|--------|---------|
| `constructor(config)` | Init with industry config |
| `generateSchedule(startDate, preferences)` | Build appointment list from milestones/frequency |
| `getSmartDateChips()` | Return next 5 smart date options (Today, Tomorrow, next available slots) |
| `getTimeSlots(date)` | Return available time slots for a given date |
| `filterPastAppointments(appointments)` | Remove past dates |
| `getNextAppointment()` | Get the soonest upcoming appointment |

### 4B. Calendar Export (`templates/calendar-export.js`)

> See `templates/calendar-export.js` for the full template.

| Function | Purpose |
|----------|---------|
| `buildGoogleCalUrl(event, config)` | Generate Google Calendar deep link |
| `buildICSContent(events, config)` | Generate RFC 5545 .ics content with VALARM |
| `triggerICSDownload(content, filename)` | Trigger browser download |
| `addToGoogleCal(event)` | Open GCal in new tab |
| `addAllToGoogleCal(events)` | Batch add with confirmation |
| `downloadICS(event)` | Download single event .ics |
| `downloadAllICS(events)` | Download all events as single .ics |
| `detectDevice()` | iOS → ICS, Android → GCal deep link |
| `buildCalendarCTA(event, config)` | Generate post-submit calendar buttons HTML |

### 4C. Booking Form UI (`templates/booking-form.html`)

> See `templates/booking-form.html` for markup templates.

**3 form variants:**

| Variant | Use Case |
|---------|----------|
| `bottom-sheet` | Mobile-first popup (like existing BookingBottomSheet) |
| `inline` | Embedded in page content |
| `standalone` | Full-page booking form |

**Required attributes:**
```html
<form data-form-type="booking" 
      data-industry="[INDUSTRY_KEY]"
      onsubmit="window.submitBooking(event)">
  <input type="hidden" name="url" value="">
  <input type="hidden" name="industry" value="[INDUSTRY_KEY]">
  <!-- form fields per industry config -->
  <button type="submit">Confirm Booking</button>
</form>

<!-- Post-submit Calendar CTA (shown after successful submit) -->
<div class="booking-calendar-cta" id="booking-calendar-cta" hidden>
  <p class="cta-title">📅 Add to your calendar so you don't forget!</p>
  <div class="cta-buttons">
    <button onclick="addToGoogleCal()" class="btn-gcal">
      <img src="gcal-icon" alt=""> Google Calendar
    </button>
    <button onclick="downloadICS()" class="btn-ics">
      📥 Download calendar file (.ics)
    </button>
  </div>
  <p class="cta-benefit">💡 Your calendar will automatically remind you 1 day before — completely free</p>
</div>
```

### 4D. Booking Form CSS (`templates/booking-form.css`)

> See `templates/booking-form.css` for full styles.

Key components:
- Bottom sheet with handle
- Date chips grid (3-column, touch targets ≥ 44px)
- Time slot chips
- Calendar CTA section (post-submit — green accent, celebration feel)
- Toast notifications (success/error/retrying)
- Mobile-first responsive

### 4E. Reminder Configuration (`templates/reminder-config.js`)

> See `templates/reminder-config.js` for the full config object.

Each industry config:
```javascript
{
  key: 'obgyn',
  name: 'OB/GYN',
  icon: '🏥',
  frequency: 'milestone',
  milestones: [...],
  reminderAlarms: [
    { trigger: '-P1D', description: 'Appointment reminder for tomorrow' },
    { trigger: '-PT2H', description: 'Your appointment today at {time}' }
  ],
  reminderContent: {
    preparation: 'Bring your pregnancy record, latest test results',
    arriveEarly: '15 minutes',
    fasting: false,
    bringDocuments: ['Pregnancy record', 'ID card', 'Insurance card'],
  },
  calendarTitleTemplate: '{service} — {clinicName}',
  calendarDescTemplate: '{desc}\n\n📍 {clinicName}\n📌 {address}\n📞 {phone}\n🗺️ {mapsUrl}',
  workingHours: { start: '08:00', end: '17:00', days: [1,2,3,4,5,6] },
  bookingFields: ['phone', 'name', 'date', 'timeSlot', 'service', 'note'],
  conversionValue: 50,
  followUp: { interval: 'per-milestone', promptText: 'Time for your next check-up' }
}
```

---

## Phase 5: INTEGRATE (Wire Everything)

### 5A. Wire to Website

1. **Add CSS** → Append booking-form.css to main stylesheet
2. **Add JS** → Add calendar-engine.js + calendar-export.js + reminder-config.js
3. **Add HTML** → Insert booking form component (bottom-sheet or inline)
4. **Configure** → Set industry config, clinic info, Google Maps link
5. **Wire triggers** → Connect CTA buttons to open booking sheet

### 5B. Integrate with `google-forms-sheet`

The booking form uses the SAME `submitToGoogleSheet()` from google-forms-sheet skill, with extra fields:

```javascript
// After google-forms-sheet success callback:
window.submitToGoogleSheet = function(event) {
  // ... existing google-forms-sheet logic ...
  
  // ADDITION: After success, show calendar CTA
  .then(() => {
    showCalendarCTA(formData);  // from booking-calendar skill
    
    // Track calendar availability
    dataLayer.push({
      event: 'cro_booking_submit',
      event_id: generateUUID(),
      content_name: formData.service,
      value: INDUSTRY_CONFIG.conversionValue,
      currency: 'USD'
    });
  });
};
```

**Google Sheet extra columns:**

| Column | Value | Purpose |
|--------|-------|---------|
| Timestamp | auto | Timestamp |
| (form fields) | from form | Core data |
| Page Source | `url` field | Attribution |
| Calendar Added | YES/NO | Track calendar adoption |
| Calendar Type | gcal/ics/none | Which calendar used |

### 5C. Integrate with `cro-tracking-master`

New dataLayer events for booking:

```javascript
// Event 1: Booking form submitted
dataLayer.push({
  event: 'cro_booking_submit',
  event_id: '[UUID]',
  content_name: '[service_name]',
  value: [conversion_value],
  currency: 'USD',
  booking_date: '[selected_date]',
  booking_time: '[selected_time]',
  industry: '[industry_key]'
});

// Event 2: Calendar added (Google Cal or ICS)
dataLayer.push({
  event: 'cro_calendar_add',
  event_id: '[UUID]',
  content_name: '[service_name]',
  calendar_type: 'gcal' | 'ics',
  appointments_count: [number],
  industry: '[industry_key]'
});
```

**GTM Tags to create:**

| Tag | Trigger | Platform |
|-----|---------|----------|
| FB Lead | cro_booking_submit | Facebook Pixel |
| TikTok SubmitForm | cro_booking_submit | TikTok Pixel |
| Google Ads Lead | cro_booking_submit | Google Ads |
| GA4 booking_submit | cro_booking_submit | GA4 |
| GA4 calendar_add | cro_calendar_add | GA4 |

---

## Phase 6: VERIFY (Test & Report)

### Test Checklist

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Open booking form | Bottom sheet slides up | |
| 2 | Select date chip | Chip active + time slots appear | |
| 3 | Select time slot | Chip active + hidden input updated | |
| 4 | Submit valid form | Toast success → Calendar CTA appears | |
| 5 | Click "Google Calendar" | New tab with pre-filled GCal event | |
| 6 | Click "Download calendar file" | .ics file downloads | |
| 7 | Open .ics on iOS | Apple Calendar shows event with reminders | |
| 8 | Open .ics on Android | Calendar app shows event | |
| 9 | Check Google Sheet | New row with calendarAdded column | |
| 10 | Check GTM Preview | cro_booking_submit fires | |
| 11 | Check GTM Preview | cro_calendar_add fires on calendar click | |
| 12 | Submit invalid phone | Validation error toast | |
| 13 | Network offline | 3 retries → error toast with fallback | |
| 14 | Verify reminder alarms | Calendar shows reminder 1d + 2h before | |
| 15 | Verify Google Maps in event | Location link opens Maps correctly | |

### Verification Commands

```bash
# Check calendar export works
node -e "const c = require('./calendar-export.js'); console.log(c.buildICSContent([{...}], config))"

# Validate ICS format
grep -c "BEGIN:VEVENT" test-output.ics
grep -c "VALARM" test-output.ics
```

---

## Phase 7: REVENUE REPORT (Explain ROI to User)

> 🔴 **This phase is what makes the skill exceed expectations.**

After implementation, generate a revenue impact report for the user:

```markdown
## 📊 Revenue Impact Report

### Features Implemented:

| Feature | Impact | Mechanism |
|---------|--------|-----------|
| Calendar Reminder | Reduces no-show 30-60% | Auto-reminder, no cost |
| Google Maps in calendar | Reduces "got lost" cancellations 25% | One-tap navigation |
| Preparation reminder content | Reduces cancellations/postponements 35% | Patient prepares correctly |
| Post-submit CTA | Increases adoption 40% | Micro-commitment |
| Re-booking prompt | Increases LTV 2x | Recurring revenue |

### Estimated Monthly ROI:

Assuming [X] appointments/month, average service price $[Y]:

- **SMS/notification savings:** [X] × $0.05 = $[total]/month
- **No-show reduction:** [X] × 40% no-show × 50% reduction × $[Y] = $[total]/month
- **Re-booking increase:** [X] × 15% re-book × $[Y] = $[total]/month
- **Estimated total revenue increase:** $[grand total]/month
```

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|------|
| Hardcode clinic info | Use config object |
| Skip calendar CTA after form success | ALWAYS show calendar CTA |
| Only offer Google Calendar | Offer BOTH GCal + ICS download |
| Generic reminder "You have an appointment" | Industry-specific "Remember to fast..." |
| Same reminder timing all industries | Customize per industry needs |
| Skip Google Maps in event | ALWAYS include location |
| No tracking on calendar actions | Track cro_calendar_add event |
| Build from scratch | Use industry pattern as base |
| Skip Socratic Gate questions | ALWAYS ask Phase 2 questions |
| Forget mobile device detection | iOS → ICS, Android → GCal |

---

## 📑 Templates

| File | Purpose |
|------|---------|
| `templates/calendar-engine.js` | Core booking/scheduling engine |
| `templates/calendar-export.js` | ICS + Google Calendar export |
| `templates/booking-form.html` | HTML form markup (3 variants) |
| `templates/booking-form.css` | Booking form styles |
| `templates/reminder-config.js` | 20 industry configurations |

## 📚 References

| File | Purpose |
|------|---------|
| `references/industry-patterns.md` | Complete 20-industry pattern library |

---

## 🔗 Related Skills

| Need | Skill |
|------|-------|
| Form → Google Sheet | `@[skills/google-forms-sheet]` |
| Conversion tracking | `@[skills/cro-tracking-master]` |
| Form UI/UX design | `@[skills/frontend-design]` |
| SEO for booking pages | `@[skills/seo-fundamentals]` |
| Mobile booking UX | `@[skills/mobile-design]` |
