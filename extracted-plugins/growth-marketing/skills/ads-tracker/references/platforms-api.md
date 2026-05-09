# Platform Server-Side APIs Reference

## Why Server-Side APIs Matter

Browser-side pixels face increasing signal loss due to:
- Ad blockers (15-40% of users block tracking scripts)
- iOS 14+ and browser privacy restrictions (Safari ITP, Firefox ETP)
- Cookie deprecation timeline

Server-side APIs (CAPI, Events API) send events directly from your server to the platform — bypassing browser restrictions entirely. Combined with browser pixels and deduplication via event_id, this gives you the best possible signal quality.

Typical uplift from adding server-side APIs:
- Meta CAPI: +10-20% more matched conversions
- TikTok Events API: +8-15% uplift
- Google Enhanced Conversions: +15-25% conversion recovery

---

## 1. Meta Conversions API (CAPI)

### Setup Methods (choose one)

**Option A: Via Server-Side GTM (recommended for non-developers)**
- Set up GTM Server-Side container (hosted on Google Cloud or Stape.io)
- Route website events through server GTM → server GTM sends to Meta CAPI
- No backend code changes needed

**Option B: Direct API Integration (for developers)**
- Endpoint: https://graph.facebook.com/v18.0/{pixel_id}/events
- Authentication: System User Access Token from Meta Business Manager
- Server sends HTTP POST for each conversion event

### Required Fields for Every CAPI Event

```
{
  "data": [{
    "event_name": "Purchase",         // Standard Meta event name
    "event_time": 1703123456,         // Unix timestamp (server time)
    "event_id": "uuid-generated-at-conversion",  // CRITICAL for dedup
    "action_source": "website",       // Required
    "event_source_url": "https://yoursite.com/thank-you",
    "user_data": {
      "em": ["sha256_of_lowercase_email"],    // Hashed email
      "ph": ["sha256_of_digitsonly_phone"],   // Hashed phone
      "client_ip_address": "123.456.789.0",   // Server-detected IP
      "client_user_agent": "Mozilla/5.0...",  // From request headers
      "fbp": "_fb.1.1234567890.abcdefg",     // _fbp cookie value
      "fbc": "fb.1.1234567890.AbCdEfGhIj"   // _fbc cookie value (from fbclid)
    },
    "custom_data": {
      "value": 500000,
      "currency": "VND",
      "content_ids": ["PROD-123"],
      "content_type": "product",
      "contents": [{"id": "PROD-123", "quantity": 1, "item_price": 500000}],
      "num_items": 1,
      "order_id": "ORDER-20240101-001"
    }
  }],
  "access_token": "EAAxxxxxxxxxxxx"
}
```

### Deduplication Logic

When your browser pixel AND CAPI both fire for the same conversion:
- Both include identical `event_id` value
- Meta's system receives both events within 48-hour window
- Meta matches them by event_id and counts as ONE conversion
- You see "Matched events" count in Events Manager

The `event_id` MUST be:
- Generated ONCE per conversion (not per request)
- Identical in both browser dataLayer.push() and CAPI payload
- Unique across all conversions (use UUID v4)

### How to Get CAPI Access Token

1. Go to Meta Business Manager → Events Manager
2. Select your Pixel → Settings
3. Scroll to "Conversions API"
4. Click "Generate Access Token" (or use System User token from Business Settings)
5. Copy token — treat it as a secret (never expose in browser-side code)

### Testing CAPI Events

Use Meta's Test Events tool in Events Manager → Test Events tab.
Set test_event_code in payload during development:
Add "test_event_code": "TEST12345" to the payload root (not inside data array).

---

## 2. TikTok Events API

### Setup Methods

**Option A: Via Server-Side GTM with TikTok template**
- Use community TikTok Events API GTM server-side template
- Route events through server GTM

**Option B: Direct API Integration**
- Endpoint: https://business-api.tiktok.com/open_api/v1.3/event/track/
- Authentication: Access Token from TikTok Events Manager

### Required Fields for Every Events API Event

```
{
  "pixel_code": "CXXXXXXXXXX",
  "event": "CompletePayment",           // TikTok standard event name
  "event_id": "uuid-generated-at-conversion",  // For dedup with pixel
  "timestamp": "2024-01-15T10:30:00+07:00",
  "context": {
    "page": {
      "url": "https://yoursite.com/thank-you",
      "referrer": "https://yoursite.com/checkout"
    },
    "user": {
      "email": "sha256_of_lowercase_email",
      "phone_number": "sha256_of_digits_only_phone"
    },
    "ip": "123.456.789.0",
    "user_agent": "Mozilla/5.0..."
  },
  "properties": {
    "value": 500000,
    "currency": "VND",
    "content_ids": ["PROD-123"],
    "content_type": "product",
    "contents": [
      {
        "content_id": "PROD-123",
        "content_name": "Product Name",
        "content_type": "product",
        "quantity": 1,
        "price": 500000
      }
    ]
  }
}
```

Authentication header: "Access-Token: [your access token]"
Content-Type: application/json

### Getting TikTok Events API Access Token

1. TikTok Ads Manager → Assets → Events
2. Select your Pixel → Set Up Web Events → Events API
3. Generate Access Token
4. Store securely server-side

### TikTok Deduplication

Works identically to Meta: same event_id sent from both pixel and Events API.
TikTok matches within 48-hour window.

---

## 3. Google Enhanced Conversions

### How It Works

Unlike Meta CAPI and TikTok Events API (which are standalone APIs), Google Enhanced Conversions supplements your existing Google Ads conversion tag with hashed user data.

The existing GTM Google Ads tag is enhanced with a user_data object containing:
- email_address (raw — Google hashes it)
- phone_number (raw — with country code prefix e.g. "+84912345678")
- address.first_name, address.last_name, address.country, address.postal_code

IMPORTANT: Google hashes the data itself (unlike Meta/TikTok where you pre-hash).
Do NOT SHA256 hash for Enhanced Conversions — pass raw data.

### Setup in GTM

In your existing Google Ads Conversion Tracking tag:
1. Scroll to "Enhanced conversions"
2. Enable "Include user-provided data from your website"
3. Under "User-provided data variable", create a new variable:
   - Type: User-Provided Data
   - Enter email variable: [DataLayer variable for email]
   - Enter phone variable: [DataLayer variable for phone]

The DataLayer push should include raw (unhashed) email and phone:
email: "customer@email.com"
phone: "+84912345678"

Or if privacy is a concern: pre-hash with SHA256 and mark as "sha256_email_address" in the enhanced conversions config.

### Google Tag API (Server-Side Enhanced Conversions)

For server-side Enhanced Conversions via the Google Ads API:
- Use the Google Ads API ConversionUploadService
- Send click conversion with hashed user identifiers
- Match window: same as your conversion window setting

---

## 4. Attribution Accuracy Benchmark

After implementing pixel + server-side API for all platforms, expect:

| Scenario | Pixel Only | Pixel + CAPI/Events API |
|---|---|---|
| iOS 14+ users | 30-50% signal loss | Full signal recovery |
| Ad blocker users | 0% tracking | 80-90% recovery |
| Overall conversion match rate | 60-70% | 85-95% |
| ROAS accuracy | Understated by 20-40% | Near-accurate |

### Validating Server-Side Setup

**Meta:** Events Manager → Pixel → Overview → Check "Event match quality" score
- Score 6-7: Good
- Score 8+: Excellent
- Below 5: Missing user_data fields (em, ph, fbp, fbc)

**TikTok:** Ads Manager → Assets → Events → Pixel → Data Details
- Check "Match rate" percentage
- Target: 60%+ match rate

**Google:** Google Ads → Conversions → View column "Enhanced conv." count
- Compare with standard conversion count
- Uplift of 15-25% is typical and expected

---

## 5. Priority Implementation Order

If budget/time is limited, implement in this order:

1. Browser pixels via GTM (Phase B) — covers 60-70% of users
2. First-touch cookie + UTM tracking — attribution clarity
3. Meta CAPI — highest ROI platform, biggest uplift from server-side
4. Google Enhanced Conversions — easy to add, 15-25% uplift
5. TikTok Events API — add once other platforms are stable

Never implement CAPI without also keeping the browser pixel — you need both for deduplication to work. If you only have CAPI, you lose browser-generated signals like fbp cookie.
