/**
 * Calendar Export Module v1.0
 * ICS generation (RFC 5545) + Google Calendar deep links
 * Device detection for iOS/Android
 * 
 * Usage:
 *   addToGoogleCal(appointment, config);
 *   downloadICS(appointment, config);
 *   downloadAllICS(appointments, config);
 */

// ============================================================
// CALENDAR EXPORT — Google Calendar + ICS (.ics)
// ============================================================

/**
 * Build Google Calendar event creation URL
 * @param {Object} event — Appointment object from BookingCalendarEngine
 * @param {Object} config — Industry config with clinic info
 * @returns {string} — Google Calendar URL
 */
function buildGoogleCalUrl(event, config) {
    const title = encodeURIComponent(
        config.calendarTitleTemplate
            .replace('{service}', event.title)
            .replace('{clinicName}', config.clinicName)
    );

    const descParts = [];
    descParts.push(event.desc || '');
    descParts.push('');

    // Add preparation notes
    if (config.reminderContent?.preparation) {
        descParts.push(`📋 Chuẩn bị: ${config.reminderContent.preparation}`);
    }
    if (config.reminderContent?.arriveEarly) {
        descParts.push(`⏰ Đến sớm: ${config.reminderContent.arriveEarly}`);
    }
    if (config.reminderContent?.fasting) {
        descParts.push('🚫 Nhịn ăn trước khi đến');
    }
    if (config.reminderContent?.bringDocuments?.length) {
        descParts.push(`📄 Mang theo: ${config.reminderContent.bringDocuments.join(', ')}`);
    }
    if (config.reminderContent?.specialNotes) {
        descParts.push(`💡 ${config.reminderContent.specialNotes}`);
    }

    descParts.push('');
    descParts.push(`📍 ${config.clinicName}`);
    descParts.push(`📌 ${config.clinicAddress}`);
    if (config.clinicPhone) descParts.push(`📞 ${config.clinicPhone}`);
    if (config.googleMapsUrl) descParts.push(`🗺️ ${config.googleMapsUrl}`);
    descParts.push('');
    descParts.push('Lịch hẹn được tạo tự động — Booking Calendar CRO Engine');

    const details = encodeURIComponent(descParts.join('\n'));
    const location = encodeURIComponent(`${config.clinicName}, ${config.clinicAddress}`);

    // Build date strings
    const startDate = event.dateISO;
    let endDate = event.dateISO;

    // If event has specific time, use datetime format
    if (event.timeStr && event.timeStr !== '00:00') {
        const startDT = `${startDate}T${event.timeStr.replace(':', '')}00`;
        // Default 1-hour appointment
        const endTime = _addHour(event.timeStr);
        const endDT = `${startDate}T${endTime.replace(':', '')}00`;
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDT}/${endDT}&details=${details}&location=${location}`;
    }

    // All-day event
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

/**
 * Build ICS content (RFC 5545) for one or more events
 * @param {Array} events — Array of appointment objects
 * @param {Object} config — Industry config
 * @returns {string} — ICS file content
 */
function buildICSContent(events, config) {
    const alarms = config.reminderAlarms || [
        { trigger: '-P1D', description: 'Nhắc lịch hẹn ngày mai' },
        { trigger: '-PT2H', description: 'Lịch hẹn hôm nay' }
    ];

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//TodyAI//Booking Calendar CRO Engine//VI`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:Lịch Hẹn — ${config.clinicName}`,
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    ];

    events.forEach(event => {
        const uid = `${event.dateISO}-${event.index || 0}@booking-calendar-cro`;
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        // Build description
        const descParts = [event.desc || ''];
        if (config.reminderContent?.preparation) {
            descParts.push(`Chuẩn bị: ${config.reminderContent.preparation}`);
        }
        if (config.reminderContent?.arriveEarly) {
            descParts.push(`Đến sớm: ${config.reminderContent.arriveEarly}`);
        }
        if (config.reminderContent?.fasting) {
            descParts.push('Nhịn ăn trước khi đến');
        }
        if (config.reminderContent?.bringDocuments?.length) {
            descParts.push(`Mang theo: ${config.reminderContent.bringDocuments.join(', ')}`);
        }
        descParts.push(`${config.clinicName}`);
        descParts.push(`Địa chỉ: ${config.clinicAddress}`);
        if (config.clinicPhone) descParts.push(`SĐT: ${config.clinicPhone}`);
        if (config.googleMapsUrl) descParts.push(`Maps: ${config.googleMapsUrl}`);

        const description = descParts.join('\\n');
        const locationStr = `${config.clinicName}\\, ${config.clinicAddress}`;

        // Urgency badge in title
        const urgencyEmoji = event.urgency === 'critical' ? '🔴 '
            : event.urgency === 'recommended' ? '🟡 '
                : event.urgency === 'monitoring' ? '🟢 '
                    : '';

        const summary = `${urgencyEmoji}${event.title} — ${config.clinicName}`;

        lines.push('BEGIN:VEVENT');

        // Date/time format
        if (event.timeStr && event.timeStr !== '00:00') {
            const startDT = `${event.dateISO}T${event.timeStr.replace(':', '')}00`;
            const endTime = _addHour(event.timeStr);
            const endDT = `${event.dateISO}T${endTime.replace(':', '')}00`;
            lines.push(`DTSTART;TZID=Asia/Ho_Chi_Minh:${startDT}`);
            lines.push(`DTEND;TZID=Asia/Ho_Chi_Minh:${endDT}`);
        } else {
            lines.push(`DTSTART;VALUE=DATE:${event.dateISO}`);
            lines.push(`DTEND;VALUE=DATE:${event.dateISO}`);
        }

        lines.push(`DTSTAMP:${now}`);
        lines.push(`UID:${uid}`);
        lines.push(`SUMMARY:${summary}`);
        lines.push(`DESCRIPTION:${description}`);
        lines.push(`LOCATION:${locationStr}`);

        // Add configurable VALARM reminders
        alarms.forEach(alarm => {
            const alarmDesc = alarm.description
                .replace('{title}', event.title)
                .replace('{time}', event.timeStr || '')
                .replace('{clinicName}', config.clinicName);

            lines.push('BEGIN:VALARM');
            lines.push(`TRIGGER:${alarm.trigger}`);
            lines.push('ACTION:DISPLAY');
            lines.push(`DESCRIPTION:${alarmDesc}`);
            lines.push('END:VALARM');
        });

        lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

// ── User-Facing Functions ──

/**
 * Open Google Calendar with pre-filled event
 */
function addToGoogleCal(event, config) {
    if (!event) return;
    window.open(buildGoogleCalUrl(event, config), '_blank');

    // Track event
    _trackCalendarAction('gcal', event, config);
}

/**
 * Batch add all future events to Google Calendar
 */
function addAllToGoogleCal(events, config) {
    if (!events || !events.length) return;
    const future = events.filter(e => !e.isPast);
    if (future.length === 0) {
        _showToast('Không có lịch hẹn sắp tới nào.', 'error');
        return;
    }

    // Open first event
    window.open(buildGoogleCalUrl(future[0], config), '_blank');

    // Prompt for rest
    if (future.length > 1) {
        setTimeout(() => {
            if (confirm(`Đã mở lịch "${future[0].title}". Tiếp tục thêm ${future.length - 1} lịch còn lại?`)) {
                future.slice(1).forEach((e, i) => {
                    setTimeout(() => window.open(buildGoogleCalUrl(e, config), '_blank'), i * 800);
                });
            }
        }, 1000);
    }

    _trackCalendarAction('gcal-all', future[0], config, future.length);
}

/**
 * Download single event as .ics file
 */
function downloadICS(event, config) {
    if (!event) return;
    const content = buildICSContent([event], config);
    const filename = `lich-hen-${_slugify(event.title)}.ics`;
    _triggerDownload(content, filename);

    _trackCalendarAction('ics', event, config);
}

/**
 * Download all future events as single .ics file
 */
function downloadAllICS(events, config) {
    if (!events || !events.length) return;
    const future = events.filter(e => !e.isPast);
    if (future.length === 0) {
        _showToast('Không có lịch hẹn sắp tới nào.', 'error');
        return;
    }

    const content = buildICSContent(future, config);
    const filename = `lich-hen-${_slugify(config.clinicName)}.ics`;
    _triggerDownload(content, filename);

    _trackCalendarAction('ics-all', future[0], config, future.length);
}

/**
 * Smart calendar action — detect device and choose best method
 * iOS → ICS download (Apple Calendar)
 * Android → Google Calendar deep link
 * Desktop → Show both options
 */
function smartCalendarAction(event, config) {
    const device = detectDevice();

    if (device === 'ios') {
        downloadICS(event, config);
    } else if (device === 'android') {
        addToGoogleCal(event, config);
    } else {
        // Desktop — return both options, let UI handle
        return { gcalUrl: buildGoogleCalUrl(event, config), icsAvailable: true };
    }
}

/**
 * Build post-submit Calendar CTA HTML
 * Shows after successful form submission
 */
function buildCalendarCTA(event, config) {
    const device = detectDevice();

    let buttonsHTML = '';

    if (device !== 'ios') {
        buttonsHTML += `
      <button onclick="addToGoogleCal(window._lastBookedEvent, window._bookingConfig)" class="booking-cal-btn booking-cal-btn--gcal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Google Calendar
      </button>`;
    }

    if (device !== 'android') {
        buttonsHTML += `
      <button onclick="downloadICS(window._lastBookedEvent, window._bookingConfig)" class="booking-cal-btn booking-cal-btn--ics">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
        Tải file lịch (.ics)
      </button>`;
    }

    return `
    <div class="booking-calendar-cta" id="booking-calendar-cta">
      <div class="cta-success-icon">✅</div>
      <p class="cta-title">Đặt lịch thành công!</p>
      <p class="cta-subtitle">📅 Thêm vào lịch để không quên nhé!</p>
      <div class="cta-buttons">${buttonsHTML}</div>
      <p class="cta-benefit">💡 Lịch sẽ tự nhắc bạn trước — hoàn toàn miễn phí, không tốn SMS</p>
    </div>`;
}

// ── Device Detection ──

function detectDevice() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
}

// ── Private Helpers ──

function _triggerDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function _addHour(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const newH = (h + 1) % 24;
    return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function _slugify(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function _showToast(msg, type) {
    // Use existing toast system from cm-google-form if available
    if (typeof window.showFormToast === 'function') {
        window.showFormToast(msg, type);
        return;
    }

    // Fallback simple toast
    const toast = document.getElementById('form-toast');
    if (toast) {
        toast.className = `form-toast form-toast--${type}`;
        toast.querySelector('.form-toast-msg').textContent = msg;
        toast.hidden = false;
        setTimeout(() => { toast.hidden = true; }, 6000);
    }
}

/**
 * Track calendar action — integrates with cm-ads-tracker
 * Pushes dataLayer event for GTM
 */
function _trackCalendarAction(calendarType, event, config, count) {
    if (typeof dataLayer === 'undefined') return;

    dataLayer.push({
        event: 'cro_calendar_add',
        event_id: _generateUUID(),
        content_name: event.title,
        calendar_type: calendarType, // 'gcal', 'ics', 'gcal-all', 'ics-all'
        appointments_count: count || 1,
        industry: config.key,
        value: config.conversionValue || 0,
        currency: 'VND',
    });
}

function _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        buildGoogleCalUrl,
        buildICSContent,
        addToGoogleCal,
        addAllToGoogleCal,
        downloadICS,
        downloadAllICS,
        smartCalendarAction,
        buildCalendarCTA,
        detectDevice,
    };
}
