/**
 * CM Growth Hacking — Calendar CTA
 * 
 * Post-action calendar buttons: Google Calendar deep link + ICS download.
 * Smart device routing: iOS → ICS, Android → GCal, Desktop → both.
 * 
 * Kế thừa logic từ cm-booking-calendar/calendar-export.js
 * 
 * Usage:
 *   const html = CalendarCTA.render(event, config);
 *   sheet.setContent(html);
 *   
 *   CalendarCTA.addToGoogleCal(event, config);
 *   CalendarCTA.downloadICS(event, config);
 *   CalendarCTA.autoRoute(event, config); // device-aware
 */

(function () {
  'use strict';

  const CalendarCTA = {

    // ─── Device Detection ─────────────────────────────
    detectDevice() {
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
      if (/Android/.test(ua)) return 'android';
      return 'desktop';
    },

    // ─── Google Calendar Deep Link ────────────────────
    buildGoogleCalUrl(event, config) {
      const startDate = new Date(event.date + 'T' + (event.time || '09:00'));
      const endDate = new Date(startDate.getTime() + (config.duration || 60) * 60 * 1000);

      const formatGCal = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

      const description = [
        event.description || event.service || '',
        '',
        config.clinicName ? '📍 ' + config.clinicName : '',
        config.address ? '📌 ' + config.address : '',
        config.phone ? '📞 ' + config.phone : '',
        config.mapsUrl ? '🗺️ ' + config.mapsUrl : '',
        '',
        config.preparation ? '⚠️ Lưu ý: ' + config.preparation : '',
      ].filter(Boolean).join('\n');

      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title || (event.service + ' — ' + (config.clinicName || '')),
        dates: formatGCal(startDate) + '/' + formatGCal(endDate),
        details: description,
        location: config.address || '',
        sf: 'true',
        output: 'xml',
      });

      return 'https://calendar.google.com/calendar/render?' + params.toString();
    },

    addToGoogleCal(event, config) {
      const url = this.buildGoogleCalUrl(event, config);
      window.open(url, '_blank', 'noopener');
    },

    // ─── ICS File Generation (RFC 5545) ───────────────
    buildICSContent(event, config) {
      const uid = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '@' + (window.location.hostname || 'cm-growth-hacking');

      const startDate = new Date(event.date + 'T' + (event.time || '09:00'));
      const endDate = new Date(startDate.getTime() + (config.duration || 60) * 60 * 1000);
      const now = new Date();

      const formatICS = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

      const escapeICS = (str) => (str || '').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

      const description = escapeICS([
        event.description || event.service || '',
        '',
        config.clinicName ? '📍 ' + config.clinicName : '',
        config.address ? '📌 ' + config.address : '',
        config.phone ? '📞 ' + config.phone : '',
        config.preparation ? '⚠️ ' + config.preparation : '',
      ].filter(Boolean).join('\n'));

      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CMGrowthHacking//Calendar//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:' + uid,
        'DTSTAMP:' + formatICS(now),
        'DTSTART:' + formatICS(startDate),
        'DTEND:' + formatICS(endDate),
        'SUMMARY:' + escapeICS(event.title || (event.service + ' — ' + (config.clinicName || ''))),
        'DESCRIPTION:' + description,
        'LOCATION:' + escapeICS(config.address || ''),
      ];

      if (config.mapsUrl) {
        lines.push('URL:' + config.mapsUrl);
      }

      // Add reminders (VALARM)
      const reminders = config.reminderMinutes || [1440, 120]; // 1 day + 2h
      reminders.forEach(function (minutes) {
        const reminderText = minutes >= 1440
          ? 'Nhắc trước ' + (minutes / 1440) + ' ngày'
          : minutes >= 60
            ? 'Nhắc trước ' + (minutes / 60) + ' giờ'
            : 'Nhắc trước ' + minutes + ' phút';

        lines.push(
          'BEGIN:VALARM',
          'TRIGGER:-PT' + minutes + 'M',
          'ACTION:DISPLAY',
          'DESCRIPTION:' + escapeICS((event.title || event.service) + ' — ' + reminderText),
          'END:VALARM'
        );
      });

      lines.push('END:VEVENT', 'END:VCALENDAR');

      return lines.join('\r\n');
    },

    downloadICS(event, config) {
      const content = this.buildICSContent(event, config);
      const filename = (event.service || 'appointment').replace(/\s+/g, '-').toLowerCase() + '.ics';

      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // ─── Auto-Route by Device ─────────────────────────
    autoRoute(event, config) {
      const device = this.detectDevice();
      if (device === 'ios') {
        this.downloadICS(event, config);
      } else {
        this.addToGoogleCal(event, config);
      }
    },

    // ─── Render Calendar CTA HTML ─────────────────────
    render(event, config) {
      const device = this.detectDevice();
      let buttonsHTML = '';

      if (device === 'ios') {
        buttonsHTML = '<button class="eng-btn eng-btn--primary eng-btn--full" data-cal-action="ics">'
          + '📥 Thêm vào Apple Calendar</button>';
      } else if (device === 'android') {
        buttonsHTML = '<button class="eng-btn eng-btn--primary eng-btn--full" data-cal-action="gcal">'
          + '📅 Thêm vào Google Calendar</button>';
      } else {
        buttonsHTML = '<button class="eng-btn eng-btn--gcal" data-cal-action="gcal">'
          + '📅 Google Calendar</button>'
          + '<button class="eng-btn eng-btn--ics" data-cal-action="ics">'
          + '📥 Tải file lịch (.ics)</button>';
      }

      const reminderHours = config.reminderMinutes
        ? Math.round(config.reminderMinutes[0] / 60)
        : 24;

      const html = '<div class="eng-content-calendar">'
        + '<div class="eng-content__icon">✅</div>'
        + '<h3 class="eng-content__title">' + (config.successTitle || 'Thành công!') + '</h3>'
        + '<p class="eng-content__subtitle">' + (config.successSubtitle || 'Thêm vào lịch để không quên nhé') + '</p>'
        + '<div class="eng-calendar-buttons">' + buttonsHTML + '</div>'
        + '<p class="eng-content__benefit">💡 Lịch sẽ tự nhắc bạn trước '
        + reminderHours + 'h — hoàn toàn miễn phí</p>'
        + '</div>';

      return html;
    },

    // ─── Attach Click Handlers ────────────────────────
    attachHandlers(container, event, config, onAdd) {
      const self = this;
      const buttons = container.querySelectorAll('[data-cal-action]');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const action = btn.dataset.calAction;
          if (action === 'gcal') {
            self.addToGoogleCal(event, config);
          } else if (action === 'ics') {
            self.downloadICS(event, config);
          }
          if (typeof onAdd === 'function') {
            onAdd(action);
          }
        });
      });
    },
  };

  // ─── Export ─────────────────────────────────────────
  window.CalendarCTA = CalendarCTA;

})();
