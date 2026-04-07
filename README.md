# 🛡️ GigShield — Parametric Insurance Platform for Gig Workers

**GigShield** is a full-stack parametric insurance web platform designed specifically for **gig economy delivery riders** (Zomato, Swiggy, Zepto, etc.) in India. It provides **automated, weather-triggered micro-insurance** — riders pay a small weekly premium (₹49–₹149), and when real-world disruptions like heavy rain, heatwaves, or air quality spikes occur in their delivery zone, payouts are triggered **automatically** without paperwork.

> **Parametric insurance** = payouts are triggered by measurable events (rainfall > 10mm, AQI > 300, temp > 42°C), not by damage assessment. This eliminates claim disputes and enables instant payouts.

---

## 🎯 Problem Statement

Gig delivery riders face **daily income loss** due to:
- 🌧️ Heavy rainfall making roads unsafe
- 🌡️ Extreme heatwaves (40°C+) reducing delivery capacity
- 🌫️ Hazardous air quality (AQI 300+) in Delhi NCR
- 📱 Platform outages cutting off order flow

Traditional insurance doesn't cover these micro-disruptions. GigShield fills this gap with **affordable, instant, AI-verified coverage**.

---

## ✨ Key Features

### 🏍️ Rider Portal
| Feature | Description |
|---------|-------------|
| **Sign Up & Login** | Email/password authentication with Supabase backend |
| **5-Step Onboarding** | Phone OTP → KYC (Aadhaar) → GPS Zone Detection → Plan Selection → UPI AutoPay |
| **Dashboard** | View active plan, coverage details, max payout, and events covered per week |
| **File Claims** | One-click claim submission for covered events (Rain, Heat, AQI) |
| **My Claims** | Track all submitted claims with real-time status updates |
| **Payments** | View payment history and upcoming AutoPay deductions |
| **Plan Upgrade** | Switch between Basic/Standard/Pro plans anytime |

### 🔐 Admin Portal
| Feature | Description |
|---------|-------------|
| **Secure Login** | Hardcoded admin credentials (demo: `admin@gigshield.in` / `admin123`) |
| **Overview Dashboard** | Live stats — active riders, weekly premiums, payouts, fraud blocked + plan distribution chart |
| **Rider Management** | Searchable/filterable table of all riders with status, plan, zone, and contact info |
| **Live Disruption Map** | Real-time 64-zone grid synchronized with live weather APIs (Open-Meteo + AQI) |
| **Fraud Detection Engine** | 5-step AI analysis: GPS verification, weather cross-reference, behavioral patterns, zone correlation, timing analysis |
| **Claims & Payouts** | Approve/reject claims, view payout history with Chart.js bar graphs, subscription status |
| **Admin Panel** | Risk pool balance tracking, zone management (freeze/unfreeze), and system health monitoring |

### 🌐 Platform-Wide
| Feature | Description |
|---------|-------------|
| **Real-Time Sync** | Supabase Realtime channels keep all admin tabs synchronized instantly |
| **Live Location** | Browser Geolocation API → OpenStreetMap reverse geocoding → IP fallback |
| **Live Weather** | Open-Meteo API for temperature, rainfall, wind speed + AQI monitoring |
| **Cross-Tab Sync** | `storage` event listeners ensure data consistency across multiple browser tabs |
| **Notification System** | Dynamic notification bell with pending claim count and quick approve/reject actions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                     │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ index    │  │ Admin Portal │  │   Rider Portal    │  │
│  │ (Select) │──│ 6 pages      │  │   5 pages         │  │
│  └──────────┘  └──────┬───────┘  └────────┬──────────┘  │
│                       │                    │             │
│              ┌────────┴────────────────────┘             │
│              ▼                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              store.js (State Manager)             │   │
│  │  Session Auth · CRUD · Realtime · Cross-tab Sync  │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │               env.js (Config)                     │   │
│  │         SUPABASE_URL · SUPABASE_ANON_KEY          │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE (Backend)                     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │   riders   │  │   claims   │  │      payouts       │ │
│  │   table    │  │   table    │  │      table         │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
│                                                          │
│  Realtime WebSockets · Row Level Security · REST API     │
└─────────────────────────────────────────────────────────┘

External APIs:
  • Open-Meteo       → Temperature, Rainfall, Wind Speed
  • Open-Meteo AQI   → Air Quality Index (US AQI)
  • OpenStreetMap    → Reverse Geocoding (Nominatim)
  • ipapi.co         → IP-based Location Fallback
```

---

## 💰 Insurance Plans

| Plan | Weekly Premium | Events/Week | Max Payout | Coverage |
|------|---------------|-------------|------------|----------|
| **Basic** | ₹49 | 1 | ₹600 | Rain only |
| **Standard** | ₹99 | 3 | ₹1,200 | Rain + AQI + Heat |
| **Pro** | ₹149 | 5 | ₹2,000 | All coverage types |

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

### `riders` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated unique identifier |
| `email` | VARCHAR(255) | Unique rider email |
| `password` | VARCHAR(255) | Rider password |
| `name` | VARCHAR(255) | Full name (as per KYC) |
| `phone` | VARCHAR(20) | Mobile number |
| `plan` | VARCHAR(50) | Basic / Standard / Pro |
| `zone` | VARCHAR(100) | Delivery zone (e.g., "Sector 18, Noida") |
| `upi_id` | VARCHAR(100) | UPI AutoPay ID |
| `onboarded` | BOOLEAN | Whether 5-step setup is complete |
| `created_at` | TIMESTAMPTZ | Registration timestamp |

### `claims` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `rider_email` | VARCHAR(255) | FK → riders.email |
| `event_type` | VARCHAR(100) | Heavy Rain / Heatwave / AQI Spike / etc. |
| `amount` | VARCHAR(50) | Claim amount (e.g., "₹250") |
| `status` | VARCHAR(50) | In Review / Paid / Auto-Approved / Rejected |
| `zone` | VARCHAR(100) | Zone where event occurred |
| `created_at` | TIMESTAMPTZ | Claim submission time |

### `payouts` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `rider_email` | VARCHAR(255) | FK → riders.email |
| `amount` | VARCHAR(50) | Payout amount |
| `zone` | VARCHAR(100) | Zone |
| `event_type` | VARCHAR(100) | Triggering event |
| `upi_ref` | VARCHAR(100) | UPI transaction reference |
| `created_at` | TIMESTAMPTZ | Payout timestamp |

> Realtime is enabled on `claims` and `payouts` tables via `ALTER PUBLICATION supabase_realtime`.

---

## 📁 Project Structure

```
gigshield/
├── index.html                  # Portal selector (Admin vs Rider)
│
├── admin_login.html            # Admin credential entry
├── admin_dashboard.html        # Overview stats + plan distribution chart
├── admin_panel.html            # Risk pool · Zone management · System health
├── rider_management.html       # Searchable rider table
├── live_map.html               # 64-zone disruption grid + live weather
├── fraud_detection.html        # AI fraud check engine with score ring
├── claims_payouts.html         # Claims CRUD + payout history + bar chart
│
├── rider_auth.html             # Rider login / sign-up
├── rider_onboarding.html       # 5-step setup wizard
├── rider_dashboard.html        # Coverage details + plan upgrade
├── my_claims.html              # Rider's claim history
├── rider_payments.html         # Payment history + AutoPay info
│
├── css/
│   ├── global.css              # Inter font, body background, scrollbar
│   ├── index.css               # Portal card hover effects
│   ├── admin_login.css         # Login card + error banner styles
│   ├── admin_dashboard.css     # Dashboard cards + dropdown animations
│   ├── admin_panel.css         # Tabs, zone table, system health cards
│   ├── rider_auth.css          # Auth card + input fields
│   ├── rider_onboarding.css    # Stepper, OTP boxes, plan cards, map grid
│   ├── rider_dashboard.css     # Coverage cards, stat boxes
│   ├── rider_management.css    # Data table, filter buttons
│   ├── rider_payments.css      # Payment table, status badges
│   ├── live_map.css            # Zone grid pills, toast animations
│   ├── fraud_detection.css     # Score ring, scan animation, intel table
│   ├── claims_payouts.css      # Status pills, claim table
│   └── my_claims.css           # Claims table, stat cards
│
├── js/
│   ├── env.js                  # Supabase URL + Anon Key config
│   ├── store.js                # Supabase client, CRUD, auth, realtime
│   ├── index.js                # Auto-redirect if already logged in
│   ├── admin_login.js          # Login form handler
│   ├── admin_dashboard.js      # Dashboard stats + notifications + chart
│   ├── admin_panel.js          # Zone table + risk pool + system health
│   ├── rider_auth.js           # Login/signup form logic
│   ├── rider_onboarding.js     # 5-step wizard logic (OTP, KYC, zone, plan, UPI)
│   ├── rider_dashboard.js      # Coverage display + plan upgrade modal
│   ├── rider_management.js     # Rider table rendering + search + filters
│   ├── rider_payments.js       # Payment history rendering
│   ├── live_map.js             # Weather API + zone grid + simulation engine
│   ├── fraud_detection.js      # Sequential fraud check animation
│   ├── claims_payouts.js       # Claims CRUD + payout chart + subscription cards
│   └── my_claims.js            # Rider claims view
│
├── schema.sql                  # Database DDL (riders, claims, payouts)
├── vercel.json                 # Vercel deployment config + weather cron
├── package.json                # Dependencies (Playwright for testing)
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites
- A **Supabase** project ([supabase.com](https://supabase.com))
- A modern browser (Chrome, Edge, Firefox)
- (Optional) Node.js for local dev server

### 1. Set Up the Database

Run the SQL from `schema.sql` in your Supabase SQL Editor:

```sql
-- Creates: riders, claims, payouts tables
-- Enables: Realtime on claims and payouts
```

### 2. Configure Environment

Edit `js/env.js` with your Supabase project credentials:

```javascript
window.env = {
    SUPABASE_URL: "https://your-project.supabase.co",
    SUPABASE_ANON_KEY: "your-anon-key-here"
};
```

### 3. Run Locally

You can open `index.html` directly in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using VS Code
# Install "Live Server" extension → Right-click index.html → Open with Live Server
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

The `vercel.json` is pre-configured for static hosting with clean URLs.

---

## 🔄 User Flows

### Rider Journey
```
index.html → rider_auth.html (Sign Up)
         → rider_onboarding.html (5-step setup)
            Step 1: Phone OTP verification (simulated)
            Step 2: KYC / Aadhaar verification (simulated)
            Step 3: GPS zone detection (mock map grid)
            Step 4: Plan selection (Basic/Standard/Pro)
            Step 5: UPI AutoPay linking
         → rider_dashboard.html (Coverage overview)
         → my_claims.html (View & track claims)
         → rider_payments.html (Payment history)
```

### Admin Journey
```
index.html → admin_login.html (admin@gigshield.in / admin123)
         → admin_dashboard.html (Overview stats + plan chart)
         → rider_management.html (Search, filter, view all riders)
         → live_map.html (Real-time weather + zone disruptions)
         → fraud_detection.html (AI fraud check on claims)
         → claims_payouts.html (Approve/reject + payout history)
         → admin_panel.html (Risk pool + zones + system health)
```

---

## 🔌 External APIs Used

| API | Purpose | Endpoint |
|-----|---------|----------|
| **Supabase** | Database, Auth, Realtime | `*.supabase.co` |
| **Open-Meteo Weather** | Temperature, Rain, Wind | `api.open-meteo.com/v1/forecast` |
| **Open-Meteo AQI** | Air Quality Index | `air-quality-api.open-meteo.com/v1/air-quality` |
| **OpenStreetMap Nominatim** | Reverse Geocoding | `nominatim.openstreetmap.org/reverse` |
| **ipapi.co** | IP-based Location | `ipapi.co/json/` |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Markup** | HTML5 (semantic) |
| **Styling** | TailwindCSS (CDN) + Vanilla CSS modules |
| **Icons** | Lucide Icons (unpkg CDN) |
| **Charts** | Chart.js (doughnut + bar + line) |
| **Typography** | Inter (Google Fonts) |
| **Backend** | Supabase (PostgreSQL + Realtime + REST) |
| **Hosting** | Vercel (static) |
| **Testing** | Playwright |

---

## 🏙️ Covered Cities & Zones

GigShield covers **192 delivery zones** across 3 major Indian cities:

- **Delhi NCR** — 64 zones (Connaught Place, Hauz Khas, Dwarka, Noida, Gurgaon, etc.)
- **Mumbai** — 64 zones (Colaba, Bandra, Andheri, Powai, Navi Mumbai, Thane, etc.)
- **Bangalore** — 64 zones (Koramangala, Indiranagar, Whitefield, Electronic City, etc.)

---

## 📊 Risk Pool Model

The platform operates a **community risk pool**:

- **Inflow**: Weekly premiums from all active riders
- **Outflow**: Approved claim payouts
- **Base Pool**: ₹1,00,000 initial capitalization
- **Reinsurance**: GIC Re coverage for catastrophic events exceeding ₹10,00,000
- **Viability Threshold**: Minimum 2,000 riders for actuarial sustainability

---

## 📄 License

This project is built for demonstration and educational purposes.

---

<p align="center">
  <strong>Built with ❤️ for India's 8 million+ gig delivery riders</strong>
</p>
