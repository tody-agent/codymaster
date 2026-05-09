# Calendar Integration

> Kế thừa từ `cm-booking-calendar` skill. Focus vào post-engagement calendar CTA.
> Google Calendar deep link + Apple Calendar ICS + smart device routing.

---

## 🎯 Purpose

Sau khi user hoàn thành một action trong bottom sheet (đặt lịch, đăng ký event, nhận promo), hiển thị **Calendar CTA** để:

1. **Giảm no-show 30-60%** — Calendar reminder thay SMS
2. **Tăng commitment 40%** — Micro-action = tâm lý cam kết
3. **Free reminder forever** — Không tốn SMS/ZNS
4. **Google Maps built-in** — Navigate 1 chạm

---

## 📱 Smart Device Routing

```
User clicks "Add to Calendar"
│
├─ iOS detected (iPhone/iPad)
│  └─ Download .ics file
│  └─ iOS auto-opens Apple Calendar
│
├─ Android detected
│  └─ Open Google Calendar deep link
│  └─ Pre-filled event in new tab
│
└─ Desktop
   └─ Show both options
   └─ "Google Calendar" + "Tải file lịch (.ics)"
```

### Detection Logic

```javascript
function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function addToCalendar(event, config) {
  const device = detectDevice();
  if (device === 'ios') {
    downloadICS(event, config);
  } else if (device === 'android') {
    addToGoogleCal(event, config);
  } else {
    // Desktop: show both options
    showCalendarOptions(event, config);
  }
}
```

---

## 📅 Google Calendar Deep Link

### URL Structure

```
https://calendar.google.com/calendar/render?action=TEMPLATE
&text={title}
&dates={startISO}/{endISO}
&details={description}
&location={location}
&sf=true
&output=xml
```

### Building the URL

```javascript
function buildGoogleCalUrl(event, config) {
  const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const start = formatDate(new Date(event.date + 'T' + event.time));
  const end = formatDate(new Date(new Date(event.date + 'T' + event.time).getTime() + 60 * 60 * 1000)); // +1h
  
  const description = [
    event.description || '',
    '',
    `📍 ${config.clinicName}`,
    `📌 ${config.address}`,
    `📞 ${config.phone}`,
    config.mapsUrl ? `🗺️ ${config.mapsUrl}` : '',
    '',
    config.preparation ? `⚠️ Lưu ý: ${config.preparation}` : '',
  ].filter(Boolean).join('\n');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || `${event.service} — ${config.clinicName}`,
    dates: `${start}/${end}`,
    details: description,
    location: config.address || '',
    sf: 'true',
    output: 'xml',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
```

---

## 📥 ICS File Generation (Apple Calendar + Others)

### RFC 5545 Format

```javascript
function buildICSContent(event, config) {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${window.location.hostname}`;
  const formatICSDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const start = new Date(event.date + 'T' + event.time);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const now = new Date();
  
  const description = [
    event.description || event.service,
    '',
    `📍 ${config.clinicName}`,
    `📌 ${config.address}`,
    `📞 ${config.phone}`,
    config.preparation ? `⚠️ ${config.preparation}` : '',
  ].filter(Boolean).join('\\n');
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CMGrowthHacking//Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${event.title || event.service + ' — ' + config.clinicName}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${config.address || ''}`,
    config.mapsUrl ? `URL:${config.mapsUrl}` : '',
  ];
  
  // Add reminders (VALARM)
  const reminders = config.reminderMinutes || [1440, 120]; // 1 day + 2h
  reminders.forEach(minutes => {
    ics.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT' + minutes + 'M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${event.title || event.service} — ${getReminderText(minutes)}`,
      'END:VALARM'
    );
  });
  
  ics.push('END:VEVENT', 'END:VCALENDAR');
  
  return ics.filter(Boolean).join('\r\n');
}

function getReminderText(minutes) {
  if (minutes >= 1440) return `Nhắc trước ${minutes / 1440} ngày`;
  if (minutes >= 60) return `Nhắc trước ${minutes / 60} giờ`;
  return `Nhắc trước ${minutes} phút`;
}
```

### Download Trigger

```javascript
function triggerICSDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'appointment.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

## 🗓️ Calendar CTA UI Pattern

After successful form submission, swap bottom sheet content to calendar CTA:

```javascript
function showCalendarCTA(event, config) {
  const device = detectDevice();
  
  let buttonsHTML = '';
  
  if (device === 'ios') {
    buttonsHTML = `
      <button onclick="downloadICS()" class="eng-btn eng-btn--primary eng-btn--full">
        📥 Thêm vào Apple Calendar
      </button>
    `;
  } else if (device === 'android') {
    buttonsHTML = `
      <button onclick="addToGoogleCal()" class="eng-btn eng-btn--primary eng-btn--full">
        <img src="gcal-icon.svg" alt="" width="20"> Thêm vào Google Calendar
      </button>
    `;
  } else {
    buttonsHTML = `
      <button onclick="addToGoogleCal()" class="eng-btn eng-btn--gcal">
        <img src="gcal-icon.svg" alt="" width="20"> Google Calendar
      </button>
      <button onclick="downloadICS()" class="eng-btn eng-btn--ics">
        📥 Tải file lịch (.ics)
      </button>
    `;
  }
  
  return `
    <div class="eng-content-calendar">
      <div class="eng-content__icon">✅</div>
      <h3 class="eng-content__title">Đặt lịch thành công!</h3>
      <p class="eng-content__subtitle">Thêm vào lịch để không quên nhé</p>
      <div class="eng-calendar-buttons">${buttonsHTML}</div>
      <p class="eng-content__benefit">
        💡 Lịch sẽ tự nhắc bạn trước ${config.reminderMinutes[0] / 60}h — hoàn toàn miễn phí
      </p>
    </div>
  `;
}
```

---

## ⚙️ Configuration Defaults

```javascript
const CALENDAR_DEFAULTS = {
  reminderMinutes: [1440, 120],    // 1 day + 2 hours before
  duration: 60,                     // event duration in minutes
  timezone: 'Asia/Ho_Chi_Minh',
  providers: ['gcal', 'ics'],       // available calendar providers
};
```

---

## 🔗 Skill Inheritance

| Feature | Source Skill | Reuse |
|---------|-------------|-------|
| `BookingCalendarEngine` class | `cm-booking-calendar/calendar-engine.js` | Full schedule generation for milestone-based industries |
| Industry reminder configs | `cm-booking-calendar/reminder-config.js` | 20 industry presets with preparation instructions |
| ICS export | `cm-booking-calendar/calendar-export.js` | Core ICS generation logic |
| GCal deep link | `cm-booking-calendar/calendar-export.js` | URL builder |

> 📌 **Rule:** If user needs full scheduling (milestones, follow-ups, multi-appointment), delegate to `cm-booking-calendar` skill. This module handles the **post-action calendar CTA** only.
