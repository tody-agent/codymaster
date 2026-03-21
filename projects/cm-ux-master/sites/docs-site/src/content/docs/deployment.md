---
title: "Deployment"
description: "Hướng dẫn deploy Content Factory documentation site — Astro Starlight setup, build, và deploy."
keywords: ["deployment", "content factory", "astro starlight"]
sidebar:
  order: 4
---

# Deployment Guide

> **Quick Reference**
> - **Build**: `npm run build` → `dist/`
> - **Deploy**: Cloudflare Pages / Vercel / GitHub Pages
> - **Preview**: `npm run preview -- --port 4321`

## Quick Deploy

```bash
# Build
cd astro-site
npm run build

# Preview local
npm run preview -- --port 4321

# Deploy to Cloudflare Pages
# Build command: npm run build
# Build output: dist
```

## Deploy Options

| Platform | Build Command | Output |
|----------|--------------|--------|
| Cloudflare Pages | `npm run build` | `dist` |
| Vercel | `npm run build` | `dist` |
| GitHub Pages | `npm run build` | `dist` |
| Netlify | `npm run build` | `dist` |
