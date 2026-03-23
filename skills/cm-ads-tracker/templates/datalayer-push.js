// DataLayer Push Templates — CM Ads Tracker v2
// Copy and customize these for your project.
// Developer writes ONE push per event. GTM does the rest.

// ═══════════════════════════════════════════
// PURCHASE (E-commerce, Courses, SaaS)
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_purchase',
  event_id: '[UUID generated server-side — same value sent to CAPI]',
  transaction_id: '[order_id]',
  value: 0, // numeric order total — NOT string
  currency: 'VND', // ISO 4217 code
  content_type: 'product',
  content_ids: ['product_id_1', 'product_id_2'],
  contents: [
    { content_id: 'id', content_name: 'name', content_type: 'product', quantity: 1, price: 0 }
  ],
  num_items: 1,
  email_hashed: '[SHA256(lowercase(email))]',
  phone_hashed: '[SHA256(digits-only phone)]'
});

// ═══════════════════════════════════════════
// LEAD / FORM SUBMIT  (Lead Gen, B2B, Education)
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_lead',
  event_id: '[UUID]',
  lead_id: '[unique lead identifier]',
  content_name: '[form_name or page_name]',
  value: 0, // lead_value_if_known — optional
  currency: 'VND',
  email_hashed: '[SHA256(lowercase(email))]',
  phone_hashed: '[SHA256(digits-only phone)]'
});

// ═══════════════════════════════════════════
// VIEW CONTENT (Product/Service page)
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_view_content',
  event_id: '[UUID]',
  content_ids: ['product_id'],
  content_type: 'product',
  content_name: '[Product Name]',
  value: 0,
  currency: 'VND'
});

// ═══════════════════════════════════════════
// ADD TO CART
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_add_to_cart',
  event_id: '[UUID]',
  content_ids: ['product_id'],
  content_type: 'product',
  content_name: '[Product Name]',
  value: 0,
  currency: 'VND',
  quantity: 1
});

// ═══════════════════════════════════════════
// INITIATE CHECKOUT
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_initiate_checkout',
  event_id: '[UUID]',
  value: 0,
  currency: 'VND',
  num_items: 1,
  content_ids: ['product_id_1']
});

// ═══════════════════════════════════════════
// REGISTRATION / SIGNUP
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_registration',
  event_id: '[UUID]',
  status: 'complete',
  email_hashed: '[SHA256]',
  phone_hashed: '[SHA256]'
});

// ═══════════════════════════════════════════
// PHONE CALL CLICK
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_phone_call',
  event_id: '[UUID]',
  phone_number: '[phone number clicked]'
});

// ═══════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════
dataLayer.push({
  event: 'cro_search',
  event_id: '[UUID]',
  search_string: '[user search query]'
});
