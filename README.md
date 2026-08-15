# Interview Prep Platform

A full-stack, AI-powered interview preparation platform built as a portfolio project. Practice coding problems, take AI mock interviews, prepare for behavioral questions, and track your progress — all in one place.

## Current Status

**Step 1 — Project Setup & Design System** ✅

- Next.js 16 with App Router and TypeScript
- Tailwind CSS v4 design system with CSS custom properties
- Dark/light theme with persistence
- Responsive layout with sidebar navigation
- Landing page with hero, features, how-it-works, and footer
- Placeholder pages for all planned routes
- Prisma ORM configured for PostgreSQL

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Auth | Auth.js (planned) |
| Code Editor | Monaco Editor (planned) |
| Code Execution | Judge0 API (planned) |
| AI | Google Gemini API (planned) |
| Deployment | Vercel (planned) |

## Roadmap

- [x] Project setup & design system
- [ ] Authentication (GitHub & Google OAuth)
- [ ] Database schema & seed data
- [ ] Coding problems list & filters
- [ ] Problem detail page with Monaco code editor
- [ ] Judge0 code execution integration
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
# Fill in your environment variables in .env
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

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── behavioral/         # Behavioral prep (planned)
│   ├── bookmarks/          # Bookmarks (planned)
│   ├── dashboard/          # Dashboard (planned)
│   ├── mock-interview/     # AI mock interviews (planned)
│   ├── problems/           # Coding problems (planned)
│   ├── progress/           # Progress tracking (planned)
│   ├── globals.css         # Design system & theme tokens
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── layout/             # AppShell, Sidebar, Header
│   ├── ui/                 # Button, Card, Badge, FeatureCard
│   ├── ThemeProvider.tsx    # Dark/light theme context
│   └── ThemeToggle.tsx      # Theme toggle button
prisma/
└── schema.prisma           # Database schema (placeholder)
```

## License

MIT
