// GTM Variables — Full Configuration Reference
// Create ALL of these in GTM > Variables > User-Defined Variables

// ═══════ DataLayer Variables ═══════
// Variable Name           | Type              | DataLayer Variable Name
// DL - event_id           | Data Layer Variable | event_id
// DL - order_id           | Data Layer Variable | transaction_id
// DL - order_value        | Data Layer Variable | value
// DL - currency           | Data Layer Variable | currency
// DL - content_ids        | Data Layer Variable | content_ids
// DL - content_type       | Data Layer Variable | content_type
// DL - content_name       | Data Layer Variable | content_name
// DL - email_hashed       | Data Layer Variable | email_hashed
// DL - phone_hashed       | Data Layer Variable | phone_hashed

// ═══════ First-Touch Cookie Variables ═══════
// Variable Name           | Type              | Cookie / Key
// FTC - source            | 1st-Party Cookie  | Cookie: _ftc, key: src
// FTC - medium            | 1st-Party Cookie  | Cookie: _ftc, key: med
// FTC - campaign          | 1st-Party Cookie  | Cookie: _ftc, key: cmp

// ═══════ URL Parameters ═══════
// Variable Name           | Type              | Query Parameter
// URL - utm_source        | URL               | utm_source
// URL - utm_medium        | URL               | utm_medium
// URL - utm_campaign      | URL               | utm_campaign
// URL - fbclid            | URL               | fbclid
// URL - ttclid            | URL               | ttclid
// URL - gclid             | URL               | gclid

// ═══════ First-Touch Cookie Capture (Custom HTML Tag) ═══════
// Trigger: All Pages
// Fire once: Only if _ftc cookie does NOT exist
<script>
(function(){
  if (document.cookie.indexOf('_ftc=') !== -1) return;
  var params = new URLSearchParams(window.location.search);
  var ftc = {
    src: params.get('utm_source') || '',
    med: params.get('utm_medium') || '',
    cmp: params.get('utm_campaign') || '',
    cnt: params.get('utm_content') || '',
    trm: params.get('utm_term') || '',
    fbclid: params.get('fbclid') || '',
    ttclid: params.get('ttclid') || '',
    gclid: params.get('gclid') || '',
    ref: document.referrer ? new URL(document.referrer).hostname : '',
    ts: new Date().toISOString()
  };
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 90);
  document.cookie = '_ftc=' + encodeURIComponent(JSON.stringify(ftc))
    + ';expires=' + expiry.toUTCString()
    + ';path=/;SameSite=Lax';
})();
</script>
