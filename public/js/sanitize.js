/* ============================================
   HTML Sanitization Utility — XSS Prevention
   ============================================
   Shared utility for all public JS files.
   Use escapeHtml() before injecting user/i18n data via innerHTML.
*/

(function () {
  'use strict';

  /**
   * Escape HTML special characters to prevent XSS.
   * Use this for any dynamic text injected via innerHTML.
   * @param {string} str - The string to escape
   * @returns {string} - HTML-safe string
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Escape HTML then convert newlines to <br> tags.
   * Safe replacement for: str.replace(/\n/g, '<br>')
   * @param {string} str - The string to escape and convert
   * @returns {string} - HTML-safe string with <br> for newlines
   */
  function escapeHtmlWithBreaks(str) {
    return escapeHtml(str).replace(/\n/g, '<br>');
  }

  /**
   * Escape HTML for use inside an HTML attribute value.
   * @param {string} str - The string to escape
   * @returns {string} - Attribute-safe string
   */
  function escapeAttr(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Expose globally
  window.SecurityUtils = {
    escapeHtml,
    escapeHtmlWithBreaks,
    escapeAttr
  };
})();
