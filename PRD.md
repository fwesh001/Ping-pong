 Product Requirement Document (PRD).

---

# Product Requirement Document (PRD): ping-pong (Next.js & Flux)

## 1. Project Overview

### Name : ping-pong

A web-based SaaS platform built with **Next.js** and **Tailwind CSS** that allows users to monitor the uptime of their web services ("pinging"). The platform features an external authentication system handled by **Flux**, custom session management, an automated serverless cron-based execution engine, and a gamified credit system.

---

## 2. System Architecture & User Flow

### A. Authentication & Session Management (via Flux)

* **Registration/Sign-up:** Users can register via a custom sign-up form or a Google OAuth option. Next.js passes credentials to the Flux API. Flux queries its database for duplicate emails/usernames before creating the record.
* **Authentication/Login:** Users authenticate directly through Flux.
* **Session Management:** Upon successful validation from Flux, our Next.js backend generates and manages user sessions manually (via secure HTTP-only cookies or JWT tokens).
* **Local User Sync:** Upon first-time registration success from Flux, a corresponding user profile is instantiated in our local database with an initial credit balance, tied together by the unique `flux_user_id`.

### B. Core Features

* **Landing Page:** * Top section: Site logo, clear application description, and a "Get Started" call-to-action (CTA) button.
* Body section: Visual cards containing step-by-step instructions describing the system's operational flow.
* Footer: Links for Help/Contact, User Feedback, and Developer Details.


* **Dashboard & Service Manager:** * View current credit balance.
* Add new monitoring targets by configuring:
* **Service Name**
* **Target Website Link (URL)**
* **Ping Frequency & Duration Constraints**




* **Credit Engine & Daily Checker:**
* A dedicated page/section for a "Daily Check-in" where users click a button to claim free daily credits.
* Automated consumption model where every individual background ping deducts a set amount of credits from the user's local database balance.



---

## 3. Technical Infrastructure

### A. The Pinging Engine (Cron Job Approach)

Instead of persistent background processes running indefinitely on serverless hosting, the architecture leverages an external Cron service.

* **`/api/cron/ping` Endpoint:** A highly secure, protected Next.js API route.
* **External Cron Trigger:** A service (e.g., Vercel Cron, Upstash) hits this endpoint at regular intervals (e.g., every minute).
* **Execution Logic:** When triggered, the API endpoint:
1. Queries the local database for all active service monitors due for a ping.
2. Filters out services belonging to users with a `0` or negative credit balance.
3. Fires asynchronous network requests (pings) to the target URLs.
4. Logs the uptime/downtime status.
5. Deducts the appropriate credit fee from the respective user accounts.



### B. Database Schema Requirements (Local)

Our local database needs to keep track of two primary relations:

* **Users Table:** Stores `flux_user_id` (foreign key identifier mapping back to Flux) and `credit_balance`.
* **Monitors Table:** Stores `monitor_id`, `flux_user_id`, `service_name`, `target_url`, `ping_interval` (frequency), `last_pinged_at`, and `is_active`.

---



Here is the recommended **Next.js (App Router)** directory structure tailored for our Flux authentication, local database setup, and cron job engine.

### Directory Structure Overview

```text
my-pinger-app/
├── src/
│   ├── app/                        # Next.js App Router (Pages & API Routes)
│   │   ├── api/                    # Backend API Endpoints
│   │   │   ├── auth/
│   │   │   │   ├── login/route.js  # Handles login payloads sent to Flux
│   │   │   │   ├── logout/route.js # Clears session cookies
│   │   │   │   └── signup/route.js # Handles signup payloads & unique check via Flux
│   │   │   ├── cron/
│   │   │   │   └── ping/route.js   # Secured endpoint triggered by external cron service
│   │   │   └── monitors/route.js   # CRUD endpoint for adding/removing website links
│   │   ├── (auth)/                 # Route group for authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.js         # Custom Login UI (with Flux integration)
│   │   │   └── signup/
│   │   │       └── page.js         # Custom Signup UI (Form + Google OAuth link)
│   │   ├── dashboard/              # Protected Dashboard Route group
│   │   │   ├── page.js             # Core Service Manager Dashboard
│   │   │   └── credits/
│   │   │       └── page.js         # Dedicated Daily Check-in & Credit page
│   │   ├── layout.js               # Root layout (Global providers, HTML wrapper)
│   │   └── page.js                 # Public Landing Page (Logo, description, steps, footer)
│   ├── components/                 # Reusable UI Components
│   │   ├── ui/                     # Base elements (Buttons, Inputs, Cards)
│   │   ├── Footer.js               # Help, Contact, Feedback, Dev details
│   │   ├── Navbar.js               # Dynamic header showing auth status / credits
│   │   └── PingerForm.js           # Form to input Service Name, URL, and frequency
│   ├── lib/                        # Shared internal utilities
│   │   ├── db.js                   # Database client instance (e.g., Prisma/Mongoose)
│   │   ├── flux.js                 # API abstraction wrapper for communication with Flux
│   │   └── session.js              # Custom JWT/Cookie verification helpers
│   └── styles/
│       └── globals.css             # Tailwind CSS entry point
├── public/                         # Static assets
│   └── logo.png                    # Site Logo image
├── .env.local                      # Environment variables (Flux API keys, DB string, Cron secret)
├── tailwind.config.js              # Tailwind configuration
└── package.json                    # Project dependencies

```

---

### Architectural Design Logic

* **`src/app/api/cron/ping/route.js`**: Separating this into its own routing bucket makes it exceptionally easy to protect using an environment variable secret (e.g., verifying an `Authorization: Bearer <SECRET>` header) so malicious users cannot manually trigger credit consumption.
* **`src/lib/flux.js`**: Keeping your Flux communication isolated within a dedicated utility file ensures that if Flux changes their API specs down the road, you only have to fix your code in one file rather than updating every individual page.
* **`(auth)` and `dashboard` folder groupings**: Next.js route groups (indicated by parenthesis like `(auth)`) allow us to organize layouts cleanly without altering the visible URL structure.

Does this directory structure look clear and align with how you want to build the project? Let me know, and we can move forward with planning our database models!