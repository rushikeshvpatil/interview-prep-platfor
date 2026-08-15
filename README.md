# Interview Prep Platform

A full-stack, AI-powered interview preparation platform built as a portfolio project. Practice coding problems, take AI mock interviews, prepare for behavioral questions, and track your progress — all in one place.

## Current Status

**Step 5 — Candidate Profile & Interview Preferences** ✅

- Next.js 16 with App Router and TypeScript
- Auth.js v5 with Google & GitHub OAuth providers
- Neon PostgreSQL database with 54 curated real coding problems across 5 platforms (LeetCode, CSES, Codeforces, HackerRank, AtCoder)
- Database-backed search with title, platform, and topic matching
- Combinable filters: Difficulty (Easy/Medium/Hard), Platform, dynamic Topics, Companies, and User Status (Solved/Attempted/Unsolved)
- Flexible sorting & database pagination ("Showing 1–12 of 54")
- Live bookmarking and manual progress status tracking (Solved, Attempted, Unsolved)
- Candidate Profile & Interview Preferences: Experience level, target role, target companies, primary focus, preferred difficulty, and target interview date countdown
- Preparation Summary: Real-time database counters for solved problems, attempts, and bookmarks
- Direct external links to authentic problem pages with responsive desktop table and mobile card layout
- Dark/light theme support with zero flash

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Auth | Auth.js v5 (NextAuth) |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon) |
| AI | Google Gemini API (planned for Step 6) |
| Deployment | Vercel (planned) |

## Roadmap

- [x] Project setup & design system
- [x] Authentication (GitHub & Google OAuth)
- [x] Database schema & curated seed data (54 real problems)
- [x] Coding problems catalog, search & filters
- [x] Candidate profile & interview preferences
- [ ] AI mock interviewer with scorecards
- [ ] Behavioral interview preparation
- [ ] Dashboard & progress tracking
- [ ] Bookmarks, notes & spaced repetition
- [ ] UI polish & animations
- [ ] Production deployment

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/rushikeshvpatil/interview-prep-platfor.git
cd interview-prep-platfor

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your environment variables in .env (Database URL, Auth secret, OAuth credentials)

# Generate Prisma Client & apply migrations
npx prisma generate
npx prisma migrate deploy

# Seed curated problem catalog
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Environment Variables

See `.env.example` for all required environment variables. Never commit real credentials to the repository.

## License

MIT
