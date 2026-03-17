---
name: nextjs-mastery
description: 'Master Next.js App Router, server components, and data patterns. Use when the user mentions "Next.js", "App Router", "Server Components", "RSC", "Server Actions", "SSR", "ISR", or "next/image". Covers routing, rendering strategies, data fetching, caching, and deployment. For React fundamentals, see react-mastery. For styling, see tailwind-mastery.'
license: MIT
metadata:
  author: todyle
  version: "1.0.0"
---

# Next.js Mastery Framework

A comprehensive guide to building production Next.js applications with the App Router, React Server Components, and modern data patterns. Apply these principles when building new Next.js apps, migrating from Pages Router, optimizing performance, or designing API architectures.

## Core Principle

**Server by default, client when necessary.** The App Router's mental model is the inverse of traditional React SPA: components are Server Components unless you explicitly opt into the client with `'use client'`. This means less JavaScript shipped to browsers, direct database access in components, and a fundamentally different approach to data fetching. The single biggest mistake is adding `'use client'` unnecessarily.

**The foundation:** Next.js 14+ is a full-stack React framework where the server is a first-class rendering environment. Understanding the boundary between Server and Client Components — what can cross it, what can't, and where to draw it — is the defining skill of a Next.js developer.

## Scoring

**Goal: 10/10.** When reviewing Next.js code, rate 0-10:

- **9-10:** Server Components by default, strategic client boundaries, proper caching, Server Actions for mutations, streaming with Suspense
- **7-8:** Good App Router usage with minor issues (unnecessary 'use client', no streaming, manual refetch)
- **5-6:** Working app but using client patterns everywhere, API routes for all mutations, no image optimization
- **3-4:** Pages Router patterns in App Router, useEffect for data fetching, no loading/error files
- **1-2:** SPA patterns entirely, no SSR benefit, missing metadata, security gaps

## The Next.js Mastery Framework

Six disciplines for building production Next.js applications:

### 1. App Router & Routing

**Core concept:** Routes are defined by the file system — `app/dashboard/page.tsx` creates `/dashboard`. Special files (`layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) handle common UI patterns declaratively. Route groups `(marketing)` organize without affecting URLs. Parallel routes `@modal` enable simultaneous rendering.

**Why it works:** File-based routing eliminates route configuration boilerplate. Special files ensure every route automatically handles loading, error, and not-found states without developer effort. Layouts persist across navigation, preserving state and avoiding redundant re-renders.

**Key insights:**
- `page.tsx` defines a route, `layout.tsx` wraps child routes, `template.tsx` re-mounts on navigation
- `loading.tsx` provides instant loading UI via React Suspense underneath
- `error.tsx` catches errors at route level with a reset function
- Route groups `(auth)/login` organize code without URL segments
- Colocate components — `app/dashboard/_components/Chart.tsx`
- Parallel routes `@modal` for modal patterns without losing the background route
- Dynamic routes `[slug]` with `generateStaticParams` for static generation

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Route page** | page.tsx | `app/blog/[slug]/page.tsx` |
| **Shared layout** | layout.tsx | `app/dashboard/layout.tsx` with sidebar |
| **Loading state** | loading.tsx | `app/dashboard/loading.tsx` with skeleton |
| **Error handling** | error.tsx | `'use client'; export default function Error({ reset })` |
| **Route organization** | Route groups | `(marketing)/about/page.tsx` |
| **Static pages** | generateStaticParams | `export async function generateStaticParams()` |

### 2. Server vs Client Components

**Core concept:** Every component in the App Router is a Server Component by default. Add `'use client'` ONLY when a component needs interactivity (hooks, event handlers, browser APIs). The goal is to push Client Components as far down the tree as possible — keep them as leaf nodes.

**Why it works:** Server Components send zero JavaScript to the client, directly access databases, and stream HTML progressively. Client Components add to the JS bundle and require hydration. By keeping client boundaries small, you ship less code and render faster. A page can be 90% Server Component with tiny `<InteractiveButton />` client islands.

**Key insights:**
- Default is Server Component — no directive needed
- `'use client'` marks a boundary — everything it imports becomes client too
- Push client components to leaves — `<LikeButton />` not `'use client'` on the entire page
- Server Components can render Client Components as children
- Client Components cannot import Server Components (but can accept them as `children`)
- Use `Suspense` to stream slow Server Components progressively
- Server Components can `async/await` directly in the component body

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Data display** | Server Component (default) | `async function UserProfile() { const user = await db.get(...) }` |
| **Interactive** | Client Component | `'use client'; function LikeButton() { const [liked, setLiked] = useState() }` |
| **Mixed page** | Server page + client islands | `<ServerPage><ClientButton/></ServerPage>` |
| **Streaming** | Suspense boundary | `<Suspense fallback={<Skeleton/>}><SlowData/></Suspense>` |
| **Rendering choice** | Static vs dynamic | `export const revalidate = 3600` for ISR |

### 3. Data Fetching & Caching

**Core concept:** Fetch data directly in Server Components using `async/await` — no useEffect, no client-side data fetching libraries. Use Server Actions for mutations (form submissions, data writes). In Next.js 15+, fetch is uncached by default — explicitly control caching.

**Why it works:** Server-side fetching eliminates loading spinners, prevents data waterfalls, and keeps secrets on the server. Server Actions are type-safe functions that run on the server but are callable from Client Components — they replace API routes for most mutations.

**Key insights:**
- Fetch in Server Components: `const data = await fetch(url)` directly in component
- Next.js 15 changed defaults: `fetch` is **uncached** — explicitly set `cache: 'force-cache'` for static data
- Server Actions for mutations — `'use server'` functions in `action={serverAction}`
- `revalidatePath('/posts')` and `revalidateTag('posts')` after mutations
- React and Next.js auto-deduplicate identical fetch calls across components
- Use Suspense for streaming slow data — `<Suspense fallback={<Loading/>}>`
- `unstable_cache` for caching non-fetch data (database queries)

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Read data** | Server Component fetch | `const posts = await fetch(url, { cache: 'force-cache' })` |
| **Form mutation** | Server Action | `<form action={createPost}>` |
| **After mutation** | Revalidate | `revalidatePath('/posts')` |
| **ISR** | Time-based revalidation | `export const revalidate = 3600` |
| **Stream** | Suspense | `<Suspense fallback={<Skeleton/>}><Posts/></Suspense>` |
| **On-demand** | revalidateTag | `fetch(url, { next: { tags: ['posts'] } })` |

### 4. Images, Fonts & Metadata

**Core concept:** Use `next/image` for all images (automatic optimization, lazy loading, layout shift prevention), `next/font` for fonts (self-hosted, zero layout shift), and the Metadata API for SEO (static `metadata` object or dynamic `generateMetadata`).

**Why it works:** Images are typically the largest assets on a page — `next/image` automatically serves WebP/AVIF, lazy loads, and reserves space to prevent CLS. `next/font` self-hosts fonts and applies `size-adjust` to eliminate font swap layout shifts. The Metadata API ensures every page has proper SEO without manual `<head>` management.

**Key insights:**
- `<Image>` requires `width` + `height` or `fill` — always provide dimensions
- `priority` prop on hero/LCP images — load immediately, not lazy
- `next/font/google` for Google Fonts with zero layout shift
- `export const metadata = {}` for static page metadata
- `export async function generateMetadata({ params })` for dynamic metadata
- `opengraph-image.tsx` generates OG images at build time
- Configure `remotePatterns` for external image domains

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Hero image** | Priority Image | `<Image src={hero} priority width={1200} height={630}/>` |
| **Responsive image** | Fill mode | `<Image fill className="object-cover" alt="..."/>` |
| **Font** | next/font | `import { Inter } from 'next/font/google'` |
| **Static SEO** | metadata export | `export const metadata = { title: 'Dashboard' }` |
| **Dynamic SEO** | generateMetadata | `export async function generateMetadata({ params })` |

### 5. API Routes & Middleware

**Core concept:** Use Route Handlers (`app/api/*/route.ts`) for REST APIs, export named functions for HTTP methods (`GET`, `POST`, `PUT`, `DELETE`). Use middleware (`middleware.ts`) for auth, redirects, and request rewriting. Prefer Server Actions over API routes for form mutations.

**Why it works:** Named exports make intent clear and prevent method-confusion bugs. Middleware runs on the Edge runtime before any route handler, making it ideal for auth checks and redirects. Server Actions eliminate the need for API routes in most mutation scenarios.

**Key insights:**
- Export `GET`, `POST`, `PUT`, `DELETE` functions (not a single handler)
- Return `NextResponse.json()` for JSON responses
- Validate all request bodies with Zod or similar before processing
- Server Actions (`'use server'`) replace API routes for form submissions
- Middleware runs on Edge — no Node.js APIs (fs, path, etc.)
- `config.matcher` to scope middleware to specific paths
- Validate and authorize inside Server Actions — they're public endpoints

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **REST endpoint** | Route Handler | `export async function GET(request: Request)` |
| **Input validation** | Zod in handler | `const body = schema.parse(await req.json())` |
| **Auth guard** | Middleware | `middleware.ts` with `config.matcher: ['/dashboard/:path*']` |
| **Form submit** | Server Action | `async function createPost(formData: FormData)` |
| **Response** | NextResponse | `return NextResponse.json({ data }, { status: 201 })` |

### 6. Security & Configuration

**Core concept:** Never expose server secrets to the client, always validate Server Action inputs (they're public endpoints), add CSP headers, and configure environment variables correctly. Security is not optional — a single exposed API key or unvalidated input can compromise an entire application.

**Why it works:** The Server/Client boundary in Next.js is also a security boundary. Server-only code stays in Server Components and Route Handlers. Client code gets everything prefixed with `NEXT_PUBLIC_`. Server Actions are callable by anyone — they need auth checks and input validation just like API routes.

**Key insights:**
- `NEXT_PUBLIC_` prefix for client-accessible env vars — everything else stays server-only
- Validate env vars on startup — fail fast if DATABASE_URL is missing
- `.env.local` for secrets (gitignored), `.env` for non-secret defaults
- CSP headers in `next.config.js` or middleware
- Server Actions are public endpoints — validate AND authorize
- `dangerouslySetInnerHTML` requires DOMPurify sanitization
- `output: 'standalone'` for Docker deployments

**Code applications:**

| Context | Pattern | Example |
|---------|---------|---------|
| **Client env** | NEXT_PUBLIC prefix | `NEXT_PUBLIC_API_URL` (safe to expose) |
| **Env validation** | Startup check | `if (!process.env.DATABASE_URL) throw new Error(...)` |
| **Server Action** | Auth + validate | `const user = await auth(); const data = schema.parse(input)` |
| **CSP** | Security headers | `headers() { return [{ key: 'Content-Security-Policy', ... }] }` |
| **Deploy** | Standalone output | `output: 'standalone'` in `next.config.js` |

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| **'use client' on page.tsx** | Entire page becomes client, loses SSR | Push 'use client' to leaf interactive components |
| **useEffect for data fetching** | Loading spinners, waterfalls, no SSR | Fetch directly in Server Component |
| **Assuming fetch is cached (v15)** | Data stale or always fresh unexpectedly | Explicitly set `cache: 'force-cache'` or `revalidate` |
| **API route for form submit** | Extra endpoint, no progressive enhancement | Use Server Action with `action={fn}` |
| **`<img>` instead of `<Image>`** | No optimization, layout shift, no lazy load | Always use `next/image` |
| **Missing loading.tsx** | White screen during navigation | Add `loading.tsx` with skeleton UI |
| **Server secrets in NEXT_PUBLIC** | Exposed to all users | Only prefix client-needed vars |
| **No Server Action validation** | SQL injection, invalid data | Zod parse + auth check in every action |
| **Font link tags** | Layout shift, extra network request | Use `next/font/google` |
| **No error.tsx** | Entire app crashes on route error | Add `error.tsx` with reset button |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Are most components Server Components? | Too much client JS | Remove unnecessary 'use client' directives |
| Is data fetched in Server Components? | Client-side waterfalls | Move fetch to server, remove useEffect |
| Is caching explicitly configured? | Unpredictable data freshness | Set `cache` or `revalidate` on all fetches |
| Are mutations using Server Actions? | Unnecessary API routes | Convert to `'use server'` functions |
| Does every route have loading.tsx? | White screen during nav | Add skeleton/spinner loading states |
| Is next/image used for all images? | Performance and CLS issues | Replace `<img>` with `<Image>` |
| Are env vars properly prefixed? | Security risk or runtime errors | Audit NEXT_PUBLIC_ usage |
| Are Server Actions validated? | Security vulnerability | Add Zod validation + auth check |
| Is middleware protecting routes? | Unauthenticated access possible | Add middleware.ts with auth check |
| Are fonts self-hosted with next/font? | Layout shift, slow load | Switch to next/font/google |

## Further Reading

- [Next.js Documentation](https://nextjs.org/docs) — Official docs (App Router)
- [Next.js Learn](https://nextjs.org/learn) — Interactive tutorial covering the full stack
- [Vercel Blog](https://vercel.com/blog) — Latest patterns and features
- [Server Components RFC](https://github.com/reactjs/rfcs/pull/188) — Deep understanding of RSC model
- [Lee Robinson's YouTube](https://www.youtube.com/@leerob) — Practical Next.js patterns from Vercel VP of DX

## About

This skill synthesizes patterns from the Next.js core team, Vercel's production patterns, and community best practices for App Router applications. For React fundamentals, see react-mastery. For styling patterns, see tailwind-mastery. For system architecture, see system-design.
