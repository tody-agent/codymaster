# Industry Event Taxonomy — Complete Reference

This file maps every major industry to the correct standard events across Meta, TikTok, and Google Ads, with exact parameter requirements and priority ranking.

## How to Use This Reference

1. Identify the user's industry (or the closest match)
2. Use the Priority Events to configure the algorithm-training conversion actions
3. Use the Supporting Events for audience building and funnel visibility
4. Map each event to the DataLayer Event Name and Platform Event Names

---

## Event Priority Scoring

- P1 (Must Have): Trains ad algorithm directly, highest ROI impact
- P2 (Should Have): Audience building, middle-funnel, retargeting signal
- P3 (Nice to Have): Funnel visibility, micro-conversion data

---

## 1. E-COMMERCE — Fashion / Apparel

### Industry Signals
- High purchase frequency, low AOV
- Strong visual creative performance (video > image)
- Key platform: TikTok Shop integration, Facebook Catalog Ads

### Event Stack

| Priority | Action | DL Event | Meta Event | TikTok Event | GA4 Event |
|---|---|---|---|---|---|
| P1 | Purchase | cro_purchase | Purchase | CompletePayment | purchase |
| P1 | Add to Cart | cro_add_to_cart | AddToCart | AddToCart | add_to_cart |
| P2 | Initiate Checkout | cro_initiate_checkout | InitiateCheckout | InitiateCheckout | begin_checkout |
| P2 | View Product | cro_view_content | ViewContent | ViewContent | view_item |
| P3 | Search | cro_search | Search | Search | search |
| P3 | Add to Wishlist | cro_add_to_wishlist | AddToWishlist | AddToWishlist | add_to_wishlist |
| P3 | Add Payment Info | cro_add_payment_info | AddPaymentInfo | AddPaymentInfo | add_payment_info |

### Required Parameters for Each Event

**cro_purchase (P1)**
- value: numeric (order total)
- currency: VND or USD
- content_ids: array of product IDs
- content_type: "product"
- contents: [{content_id, content_name, quantity, price}]
- num_items: total quantity
- transaction_id / order_id: unique order ID
- event_id: UUID (for CAPI dedup)
- email_hashed, phone_hashed

**cro_add_to_cart (P1)**
- value: item price
- currency: VND
- content_ids: [product_id]
- content_type: "product"
- content_name: product name
- quantity: 1 or selected quantity

**cro_view_content (P2)**
- content_ids: [product_id]
- content_type: "product"
- content_name: product name
- value: product price
- currency: VND

### Algorithm Optimization Note
For Purchase campaign optimization: Meta needs 50+ Purchase events/week to exit learning phase. If traffic is low, start with AddToCart as the optimization event, then switch to Purchase after volume builds.

---

## 2. E-COMMERCE — Electronics / High-AOV

### Industry Signals
- Low purchase frequency, high AOV (3-50M VND)
- Long consideration phase (7-30 days)
- Key platform: Google Shopping + Search (intent-based), Facebook Retargeting

### Event Stack

Same as fashion e-commerce, but additional:
- ViewContent is critical (longer consideration = more product page views)
- AddToWishlist is more meaningful (save-for-later behavior)
- InitiateCheckout is a strong intent signal

### Attribution Window Adjustment
Extend Facebook window to 7-day click + 1-day view.
Google window 30-day for search.
Customer typically researches 3-7 days before buying.

---

## 3. LEAD GENERATION — Real Estate

### Industry Signals
- Very high lead value (qualified leads = 500K-5M VND)
- Long sales cycle (weeks to months)
- Multiple touchpoints before conversion
- Key conversions: phone call, appointment booking, contact form

### Event Stack

| Priority | Action | DL Event | Meta Event | TikTok Event | GA4 Event |
|---|---|---|---|---|---|
| P1 | Form Submit (contact) | cro_lead | Lead | SubmitForm | generate_lead |
| P1 | Phone Call Click | cro_phone_call | Contact | Contact | phone_call_click |
| P1 | Schedule Appointment | cro_schedule | Lead | SubmitForm | generate_lead |
| P2 | View Project Page | cro_view_content | ViewContent | ViewContent | view_item |
| P2 | Download Brochure | cro_download | Lead | Download | file_download |
| P3 | Floor Plan View | cro_view_content | ViewContent | ViewContent | view_item |
| P3 | 360 Tour Start | cro_click_button | — | ClickButton | — |

### Required Parameters

**cro_lead (P1)**
- event_id: UUID (for CAPI dedup)
- lead_id: unique generated lead identifier
- content_name: form type ("contact-form" or "appointment-booking" or "download-brochure")
- value: estimated lead value (e.g., 500000 for 500K VND per qualified lead)
- currency: VND
- email_hashed, phone_hashed (critical for CAPI match rate)

**cro_phone_call (P1)**
- event_id: UUID
- content_name: "phone-call"
- phone_number: which number was clicked (for tracking by listing/project)

### Lead Gen Attribution Note
Use SHORTER attribution windows: 1-day click for Facebook (real estate buyers search Google, then see Facebook retargeting, then call — so the Facebook touch is typically last-same-day).
For Google Search: 30-day window (search intent is direct).

---

## 4. LEAD GENERATION — Finance / Insurance / B2B

### Industry Signals
- High lead quality requirement (only qualified forms matter)
- Strict data privacy (hash ALL personal data)
- Multiple form steps (use step-specific events)

### Event Stack

| Priority | Action | DL Event | Meta Event | TikTok Event | GA4 Event |
|---|---|---|---|---|---|
| P1 | Final Form Submit | cro_lead | Lead | SubmitForm | generate_lead |
| P2 | Form Step 1 Started | cro_form_start | — | ClickButton | form_start |
| P2 | Download Report/Guide | cro_download | Lead | Download | file_download |
| P2 | View Pricing/Plans | cro_view_content | ViewContent | ViewContent | view_item |
| P3 | Request Demo | cro_lead | Lead | SubmitForm | generate_lead |
| P3 | Calculator Used | cro_click_button | — | ClickButton | — |

### Multi-Step Form Tracking
For forms with 3+ steps, fire a unique event at each step:
- cro_form_step_1: basic info submitted (email, phone)
- cro_form_step_2: financial/qualification info
- cro_lead: final form completed

This gives visibility into where leads drop off in the funnel.

---

## 5. EDUCATION — Online Courses / Edtech

### Industry Signals
- Two-stage funnel: Free signup → Paid enrollment
- Content marketing heavy (free resources as lead magnets)
- Key conversions: trial signup, webinar registration, course purchase

### Event Stack

| Priority | Action | DL Event | Meta Event | TikTok Event | GA4 Event |
|---|---|---|---|---|---|
| P1 | Course Purchase | cro_purchase | Purchase | CompletePayment | purchase |
| P1 | Trial / Free Signup | cro_registration | CompleteRegistration | CompleteRegistration | sign_up |
| P2 | Initiate Checkout | cro_initiate_checkout | InitiateCheckout | InitiateCheckout | begin_checkout |
| P2 | Webinar Registration | cro_lead | Lead | SubmitForm | generate_lead |
| P2 | View Course Page | cro_view_content | ViewContent | ViewContent | view_item |
| P3 | Download Syllabus | cro_download | Lead | Download | file_download |
| P3 | Newsletter Subscribe | cro_subscribe | — | Subscribe | — |

### Required Parameters

**cro_registration (Trial/Signup) — P1**
- event_id: UUID
- content_name: "trial-signup" or "free-account"
- value: 0 (free signup) or lead value estimate
- currency: VND
- email_hashed, phone_hashed

**cro_purchase (Enrollment) — P1**
- All standard purchase parameters
- content_name: course name
- content_ids: [course_id]
- value: course price

---

## 6. SaaS / SOFTWARE

### Industry Signals
- Freemium to paid conversion is the key event
- Trial quality matters more than trial volume
- Key metric: free-to-paid conversion rate

### Event Stack

| Priority | Action | DL Event | Meta Event | TikTok Event | GA4 Event |
|---|---|---|---|---|---|
| P1 | Free Trial Signup | cro_registration | CompleteRegistration | CompleteRegistration | sign_up |
| P1 | Paid Plan Purchase | cro_purchase | Purchase | CompletePayment | purchase |
| P2 | View Pricing Page | cro_view_content | ViewContent | ViewContent | view_item |
| P2 | Demo Request | cro_lead | Lead | SubmitForm | generate_lead |
| P3 | Feature Used (key) | cro_click_button | — | ClickButton | select_content |
| P3 | Newsletter Subscribe | cro_subscribe | — | Subscribe | — |

---

## 7. F&B — RESTAURANT / FOOD DELIVERY

### Industry Signals
- High frequency, low AOV
- Local targeting critical
- Phone calls and online orders are primary conversions

### Event Stack

| Priority | Action | DL Event | Meta Event | TikTok Event | GA4 Event |
|---|---|---|---|---|---|
| P1 | Online Order | cro_purchase | Purchase | CompletePayment | purchase |
| P1 | Phone Call | cro_phone_call | Contact | Contact | phone_call |
| P1 | Table Reservation Form | cro_lead | Lead | SubmitForm | generate_lead |
| P2 | View Menu Page | cro_view_content | ViewContent | ViewContent | view_item |
| P2 | View Location Page | cro_view_content | ViewContent | ViewContent | view_item |
| P3 | Loyalty Signup | cro_registration | CompleteRegistration | CompleteRegistration | sign_up |

---

## 8. TRAVEL / HOTEL / TOURISM

### Industry Signals
- High AOV, long consideration phase
- Search-based intent (dates, destination)
- Booking funnel has multiple steps

### Event Stack

| Priority | Action | DL Event | Meta Event | TikTok Event | GA4 Event |
|---|---|---|---|---|---|
| P1 | Booking Complete | cro_purchase | Purchase | CompletePayment | purchase |
| P1 | Search (date+dest) | cro_search | Search | Search | search |
| P2 | Initiate Booking | cro_initiate_checkout | InitiateCheckout | InitiateCheckout | begin_checkout |
| P2 | View Property/Tour | cro_view_content | ViewContent | ViewContent | view_item |
| P3 | Save to Wishlist | cro_add_to_wishlist | AddToWishlist | AddToWishlist | add_to_wishlist |
| P3 | Inquiry / Contact | cro_lead | Lead | Contact | generate_lead |

### Travel-Specific Parameters for ViewContent
Add destination, check_in_date, check_out_date, num_adults to contents object.

---

## Universal Event Parameters Reference

### Meta / Facebook
All events support these shared parameters:
- value (float): monetary value
- currency (string): ISO 4217 e.g. "VND", "USD"
- content_name (string): human-readable description
- content_ids (array): product/content IDs
- content_type (string): "product" or "product_group"
- contents (array): [{id, quantity, item_price}]

### TikTok
All 14 standard events support:
- value (float): total monetary value
- currency (string): e.g. "VND" — supported by TikTok
- content_id (string): single product ID
- content_ids (array): multiple product IDs
- content_type (string): "product" or "product_group"
- content_name (string): name of product/content
- quantity (int): number of items
- price (float): per-item price
- description (string): optional description
- search_string (string): for Search events only
- status (string): for CompleteRegistration — "registered"

### Google Ads Enhanced Conversions
Pass user_data with:
- email_address: raw email (Google hashes it)
- phone_number: raw phone with country code
- address.first_name, address.last_name, address.country, address.postal_code

Note: Google hashes this data server-side with SHA256. Do NOT pre-hash for Enhanced Conversions (unlike Meta where you pre-hash).
