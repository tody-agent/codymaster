/**
 * CM Growth Hacking — Tracking Events
 * 
 * Engagement-specific dataLayer push helpers.
 * Compatible with cm-ads-tracker GTM architecture.
 * 
 * Usage:
 *   trackEngagement('cro_sheet_shown', { sheet_type: 'booking', trigger_type: 'scroll' });
 *   trackEngagement('cro_booking_submit', { content_name: 'Khám thai', value: 500000 });
 *   trackEngagement('cro_calendar_add', { calendar_type: 'gcal' });
 */

(function () {
  'use strict';

  // ─── UUID Generator ─────────────────────────────────
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ─── SHA256 Hash ────────────────────────────────────
  function sha256Hash(value) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return Promise.resolve('');
    }
    var encoder = new TextEncoder();
    var data = encoder.encode(value.toLowerCase().trim());
    return crypto.subtle.digest('SHA-256', data).then(function (hash) {
      return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  function hashPhone(phone) {
    var digits = (phone || '').replace(/\D/g, '');
    return sha256Hash(digits);
  }

  // ─── Core Tracker ───────────────────────────────────
  function trackEngagement(eventName, data) {
    var payload = {
      event: eventName,
      event_id: generateUUID(),
      page_path: window.location.pathname,
      page_url: window.location.href,
      timestamp: Date.now(),
    };

    // Merge extra data
    if (data && typeof data === 'object') {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          payload[key] = data[key];
        }
      }
    }

    // Push to GTM dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    // Store locally for debug/analytics
    _storeLocal(payload);

    return payload;
  }

  // ─── Local Analytics Storage ────────────────────────
  var LOCAL_KEY = 'eng_analytics';
  var MAX_LOCAL_EVENTS = 100;

  function _storeLocal(payload) {
    try {
      var stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      stored.push({
        event: payload.event,
        page: payload.page_path,
        time: new Date(payload.timestamp).toISOString(),
        data: payload
      });
      // Keep max events
      if (stored.length > MAX_LOCAL_EVENTS) {
        stored.splice(0, stored.length - MAX_LOCAL_EVENTS);
      }
      localStorage.setItem(LOCAL_KEY, JSON.stringify(stored));
    } catch (e) { /* noop */ }
  }

  // ─── Debug: Get Local Stats ─────────────────────────
  function getEngagementStats() {
    try {
      var events = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      var stats = {};

      events.forEach(function (e) {
        var key = e.event;
        if (!stats[key]) stats[key] = { count: 0, last: null, pages: {} };
        stats[key].count++;
        stats[key].last = e.time;
        stats[key].pages[e.page] = (stats[key].pages[e.page] || 0) + 1;
      });

      console.table(stats);
      return stats;
    } catch (e) { return {}; }
  }

  // ─── Clear Local Stats ──────────────────────────────
  function clearEngagementStats() {
    try { localStorage.removeItem(LOCAL_KEY); }
    catch (e) { /* noop */ }
  }

  // ─── Preset Event Helpers ───────────────────────────
  var EngagementTracker = {
    // Sheet lifecycle
    sheetShown: function (sheetType, triggerType, extra) {
      return trackEngagement('cro_sheet_shown', Object.assign({
        sheet_type: sheetType,
        trigger_type: triggerType,
      }, extra || {}));
    },

    sheetDismissed: function (sheetType, method, timeVisible, interacted) {
      return trackEngagement('cro_sheet_dismissed', {
        sheet_type: sheetType,
        dismiss_method: method,           // swipe | close_button | backdrop | escape
        time_visible: timeVisible || 0,   // ms
        interacted: !!interacted,
      });
    },

    // Conversions
    bookingSubmit: function (serviceName, value, currency, extra) {
      return trackEngagement('cro_booking_submit', Object.assign({
        content_name: serviceName,
        value: value || 0,
        currency: currency || 'VND',
        source_sheet: true,
      }, extra || {}));
    },

    calendarAdd: function (calendarType, serviceName, extra) {
      return trackEngagement('cro_calendar_add', Object.assign({
        calendar_type: calendarType,       // gcal | ics
        content_name: serviceName,
        device_type: _detectDeviceType(),
      }, extra || {}));
    },

    leadCapture: function (contentName, triggerType, value, extra) {
      return trackEngagement('cro_lead_capture', Object.assign({
        content_name: contentName,
        trigger_type: triggerType,
        value: value || 0,
        currency: 'VND',
      }, extra || {}));
    },

    promoEngage: function (promoName, extra) {
      return trackEngagement('cro_promo_engage', Object.assign({
        content_name: promoName,
      }, extra || {}));
    },

    surveyComplete: function (rating, hasFeedback, surveyType, extra) {
      return trackEngagement('cro_survey_complete', Object.assign({
        rating: rating,
        has_feedback: !!hasFeedback,
        survey_type: surveyType || 'post_service',
      }, extra || {}));
    },

    chatInitiate: function (channel, triggerType, extra) {
      return trackEngagement('cro_chat_initiate', Object.assign({
        channel: channel,                  // zalo | messenger | phone | whatsapp
        trigger_type: triggerType,
      }, extra || {}));
    },

    reengagement: function (visitCount, extra) {
      return trackEngagement('cro_reengagement', Object.assign({
        visit_count: visitCount,
      }, extra || {}));
    },
  };

  function _detectDeviceType() {
    var ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  }

  // ─── Export ─────────────────────────────────────────
  window.trackEngagement = trackEngagement;
  window.EngagementTracker = EngagementTracker;
  window.getEngagementStats = getEngagementStats;
  window.clearEngagementStats = clearEngagementStats;
  window.sha256Hash = sha256Hash;
  window.hashPhone = hashPhone;

})();
