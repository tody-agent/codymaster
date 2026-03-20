# GTM Architecture Reference — Full Container Build Spec

## Core Design Principle: Channel-Agnostic DataLayer

The website never knows which ad platforms are active. It only fires standardized `dataLayer.push()` calls. GTM reads these and routes them to the appropriate platform tags. This architecture means:
- Adding/removing an ad platform = zero developer work
- All platforms receive identical, consistent data
- One source of truth for all conversion parameters

---

## GTM Container Structure

```
GTM Container
├── Variables (19 standard + custom)
│   ├── DataLayer Variables (event data)
│   ├── URL Variables (UTM + click IDs)
│   ├── Cookie Variables (first-touch data)
│   └── Constant Variables (Pixel IDs)
│
├── Triggers (2 base + N conversion triggers)
│   ├── All Pages (PageView)
│   ├── Custom Event: cro_purchase
│   ├── Custom Event: cro_lead
│   ├── Custom Event: cro_view_content
│   ├── Custom Event: cro_add_to_cart
│   ├── Custom Event: cro_initiate_checkout
│   ├── Custom Event: cro_registration
│   ├── Click Trigger: tel: links (phone calls)
│   └── [additional custom event triggers as needed]
│
└── Tags (base + conversion per platform)
    ├── SYSTEM: First-Touch Cookie Capture (All Pages, once)
    ├── [Platform] Base Pixel (All Pages)
    ├── [Platform] [Event] Conversion (per conversion trigger)
    └── GA4 Configuration + Events
```

---

## Variables — Complete Specification

### DataLayer Variables
These read values from `dataLayer.push()` calls made by the website.

| Variable Name | Variable Type | DataLayer Variable Name | Default Value |
|---|---|---|---|
| DL - event | Data Layer Variable | event | undefined |
| DL - event_id | Data Layer Variable | event_id | undefined |
| DL - transaction_id | Data Layer Variable | transaction_id | undefined |
| DL - value | Data Layer Variable | value | 0 |
| DL - currency | Data Layer Variable | currency | VND |
| DL - content_ids | Data Layer Variable | content_ids | undefined |
| DL - content_type | Data Layer Variable | content_type | product |
| DL - content_name | Data Layer Variable | content_name | undefined |
| DL - contents | Data Layer Variable | contents | undefined |
| DL - num_items | Data Layer Variable | num_items | 1 |
| DL - email_hashed | Data Layer Variable | email_hashed | undefined |
| DL - phone_hashed | Data Layer Variable | phone_hashed | undefined |
| DL - lead_id | Data Layer Variable | lead_id | undefined |
| DL - search_string | Data Layer Variable | search_string | undefined |

### URL Variables
These read from the current page URL query string.

| Variable Name | Variable Type | Query Variable |
|---|---|---|
| URL - utm_source | URL | utm_source |
| URL - utm_medium | URL | utm_medium |
| URL - utm_campaign | URL | utm_campaign |
| URL - utm_content | URL | utm_content |
| URL - utm_term | URL | utm_term |
| URL - fbclid | URL | fbclid |
| URL - ttclid | URL | ttclid |
| URL - gclid | URL | gclid |

### Cookie Variables
These read from first-party cookies stored in the user's browser.

| Variable Name | Variable Type | Cookie Name |
|---|---|---|
| Cookie - ftc_raw | 1st-Party Cookie | _ftc |
| Cookie - fbp | 1st-Party Cookie | _fbp |
| Cookie - fbc | 1st-Party Cookie | _fbc |

### JavaScript Variables
These compute values dynamically.

| Variable Name | Code Logic |
|---|---|
| JS - ftc_source | Read _ftc cookie, parse JSON, return .src |
| JS - ftc_medium | Read _ftc cookie, parse JSON, return .med |
| JS - ftc_campaign | Read _ftc cookie, parse JSON, return .cmp |
| JS - page_path | return window.location.pathname |
| JS - page_title | return document.title |

### Constant Variables

| Variable Name | Value |
|---|---|
| CONST - FB Pixel ID | [user's Facebook Pixel ID] |
| CONST - TikTok Pixel ID | [user's TikTok Pixel ID] |
| CONST - GTM Container ID | [user's GTM Container ID] |

---

## Triggers — Complete Specification

### Base Triggers

**Trigger: All Pages**
- Type: Page View
- Fires on: All Pages
- Used by: Base pixels, GA4 config, First-Touch Cookie capture

**Trigger: DOM Ready — All Pages**
- Type: DOM Ready
- Fires on: All Pages
- Used by: Scripts that need DOM to be loaded

### Custom Event Triggers (Conversion)

For each conversion event, create one Custom Event trigger:

| Trigger Name | Type | Event Name (exact match) |
|---|---|---|
| CE - cro_purchase | Custom Event | cro_purchase |
| CE - cro_lead | Custom Event | cro_lead |
| CE - cro_view_content | Custom Event | cro_view_content |
| CE - cro_add_to_cart | Custom Event | cro_add_to_cart |
| CE - cro_initiate_checkout | Custom Event | cro_initiate_checkout |
| CE - cro_add_payment_info | Custom Event | cro_add_payment_info |
| CE - cro_registration | Custom Event | cro_registration |
| CE - cro_search | Custom Event | cro_search |
| CE - cro_phone_call | Custom Event | cro_phone_call |
| CE - cro_click_button | Custom Event | cro_click_button |
| CE - cro_download | Custom Event | cro_download |
| CE - cro_subscribe | Custom Event | cro_subscribe |

### Click Triggers (for Phone Call tracking)

**Trigger: Click - Phone Number**
- Type: Click — Just Links
- Fires on: Click URL — starts with — tel:
- Used by: Phone call conversion tags

---

## Tags — Complete Specification

### Tag 1: First-Touch Cookie Capture (CRITICAL — fires first)

- Name: SYSTEM - First Touch Cookie Capture
- Type: Custom HTML
- Trigger: All Pages (with firing priority 999, fires before other tags)
- Logic:
  1. Check if _ftc cookie already exists → if yes, exit (do nothing)
  2. If no cookie: read UTM params, click IDs, referrer from current URL
  3. Build _ftc JSON object with src, med, cmp, cnt, trm, fbclid, ttclid, gclid, ref, ts
  4. Write cookie: document.cookie = "_ftc=" + JSON.stringify(data) + "; max-age=7776000; path=/; SameSite=Lax"
  5. (7776000 seconds = 90 days)

This tag must fire BEFORE any conversion tags. Use Tag Sequencing in GTM if needed.

### Tags 2-3: Facebook Base Pixel

- Name: FB - Base Pixel - All Pages
- Type: Custom HTML (or Facebook official GTM template if available)
- Pixel ID: {{CONST - FB Pixel ID}}
- Standard event: PageView
- Trigger: All Pages

### Tags 4-N: Facebook Conversion Events

One tag per conversion event:

**FB - Purchase Event**
- Type: Custom HTML
- Content: fbq('track', 'Purchase', { value: {{DL - value}}, currency: {{DL - currency}}, content_ids: {{DL - content_ids}}, content_type: {{DL - content_type}}, contents: {{DL - contents}}, num_items: {{DL - num_items}} }, { eventID: {{DL - event_id}} })
- Trigger: CE - cro_purchase

**FB - Lead Event**
- fbq('track', 'Lead', { content_name: {{DL - content_name}}, value: {{DL - value}}, currency: {{DL - currency}} }, { eventID: {{DL - event_id}} })
- Trigger: CE - cro_lead

**FB - AddToCart Event**
- fbq('track', 'AddToCart', { content_ids: {{DL - content_ids}}, content_type: {{DL - content_type}}, value: {{DL - value}}, currency: {{DL - currency}}, content_name: {{DL - content_name}} }, { eventID: {{DL - event_id}} })
- Trigger: CE - cro_add_to_cart

**FB - ViewContent Event**
- fbq('track', 'ViewContent', { content_ids: {{DL - content_ids}}, content_type: {{DL - content_type}}, value: {{DL - value}}, currency: {{DL - currency}}, content_name: {{DL - content_name}} }, { eventID: {{DL - event_id}} })
- Trigger: CE - cro_view_content

**FB - InitiateCheckout Event**
- fbq('track', 'InitiateCheckout', { value: {{DL - value}}, currency: {{DL - currency}}, num_items: {{DL - num_items}} }, { eventID: {{DL - event_id}} })
- Trigger: CE - cro_initiate_checkout

### TikTok Tags

**TikTok - Base Pixel - All Pages**
- Type: Custom HTML
- Content: ttq.load('[PIXEL_ID]'); ttq.page();
- Trigger: All Pages

**TikTok - Purchase Event**
- ttq.identify({'sha256_email': {{DL - email_hashed}}, 'sha256_phone_number': {{DL - phone_hashed}}});
- ttq.track('CompletePayment', { content_ids: {{DL - content_ids}}, content_type: {{DL - content_type}}, value: {{DL - value}}, currency: {{DL - currency}}, contents: {{DL - contents}} }, { event_id: {{DL - event_id}} });
- Trigger: CE - cro_purchase

**TikTok - SubmitForm Event** (for lead gen)
- ttq.track('SubmitForm', {}, { event_id: {{DL - event_id}} });
- Trigger: CE - cro_lead

**TikTok - AddToCart Event**
- ttq.track('AddToCart', { content_id: {{DL - content_ids}}[0], content_type: {{DL - content_type}}, content_name: {{DL - content_name}}, value: {{DL - value}}, currency: {{DL - currency}} }, { event_id: {{DL - event_id}} });
- Trigger: CE - cro_add_to_cart

**TikTok - ViewContent Event**
- ttq.track('ViewContent', { content_id: {{DL - content_ids}}[0], content_type: {{DL - content_type}}, content_name: {{DL - content_name}} }, { event_id: {{DL - event_id}} });
- Trigger: CE - cro_view_content

### Google Ads Tags

**Google Ads - Purchase Conversion**
- Type: Google Ads Conversion Tracking
- Conversion ID: AW-[CONVERSION_ID]
- Conversion Label: [LABEL]
- Conversion Value: {{DL - value}}
- Order ID: {{DL - transaction_id}}
- Enable Enhanced Conversions: YES
- user_data: { email_address: [raw email from DL], phone_number: [raw phone from DL] }
- Trigger: CE - cro_purchase

**Google Ads - Lead Conversion**
- Type: Google Ads Conversion Tracking
- Conversion ID: AW-[CONVERSION_ID]
- Conversion Label: [LEAD_LABEL]
- Conversion Value: [fixed lead value]
- Enable Enhanced Conversions: YES
- Trigger: CE - cro_lead

**Google Ads - Phone Call Conversion**
- Type: Google Ads Conversion Tracking
- Conversion Label: [CALL_LABEL]
- Conversion Value: [fixed call value]
- Trigger: Click - Phone Number

### GA4 Tags

**GA4 - Configuration**
- Type: Google Tag (GA4)
- Measurement ID: G-XXXXXXXXXX
- Trigger: All Pages

**GA4 - purchase event**
- Type: Google Tag — GA4 Event
- Event Name: purchase
- Parameters: transaction_id, value, currency, items
- Trigger: CE - cro_purchase

**GA4 - generate_lead event**
- Type: GA4 Event
- Event Name: generate_lead
- Parameters: value, currency, content_name
- Trigger: CE - cro_lead

---

## Tag Firing Order (Priority Settings)

To ensure data is ready before tags fire:

| Priority | Tag | Reason |
|---|---|---|
| 999 | First-Touch Cookie Capture | Must run first to capture UTM before other tags |
| 10 | All Base Pixels | Fire early on page load |
| 5 | All Conversion Tags | Fire after dataLayer data is populated |
| 1 | GA4 Events | Can fire last |

Set tag priority in GTM tag settings > Advanced Settings > Tag firing priority.

---

## QA Testing Protocol

### GTM Preview Mode Testing Steps

1. Open GTM Preview → enter your website URL
2. Perform each conversion action (or simulate dataLayer.push in console)
3. Verify in the preview panel:
   - Correct trigger fired (left panel shows event name)
   - Correct tags fired (center panel shows tag names in green)
   - Variables populated correctly (right panel shows variable values)
4. Check no tags fired when they shouldn't (no conversion tags on non-conversion pages)

### Console Test for dataLayer.push

In browser DevTools console, test a purchase push manually:
dataLayer.push({
  event: 'cro_purchase',
  event_id: 'test-uuid-12345',
  transaction_id: 'TEST-ORDER-001',
  value: 500000,
  currency: 'VND',
  content_ids: ['PROD-123'],
  content_type: 'product',
  content_name: 'Test Product',
  contents: [{content_id: 'PROD-123', content_name: 'Test Product', content_type: 'product', quantity: 1, price: 500000}],
  num_items: 1,
  email_hashed: 'test-hash-email',
  phone_hashed: 'test-hash-phone'
});

Then verify all platform tags fired in GTM Preview.

### Platform Pixel Verification Tools
- Facebook: Facebook Pixel Helper Chrome extension → check Events tab
- TikTok: TikTok Pixel Helper Chrome extension
- Google Ads: Google Tag Assistant Chrome extension
- GA4: GA4 DebugView in Google Analytics → enable by running ?gtm_debug=x
