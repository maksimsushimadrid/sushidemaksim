# 🍣 Sushi de Maksim — Authentic Japanese Cuisine in Madrid

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![CI](https://github.com/maksimsushimadrid/sushidemaksim/actions/workflows/ci.yml/badge.svg)](https://github.com/maksimsushimadrid/sushidemaksim/actions)

A premium gastronomy e-commerce platform offering real-time delivery and pick-up ordering, an interactive guest menu, an automated customer loyalty program, and a real-time analytics-driven administration panel.

[**🌐 Visit Website**](https://www.sushidemaksim.com) ·
[**📱 Menu**](https://www.sushidemaksim.com/menu) · [**📝 Blog**](https://www.sushidemaksim.com/blog)

---

## ✨ Features

### 🍱 E-Commerce & Customer Client
- **Interactive Menu** — Over 58 gourmet dishes grouped by categories (Rolls, Nigiri, Sets, Starters, Soups, Desserts, Drinks) featuring sticky sub-navigation and instant search.
- **Dynamic Pricing & Delivery Calculations** — Transparent delivery fee auto-calculations (with default free checkout state until delivery zone is selected) and unit price transparency (`€/ud`) for multi-item rows.
- **Real-Time Shopping Cart** — Fully interactive cart with dynamic addition of extras (chopsticks, wasabi, ginger), customizable options, and validation with Zod.
- **Guest-Count Customization** — Tailored guest count selection (minimum 1 guest) mapped to automated email notifications and order tracking notes.
- **Optional Payment Methods** — Streamlined checkout flow where choosing a payment method is optional for user flexibility.
- **Favorites System** — Save preferred dishes for instantaneous ordering on subsequent visits.
- **Order Tracking** — Live order status dashboard with transitions and immediate email updates.
- **Delivery Zone Map** — Leaflet-powered interactive maps validating address coordinates and calculating delivery feasibility.
- **Security-focused Auth** — Secure native user accounts integrated with **Google OAuth (Sign In with Google)**.

### 🎁 Automated Loyalty Program
- **Fifth-Order Discount** — Automated 5% discount code generated and sent via email for every 5th completed order.
- **Tenth-Order Gift** — Sweet Roll gift promo code sent automatically to loyal customers.
- **Birthday Bonuses** — Configurable discount codes triggered on birthdays.
- **Welcome & Subscription Coupons** — Registration and newsletter signup discounts managed dynamically.

### 🛡️ Real-Time Admin Panel
- **Analytical Dashboard** — Business intelligence visualizations showing sales, daily order trends, average ticket size, device splits, and menu popularity using Recharts.
- **Menu CRUD Management** — Admin control to create, update, and delete menu items with automatic WebP compression (via Sharp) and promotional tags (Hot, Veggie, Chef, New).
- **Order Management** — Real-time orders board with instant state controls, automatic customer notes parsing, and lightweight audio notifications.
- **Promotions Manager** — Dynamic home promotion banner editor supporting drag & drop reordering.
- **Loyalty Settings & User Roles** — Control program coupon rules and configure user roles (Admin, Waiter, User) dynamically.

### 👨‍🍳 Waiter Dashboard
- **Speed Comandas** — Mobile-first UI tailored for in-room waiters to place orders quickly.
- **Drinks & Dishes Separation** — Dedicated workspace tabs separating drinks and kitchen orders to speed up service.
- **Instant Kitchen Registry** — Automatic kitchen notification mapping orders directly to the serving waiter.

---

## ⚡ Performance & Mobile Optimization

- **Core Web Vitals** — Optimized for speed (LCP < 2.5s, CLS < 0.1, INP < 200ms) with clean code and React lazy-loaded pages with Suspense skeletons.
- **Lightweight Audio Assets** — Replaced heavy audio alert tracks (5.1MB) with a clean 25KB system fanfare sound file, reducing PWA cache size by over 5MB and conserving user mobile data.
- **Race-Condition PWA Updates** — Automatic service worker updates via `navigator.serviceWorker.getRegistration()` checks, resolving update loops and preventing cached page lockouts.
- **Anti-HTML-Caching Headers** — Dedicated anti-caching meta headers in `index.html` ensuring mobile browsers do not cache the main entry page outside the PWA.
- **Mobile Viewport Fix** — Tailored height calculations correcting bottom spacing whitespace bugs on Chrome Mobile.
- **Cloudflare Zaraz Integration** — Consolidated marketing and analytical scripts (including Google Ads / Conversions) under Cloudflare Zaraz for improved script performance.

---

## 🏗️ Architecture

```
sushidemaksim/
├── src/                          # Frontend (React + TypeScript)
│   ├── pages/                    # 16 lazy-loaded route pages
│   ├── components/               # Reusable UI components
│   │   ├── admin/                #   Admin panel modules
│   │   ├── cart/                 #   Cart, forms & checkout
│   │   ├── menu/                 #   Product grids & search
│   │   ├── profile/              #   User account settings tabs
│   │   ├── skeletons/            #   CLS-prevention loaders
│   │   ├── common/               #   Global UI wrappers
│   │   └── ui/                   #   Base styling elements
│   ├── hooks/                    # Custom React Query & state hooks
│   ├── context/                  # Auth, Toast, Cart providers
│   ├── schemas/                  # Zod validation schemas
│   ├── constants/                # Menu configs, routing URLs
│   ├── analytics/                # Event tracking & Zaraz wrappers
│   ├── types/                    # DB models & typings
│   └── utils/                    # Supabase client, helpers
├── server/                       # Backend (Node.js + Express)
│   └── src/
│       ├── routes/               # API endpoints (admin, user, orders)
│       ├── middleware/           # Auth validation, rate-limiter
│       └── utils/                # Email HTML templates, Sharp compressor
├── api/                          # Vercel Serverless Entry Point
│   └── [...path].ts              # Serverless Catch-All Router → Express app
├── tests/                        # Playwright E2E test suites
├── src/test/                     # Vitest unit test suites
└── vercel.json                   # Route mappings, cron jobs, cache headers
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript 5, Vite 4 |
| **Styles** | Tailwind CSS 3 (mobile-first, customized sushi theme pattern) |
| **Animations** | Framer Motion 12 |
| **State** | React Context + TanStack Query 5 |
| **Validation** | Zod schemas |
| **Routing** | React Router 6 |
| **Maps** | Leaflet maps (dynamic dynamic import) |
| **Backend** | Node.js, Express 4 |
| **Database** | PostgreSQL (Supabase) |
| **Storage** | Supabase Storage (automatic WebP processing) |
| **Authentication** | JWT, bcrypt, Google OAuth |
| **Email Service** | Nodemailer |
| **Image Engine** | Sharp (resizing + WebP conversion) |
| **Security** | Helmet, CORS, reCAPTCHA v3, Supabase RLS |
| **Deployment** | Vercel Serverless |
| **CI/CD** | GitHub Actions (Auto Lint, Typecheck, Test, Build) |
| **Testing** | Vitest (unit/integration) + Playwright (E2E) |
| **PWA Engine** | `vite-plugin-pwa` + custom Workbox Service Worker |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A active [Supabase](https://supabase.com) project (for DB, Storage, Auth)

### Setup Installation
```bash
# Clone the repository
git clone https://github.com/maksimsushimadrid/sushidemaksim.git
cd sushidemaksim

# Install frontend and backend dependencies
npm install
cd server && npm install && cd ..

# Setup local environment files
cp .env.example .env
```

### Environment Variables
Configure the `.env` file in the root directory:
```env
# Supabase Public Keys
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key

# Express Server Private Keys (set in Vercel or local environment)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
JWT_SECRET=your_jwt_signing_secret
EMAIL_USER=your_smtp_email@gmail.com
EMAIL_PASS=your_app_password
RECAPTCHA_SECRET_KEY=your_recaptcha_key
FRONTEND_URL=http://localhost:5173
```

### Development Commands
```bash
npm run dev            # Start client and server concurrently
npm run build          # Perform production builds (tsc + sitemap + vite build)
npm run lint           # Run ESLint validation checks
npm run format         # Auto-format codebase using Prettier
npm run test:unit      # Execute unit tests with Vitest
npm run test:e2e       # Run end-to-end integration tests using Playwright
npm run test           # Run all Vitest and Playwright tests sequentially
npm run preview        # Preview production build locally
```

---

## 🧪 Testing Ecosystem

| Test Type | Library / Tool | Location | Run Command |
| :--- | :--- | :--- | :--- |
| **Unit / Integration** | Vitest | `src/test/` | `npm run test:unit` |
| **End-to-End (E2E)** | Playwright | `tests/` | `npm run test:e2e` |
| **Code Linter** | ESLint | — | `npm run lint` |
| **Code Formatter** | Prettier | — | `npm run format:check` |

A full integration pipeline runs on **GitHub Actions** checking types, lint issues, formatting, and running tests on every push.

---

## 📦 Deployment and DNS Configuration

- **Hosting Platform**: Vercel (serverless routing mapped automatically on pushes to `main`).
- **CDN and Routing**: Static chunks are served via Vercel Edge Network, and backend is routed dynamically to Vercel Serverless Functions.
- **Domain & DNS**: DNS is managed on **Cloudflare** using **DNS Only** (grey cloud) configuration pointing directly to Vercel to optimize security signals (WAF, Bot Fight Mode) and prevent PWA lifecycle update conflicts.

---

## 🤝 Contributors & Authors

Developed and maintained with ❤️ by [**SelenIT**](https://github.com/alekseevpo) & **Pavel Alekseev**.

© 2025–2026 Sushi de Maksim. All rights reserved.
