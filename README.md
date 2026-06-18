# ping-pong: Uptime Monitoring SaaS

A web-based SaaS platform built with **Next.js**, **React**, and **Tailwind CSS** that allows users to monitor the uptime of their web services. Features Flux-based authentication, automated cron-based pinging, and a gamified credit system.

## Project Structure

```
ping-pong/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API Routes (to be implemented)
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Main dashboard with mocked data
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing page
│   ├── components/                 # Reusable React components
│   │   ├── Navbar.tsx              # Navigation header
│   │   ├── Footer.tsx              # Footer
│   │   ├── MonitorList.tsx         # Display monitors
│   │   ├── PingerForm.tsx          # Add new monitor form
│   │   └── CreditDisplay.tsx       # Credit balance widget
│   ├── styles/
│   │   └── globals.css             # Tailwind CSS entry point
│   └── lib/                        # Utility functions (to be implemented)
├── prisma/
│   └── schema.prisma               # Database schema
├── public/                         # Static assets
├── .env.example                    # Environment variables template
├── .env.local                      # Local development environment
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── next.config.js                  # Next.js configuration
├── postcss.config.js               # PostCSS configuration
└── README.md                       # This file
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Flux (external service)
- **Component UI**: shadcn/ui (Radix UI + Tailwind)
- **Form Handling**: React Hook Form + Zod
- **Session Management**: HTTP-only cookies (to be implemented)
- **Cron Jobs**: Vercel Cron

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database instance

### 1. Install Dependencies

```bash
npm install
```

### 2. configure the environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database URL and other configuration values.

### 3. Initialize the Database

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database schema (Users, Monitors, PingLogs tables)
- Generate Prisma Client

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Features Overview

### Current State (Mocked)
- Landing page with feature overview
- Dashboard UI showing:
  - Credit balance with visual indicator
  - Monitor statistics (active monitors, average uptime)
  - List of monitors with status, uptime %, ping interval
  - Form to add new monitors with validation
  - Pause/Resume and delete actions

### To Be Implemented
- **Authentication**: Flux integration for sign-up/login
- **Session Management**: Secure HTTP-only cookie sessions
- **Database Integration**: Connect mocked data to real Prisma queries
- **API Routes**: Implement CRUD endpoints for monitors
- **Cron Pinging Engine**: `/api/cron/ping` endpoint with external trigger
- **Daily Credits**: Daily check-in page and credit system
- **Uptime History**: Charts and detailed uptime trends

## Database Schema

### User
- `id`: Unique identifier
- `fluxUserId`: Foreign key to Flux system
- `creditBalance`: Current credits
- `createdAt`, `updatedAt`: Timestamps

### Monitor
- `id`: Unique identifier
- `userId`: Foreign key to User
- `serviceName`: Name of the monitored service
- `targetUrl`: URL to ping
- `pingIntervalSecs`: Frequency of pings (30-3600 seconds)
- `timeoutMs`: Timeout for each ping request
- `isActive`: Whether monitor is enabled
- `lastPingedAt`: Timestamp of last ping
- `createdAt`, `updatedAt`: Timestamps

### PingLog
- `id`: Unique identifier
- `monitorId`: Foreign key to Monitor
- `userId`: Foreign key to User
- `status`: "success", "failure", or "timeout"
- `responseTimeMs`: Response time in milliseconds
- `statusCode`: HTTP status code
- `errorMessage`: Error details if failed
- `checkedAt`: When the ping was performed

### DailyCreditClaim
- `id`: Unique identifier
- `userId`: Foreign key to User
- `claimedAt`: Date of claim
- Unique constraint: One claim per user per day

## Development Workflow

1. **Implement API Routes**: Start with auth endpoints
2. **Connect to Flux**: Implement Flux integration in `src/lib/flux.ts`
3. **Implement Session Management**: Create session utilities in `src/lib/session.ts`
4. **Replace Mocked Data**: Connect dashboard to real database queries
5. **Build Cron Endpoint**: Implement ping logic in `/api/cron/ping`
6. **Add Daily Credits**: Implement credit claiming system

## Environment Variables

See `.env.example` for all available environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `FLUX_API_URL`: Flux API endpoint
- `FLUX_API_KEY`: Flux API authentication key
- `SESSION_SECRET`: Secret for signing session tokens
- `CRON_SECRET`: Secret for protecting cron endpoint
- Credit and ping configuration values

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run prisma:migrate  # Run database migrations
npm run prisma:generate # Generate Prisma Client
```

## Contributing

This is the initial scaffolding phase. Features will be implemented according to the PRD.

## License

MIT
