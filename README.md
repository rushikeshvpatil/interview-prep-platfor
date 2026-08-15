# Interview Prep Platform

A full-stack, AI-powered interview preparation platform built as a portfolio project. Practice coding problems, take AI mock interviews, prepare for behavioral questions, and track your progress — all in one place.

## Current Status

**Step 2 — Authentication (Google & GitHub OAuth)** ✅

- Next.js 16 with App Router and TypeScript
- Auth.js v5 with Google & GitHub OAuth providers
- Prisma ORM with PostgreSQL Auth models (`User`, `Account`, `Session`, `VerificationToken`)
- Protected route middleware for dashboard, practice modules, and profile
- Custom sign-in page with loading/error handling
- Profile page with active session details and sign-out
- Responsive layout with auth-aware header and sidebar navigation
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
| Code Editor | Monaco Editor (planned) |
| Code Execution | Judge0 API (planned) |
| AI | Google Gemini API (planned) |
| Deployment | Vercel (planned) |

## Roadmap

- [x] Project setup & design system
- [x] Authentication (GitHub & Google OAuth)
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
# Fill in your environment variables in .env (Database URL, Auth secret, OAuth credentials)

# Generate Prisma Client
npx prisma generate
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
