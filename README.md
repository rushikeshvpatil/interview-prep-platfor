# Interview Prep Platform

A full-stack, AI-powered interview preparation platform built as a portfolio project. Practice coding problems, schedule AI & Peer mock interviews, prepare for behavioral questions, and track your progress — all in one place.

## Current Status

**Phase 8 — Peer Interview Mode & Collaborative Review** ✅

- Next.js 16 with App Router, TypeScript, and Tailwind CSS v4
- Auth.js v5 with Google & GitHub OAuth providers
- Neon PostgreSQL database with 54 curated real coding problems across 5 platforms (LeetCode, CSES, Codeforces, HackerRank, AtCoder)
- Combinable filters: Difficulty, Platform, dynamic Topics, Companies, and User Status (Solved/Attempted/Unsolved)
- Candidate Profile & Preferences: Experience level, target role, target companies, primary focus, and interview countdown
- **Scheduled Interview Sessions (`/interview/schedule`)**: AI and Peer interview rooms with custom durations (30m, 45m, 60m)
- **Gated Monaco Editor (`/interview/[sessionId]`)**: In-browser code editor with Judge0 execution engine and server-authoritative timer
- **AI Mock Interviewer Hub (`/mock-interview`)**: Conversational technical interview dialogues powered by Google Gemini (approach analysis, Big-O complexity questions, progressive hints, and automated scorecards)
- **Peer Mock Interviews (`/interview/join/[token]`)**: Secure invitation flow allowing human interviewers to observe candidate coding in real time with a dedicated read-only viewer
- **Live Collaboration & Judge0 Stream**: Real-time code broadcasting and test case executions observed live by the interviewer
- **Manual Peer Evaluation Scorecards**: 6-dimension rubric evaluation (Problem Solving, Correctness, Complexity, Code Quality, Communication, Overall /10), private notes scratchpad, and hiring recommendations (Strong Hire, Hire, Borderline, No Hire)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 + Monaco Editor |
| Styling | Tailwind CSS v4 |
| Auth | Auth.js v5 (NextAuth) |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon) |
| Code Execution | Self-Hosted Judge0 CE (AWS EC2 / VPS Docker Stack) |
| AI | Google Gemini API (1.5 Flash) |
| Realtime | WebSocket / Fast State Sync |
| Deployment | Vercel (App) + Cloud VM (Judge0) |

## Roadmap

- [x] Phase 1: Project setup & design system
- [x] Phase 2: Authentication (GitHub & Google OAuth)
- [x] Phase 3: Database schema & curated seed data (54 real problems)
- [x] Phase 4: Coding problems catalog, search & filters
- [x] Phase 5: Candidate profile & interview preferences
- [x] Phase 6: Scheduled interview sessions & gated Monaco / Judge0 engine
- [x] Phase 7: AI mock interviewer engine (Google Gemini)
- [x] Phase 8: Peer interview mode & collaborative review
- [ ] Phase 9: Behavioral interview preparation (STAR method)
- [ ] Phase 10: Dashboard, progress analytics & spaced revision hub
- [ ] Phase 11: UI polish, SEO & production deployment

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Docker & Docker Compose (for local Judge0 testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/rushikeshvpatil/interview-prep-platfor.git
cd interview-prep-platfor

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your environment variables in .env (Database URL, Auth secret, OAuth credentials, Gemini API key)

# Generate Prisma Client & apply migrations
npx prisma generate
npx prisma migrate deploy

# Seed curated problem catalog
npm run db:seed
```

### Starting Self-Hosted Judge0 (Optional / Local Dev)

```bash
cd judge0
docker-compose up -d
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Lint

```bash
npm run lint
npm run build
```

## License

MIT
