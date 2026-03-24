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

  /**
   * Sanitize HTML with a whitelist of safe tags and attributes.
   * Allows safe formatting tags (strong, em, b, i, code, br, span)
   * while stripping all other HTML to prevent XSS.
   * Also converts newlines to <br> tags.
   * @param {string} str - The string to sanitize
   * @returns {string} - Sanitized HTML string
   */
  function sanitizeHtml(str) {
    if (typeof str !== 'string') return '';

    // Use a temporary DOM element to parse HTML safely
    var temp = document.createElement('div');
    temp.innerHTML = str;

    // Allowed tags (lowercase)
    var ALLOWED_TAGS = ['strong', 'em', 'b', 'i', 'code', 'br', 'span'];
    // Allowed attributes per tag
    var ALLOWED_ATTRS = {
      'i': ['data-lucide', 'style', 'class'],
      'span': ['class', 'style'],
      'code': ['class']
    };
    // Style properties allowed (only sizing for icons)
    var ALLOWED_STYLE_PROPS = ['width', 'height'];

    function sanitizeNode(node) {
      var result = '';
      for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.nodeType === 3) {
          // Text node — escape it
          result += escapeHtml(child.textContent);
        } else if (child.nodeType === 1) {
          // Element node
          var tag = child.tagName.toLowerCase();
          if (ALLOWED_TAGS.indexOf(tag) === -1) {
            // Not allowed — include children as text only
            result += escapeHtml(child.textContent);
            continue;
          }
          // Build sanitized tag
          result += '<' + tag;
          // Add allowed attributes
          var allowedAttrs = ALLOWED_ATTRS[tag] || [];
          for (var j = 0; j < allowedAttrs.length; j++) {
            var attrName = allowedAttrs[j];
            var attrVal = child.getAttribute(attrName);
            if (attrVal !== null) {
              if (attrName === 'style') {
                // Filter style properties
                var safeParts = [];
                attrVal.split(';').forEach(function(part) {
                  var trimmed = part.trim();
                  if (!trimmed) return;
                  var colonIdx = trimmed.indexOf(':');
                  if (colonIdx > 0) {
                    var prop = trimmed.substring(0, colonIdx).trim().toLowerCase();
                    var val = trimmed.substring(colonIdx + 1).trim();
                    if (ALLOWED_STYLE_PROPS.indexOf(prop) !== -1) {
                      safeParts.push(prop + ':' + escapeAttr(val));
                    }
                  }
                });
                if (safeParts.length > 0) {
                  result += ' style="' + safeParts.join(';') + '"';
                }
              } else {
                result += ' ' + attrName + '="' + escapeAttr(attrVal) + '"';
              }
            }
          }
          if (tag === 'br') {
            result += '>';
          } else {
            result += '>';
            result += sanitizeNode(child);
            result += '</' + tag + '>';
          }
        }
      }
      return result;
    }

    var sanitized = sanitizeNode(temp);
    // Convert remaining newlines to <br>
    return sanitized.replace(/\n/g, '<br>');
  }

  // Expose globally
  window.SecurityUtils = {
    escapeHtml,
    escapeHtmlWithBreaks,
    escapeAttr,
    sanitizeHtml
  };
})();
