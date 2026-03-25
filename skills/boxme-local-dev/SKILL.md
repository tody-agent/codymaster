---
description: Start all Boxme Scoring System local development modules (PRMS, Seller SOS, Docs Site)
---

# Boxme Local Dev — Start All Modules

Use this skill when the user says any of: "start local", "run local", "dev local", "start dev", or asks to run the Boxme project locally.

## Project Root

```
/Users/todyle/Library/Mobile Documents/com~apple~CloudDocs/Code/Boxme_Projects/boxme_levelling-main
```

## Modules

| Module | Directory | Command | URL |
|--------|-----------|---------|-----|
| **PRMS** (Performance Review) | project root | `npm run dev` | http://localhost:5173 |
| **Seller SOS** | `seller-sos/` | `npm run dev` | http://localhost:5174 |
| **Docs Site** (Docusaurus) | `docs-site/` | `npm start` | http://localhost:3000 |

## Instructions

### Step 1 – Start PRMS

Open terminal and run:

```bash
cd "/Users/todyle/Library/Mobile Documents/com~apple~CloudDocs/Code/Boxme_Projects/boxme_levelling-main"
npm run dev
```

### Step 2 – Start Seller SOS

Open a **new terminal** and run:

```bash
cd "/Users/todyle/Library/Mobile Documents/com~apple~CloudDocs/Code/Boxme_Projects/boxme_levelling-main/seller-sos"
npm run dev
```

### Step 3 – Start Docs Site

Open another **new terminal** and run:

```bash
cd "/Users/todyle/Library/Mobile Documents/com~apple~CloudDocs/Code/Boxme_Projects/boxme_levelling-main/docs-site"
npm start
```

## Notes

- PRMS uses **Vite + Hono** (Cloudflare Workers backend), served via `@hono/vite-dev-server`
- Seller SOS also uses **Vite + Hono**, port 5174
- Docs Site is **Docusaurus 3.x**, starts on port 3000
- All modules use their own `node_modules` — run `npm install` in each directory if fresh clone
- If a port is busy, kill it: `lsof -ti:5173 | xargs kill -9`

## Ports Quick Reference

```
http://localhost:5173  → PRMS
http://localhost:5174  → Seller SOS  
http://localhost:3000  → Docs Site
```
