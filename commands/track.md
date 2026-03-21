---
description: Setup conversion tracking — Facebook/Meta Pixel, TikTok Events API, Google Ads, GTM
argument-hint: "<website URL or tracking IDs>"
---

# /track — Ad Tracking Setup

Complete tracking setup: Facebook/Meta Pixel + CAPI, TikTok Pixel + Events API, Google Ads Enhanced Conversions, GTM container.

## Invocation

```
/track Setup tracking for my e-commerce site
/track Add Facebook Pixel ID: 123456789
```

## Workflow

### Step 1: Detect

Apply **cm-ads-tracker** skill:
- Auto-detect industry
- Map correct standard events per platform specs
- Identify required tracking IDs

### Step 2: Generate

Create complete tracking implementation:
- GTM tags, triggers, variables
- dataLayer schema
- UTM conventions
- CAPI/Events API server-side specs
- First-touch/last-touch attribution
- Cross-channel deduplication

### Step 3: Implement

- Install tracking code
- Configure events
- Test with platform debug tools

### Step 4: Verify

- Verify events fire correctly
- Check for data integrity
- Test attribution flows
