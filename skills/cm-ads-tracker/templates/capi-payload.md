# Facebook/Meta CAPI Server-Side Template

## Required Payload Fields

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1700000000,
    "event_id": "uuid-same-as-pixel-event-id",
    "action_source": "website",
    "event_source_url": "https://example.com/thank-you",
    "user_data": {
      "em": ["sha256_hashed_email"],
      "ph": ["sha256_hashed_phone_digits_only"],
      "client_ip_address": "1.2.3.4",
      "client_user_agent": "Mozilla/5.0...",
      "fbp": "_fbp cookie value",
      "fbc": "fb.1.timestamp.fbclid_value"
    },
    "custom_data": {
      "value": 299000,
      "currency": "VND",
      "order_id": "ORD-12345",
      "content_ids": ["prod_001", "prod_002"],
      "content_type": "product",
      "num_items": 2
    }
  }]
}
```

## API Endpoint

```
POST https://graph.facebook.com/v21.0/{PIXEL_ID}/events?access_token={CAPI_ACCESS_TOKEN}
```

## Deduplication

Both browser Pixel and CAPI send the SAME `event_id`. Meta matches within 48h and counts once.

## Enhanced Matching Priority (hash with SHA256)

1. `em` — email (lowercase, trim whitespace)
2. `ph` — phone (digits only, include country code)
3. `fn` — first name (lowercase)
4. `ln` — last name (lowercase)
5. `fbp` — Facebook browser cookie
6. `fbc` — Facebook click ID cookie

## TikTok Events API Equivalent

```
POST https://business-api.tiktok.com/open_api/v1.3/event/track/
Headers: Access-Token: {TIKTOK_ACCESS_TOKEN}
```

```json
{
  "pixel_code": "TIKTOK_PIXEL_ID",
  "event": "CompletePayment",
  "event_id": "same-uuid-as-pixel",
  "timestamp": "2025-01-15T10:30:00+07:00",
  "context": {
    "user_agent": "Mozilla/5.0...",
    "ip": "1.2.3.4"
  },
  "properties": {
    "value": 299000,
    "currency": "VND",
    "content_id": "prod_001",
    "content_type": "product",
    "contents": [
      {"content_id": "prod_001", "content_name": "Product A", "quantity": 1, "price": 299000}
    ]
  }
}
```
