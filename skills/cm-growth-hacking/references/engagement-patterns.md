# Engagement Patterns by Industry

> Config-ready patterns cho 10+ ngành nghề.
> Mỗi pattern = trigger + sheet + calendar + tracking config đầy đủ.

---

## 📋 Pattern Index

| # | Industry | Key Pattern | Calendar? |
|---|----------|-------------|-----------|
| 1 | Healthcare / Phòng khám | Booking + Follow-up Reminder | ✅ |
| 2 | Dental / Nha khoa | Booking + Periodic Reminder | ✅ |
| 3 | Salon / Spa | Booking + Re-booking Nudge | ✅ |
| 4 | Education / Đào tạo | Lead Capture + Event Registration | ✅ |
| 5 | Real Estate / BĐS | Lead Capture + Viewing Appointment | ✅ |
| 6 | E-commerce | Flash Sale + Cart Reminder | ⚪ |
| 7 | F&B / Nhà hàng | Reservation + Review | ✅ |
| 8 | Fitness / Gym | Trial Booking + Class Schedule | ✅ |
| 9 | Legal / Tư vấn pháp lý | Consultation Booking | ✅ |
| 10 | Events / Sự kiện | Event Registration + Calendar | ✅ |
| 11 | Insurance / Bảo hiểm | Lead Capture + Callback | ⚪ |
| 12 | Automotive / Ô tô | Test Drive Booking + Service Reminder | ✅ |

---

## 1. Healthcare / Phòng Khám

```javascript
const HEALTHCARE_PATTERN = {
  type: 'booking',
  trigger: { type: 'scroll', value: 0.25, delay: 0 },
  sheet: {
    size: 'standard',
    title: '📅 Đặt Lịch Khám',
    icon: '🏥',
    ariaLabel: 'Đặt lịch khám bệnh',
  },
  form: {
    fields: ['name', 'phone', 'date', 'timeSlot', 'service', 'note'],
    services: ['Khám tổng quát', 'Khám thai', 'Siêu âm', 'Xét nghiệm'],
    submitText: 'Xác Nhận Đặt Lịch',
  },
  calendar: {
    enabled: true,
    reminderMinutes: [1440, 120],
    preparation: 'Mang theo sổ khám, CCCD, thẻ BHYT. Đến sớm 15 phút.',
    duration: 60,
  },
  tracking: {
    events: ['cro_sheet_shown', 'cro_booking_submit', 'cro_calendar_add'],
    conversionValue: 500000,
    currency: 'VND',
  },
  session: { dismissKey: 'eng_healthcare_booking', storage: 'sessionStorage' },
};
```

---

## 2. Dental / Nha Khoa

```javascript
const DENTAL_PATTERN = {
  type: 'booking',
  trigger: { type: 'scroll', value: 0.25 },
  sheet: { size: 'standard', title: '🦷 Đặt Lịch Khám Răng', icon: '🦷' },
  form: {
    fields: ['name', 'phone', 'date', 'timeSlot', 'service'],
    services: ['Khám tổng quát', 'Tẩy trắng', 'Niềng răng', 'Nhổ răng khôn', 'Trồng implant'],
    submitText: 'Đặt Lịch',
  },
  calendar: {
    enabled: true,
    reminderMinutes: [1440, 120],
    preparation: 'Đánh răng sạch trước khi đến. Mang theo kết quả X-ray cũ (nếu có).',
    duration: 45,
  },
  tracking: { conversionValue: 300000 },
  session: { dismissKey: 'eng_dental_booking', storage: 'sessionStorage' },
};
```

---

## 3. Salon / Spa

```javascript
const SALON_PATTERN = {
  type: 'booking',
  trigger: { type: 'dual', value: { time: 12000, scroll: 0.2 } },
  sheet: { size: 'standard', title: '💆 Đặt Lịch Làm Đẹp', icon: '💅' },
  form: {
    fields: ['name', 'phone', 'date', 'timeSlot', 'service', 'branch'],
    services: ['Cắt tóc', 'Nhuộm tóc', 'Nail', 'Massage', 'Facial', 'Gội đầu dưỡng sinh'],
    submitText: 'Đặt Lịch',
  },
  calendar: {
    enabled: true,
    reminderMinutes: [1440, 60],
    preparation: 'Đến đúng giờ để được phục vụ tốt nhất.',
    duration: 90,
  },
  tracking: { conversionValue: 200000 },
  session: { dismissKey: 'eng_salon_booking', storage: 'sessionStorage' },
};
```

---

## 4. Education / Đào Tạo

```javascript
const EDUCATION_PATTERN = {
  type: 'lead',
  trigger: { type: 'exit', fallbackDelay: 20000 }, // exit intent on desktop
  sheet: {
    size: 'standard',
    title: '🎓 Nhận Tư Vấn Miễn Phí',
    icon: '📚',
  },
  form: {
    fields: ['name', 'phone', 'course'],
    services: ['Tiếng Anh giao tiếp', 'IELTS', 'Lập trình', 'Marketing'],
    submitText: 'Tư Vấn Cho Tôi',
  },
  calendar: {
    enabled: false, // no calendar for lead capture
  },
  tracking: {
    events: ['cro_sheet_shown', 'cro_lead_capture'],
    conversionValue: 100000,
  },
  session: { dismissKey: 'eng_edu_lead', storage: 'localStorage' },
};
```

---

## 5. Real Estate / BĐS

```javascript
const REALESTATE_PATTERN = {
  type: 'lead',
  trigger: { type: 'scroll', value: 0.3, delay: 5000 },
  sheet: {
    size: 'standard',
    title: '🏠 Đặt Lịch Xem Nhà',
    icon: '🏡',
  },
  form: {
    fields: ['name', 'phone', 'date', 'budget', 'area'],
    submitText: 'Đặt Lịch Xem',
  },
  calendar: {
    enabled: true,
    reminderMinutes: [1440, 120],
    preparation: 'Mang CCCD. Chuẩn bị câu hỏi về pháp lý, tiện ích.',
    duration: 60,
  },
  tracking: { conversionValue: 1000000 },
  session: { dismissKey: 'eng_re_lead', storage: 'localStorage' },
};
```

---

## 6. E-commerce

```javascript
const ECOMMERCE_PATTERN = {
  type: 'promo',
  trigger: { type: 'exit', fallbackDelay: 15000 },
  sheet: {
    size: 'compact',
    title: '🔥 Ưu Đãi Đặc Biệt',
    icon: '🎁',
  },
  promo: {
    message: 'Giảm 15% cho đơn hàng đầu tiên!',
    code: 'WELCOME15',
    countdown: true,
    countdownHours: 24,
  },
  calendar: { enabled: false },
  tracking: {
    events: ['cro_sheet_shown', 'cro_promo_engage'],
    conversionValue: 0, // varies per order
  },
  session: { dismissKey: 'eng_ecom_promo', storage: 'localStorage' },
};
```

---

## 7. F&B / Nhà Hàng

```javascript
const FNB_PATTERN = {
  type: 'booking',
  trigger: { type: 'scroll', value: 0.2 },
  sheet: { size: 'standard', title: '🍽️ Đặt Bàn', icon: '🍽️' },
  form: {
    fields: ['name', 'phone', 'date', 'timeSlot', 'guests', 'note'],
    submitText: 'Đặt Bàn',
  },
  calendar: {
    enabled: true,
    reminderMinutes: [180, 60], // 3h + 1h
    preparation: 'Gọi xác nhận nếu thay đổi số người.',
    duration: 120,
  },
  tracking: { conversionValue: 500000 },
  session: { dismissKey: 'eng_fnb_booking', storage: 'sessionStorage' },
};
```

---

## 8. Fitness / Gym

```javascript
const FITNESS_PATTERN = {
  type: 'booking',
  trigger: { type: 'dual', value: { time: 15000, scroll: 0.3 } },
  sheet: { size: 'standard', title: '💪 Đăng Ký Tập Thử', icon: '🏋️' },
  form: {
    fields: ['name', 'phone', 'date', 'timeSlot', 'goal'],
    services: ['Tập gym', 'Yoga', 'Boxing', 'CrossFit', 'Pilates'],
    submitText: 'Đăng Ký',
  },
  calendar: {
    enabled: true,
    reminderMinutes: [1440, 60],
    preparation: 'Mang quần áo thể thao, giày tập, khăn, nước uống.',
    duration: 90,
  },
  tracking: { conversionValue: 200000 },
  session: { dismissKey: 'eng_fitness_trial', storage: 'sessionStorage' },
};
```

---

## 9. Legal / Tư Vấn Pháp Lý

```javascript
const LEGAL_PATTERN = {
  type: 'booking',
  trigger: { type: 'scroll', value: 0.35 },
  sheet: { size: 'standard', title: '⚖️ Đặt Lịch Tư Vấn', icon: '⚖️' },
  form: {
    fields: ['name', 'phone', 'date', 'service', 'note'],
    services: ['Hôn nhân gia đình', 'Doanh nghiệp', 'Đất đai', 'Hình sự', 'Lao động'],
    submitText: 'Đặt Lịch Tư Vấn',
  },
  calendar: {
    enabled: true,
    reminderMinutes: [1440, 120],
    preparation: 'Mang theo hồ sơ, giấy tờ liên quan. Chuẩn bị tóm tắt vấn đề.',
    duration: 60,
  },
  tracking: { conversionValue: 500000 },
  session: { dismissKey: 'eng_legal_consult', storage: 'sessionStorage' },
};
```

---

## 10. Events / Sự Kiện

```javascript
const EVENT_PATTERN = {
  type: 'event',
  trigger: { type: 'time', value: 10000 },
  sheet: {
    size: 'standard',
    title: '🎤 Đăng Ký Tham Dự',
    icon: '🎪',
  },
  form: {
    fields: ['name', 'phone', 'email', 'tickets'],
    submitText: 'Đăng Ký',
  },
  calendar: {
    enabled: true, // Always add event to calendar
    reminderMinutes: [10080, 1440, 120], // 1 week + 1 day + 2h
    preparation: 'Mang email xác nhận / QR code để check-in.',
    duration: 180,
  },
  tracking: {
    events: ['cro_sheet_shown', 'cro_event_register', 'cro_calendar_add'],
    conversionValue: 300000,
  },
  session: { dismissKey: 'eng_event_register', storage: 'localStorage' },
};
```

---

## 🔧 How to Use Patterns

```javascript
// 1. Import pattern
const config = HEALTHCARE_PATTERN;

// 2. Override with site-specific config
config.calendar.clinicName = 'Phòng Khám An Sinh';
config.calendar.address = '123 Nguyễn Văn A, Q9, TPHCM';
config.calendar.phone = '0559 669 663';
config.calendar.mapsUrl = 'https://maps.google.com/?q=Phong+Kham+An+Sinh';

// 3. Initialize
const sheet = new BottomSheetEngine({
  id: 'booking',
  size: config.sheet.size,
  content: buildFormHTML(config),
  onShow: () => EngagementTracker.sheetShown(config.type, config.trigger.type),
  onDismiss: (s, dur) => EngagementTracker.sheetDismissed(config.type, 'close', dur),
});

const trigger = new TriggerManager({
  trigger: config.trigger,
  session: config.session,
  onTrigger: () => sheet.show(),
});

trigger.init();
```

---

## 📊 Conversion Value Guide

| Industry | Avg Conversion Value (VND) | Rationale |
|----------|---------------------------|-----------|
| Healthcare | 300,000 - 1,000,000 | Consultation + follow-up potential |
| Dental | 200,000 - 500,000 | Exam + treatment plan |
| Salon/Spa | 150,000 - 500,000 | Service booking |
| Education | 50,000 - 200,000 | Lead value (not enrollment) |
| Real Estate | 500,000 - 2,000,000 | High-ticket lead |
| E-commerce | Varies per order | Dynamic value |
| F&B | 200,000 - 1,000,000 | Table reservation value |
| Fitness | 100,000 - 300,000 | Trial → membership funnel |
| Legal | 500,000 - 2,000,000 | Consultation fee |
| Events | 100,000 - 500,000 | Ticket value |
