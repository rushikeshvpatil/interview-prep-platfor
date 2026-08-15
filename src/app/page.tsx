import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { LandingThemeToggle } from "@/components/LandingThemeToggle";

/* ───── Icon Components ───── */

function CodeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

/* ───── Features Data ───── */

const features = [
  {
    icon: <CodeIcon />,
    title: "Coding Practice",
    description: "Sharpen your problem-solving skills with curated interview-style coding problems.",
    items: [
      "Practice problems by topic and difficulty",
      "In-browser code editor with multi-language support",
      "Track submissions and performance over time",
    ],
  },
  {
    icon: <ChatIcon />,
    title: "AI Mock Interviews",
    description: "Experience realistic technical interviews powered by AI that adapts to your level.",
    items: [
      "Real-time follow-up questions based on your approach",
      "Configurable difficulty and topic selection",
      "Detailed scorecard with actionable feedback",
    ],
  },
  {
    icon: <UsersIcon />,
    title: "Behavioral Preparation",
    description: "Build compelling stories for behavioral questions using a structured approach.",
    items: [
      "Guided STAR method answer builder",
      "Common questions organized by category",
      "AI-powered feedback on structure and clarity",
    ],
  },
  {
    icon: <ChartIcon />,
    title: "Progress Tracking",
    description: "Understand your strengths, identify weak areas, and build consistency.",
    items: [
      "Activity heatmap and streak tracking",
      "Topic and difficulty breakdowns",
      "Spaced repetition for long-term retention",
    ],
  },
];

/* ───── How It Works Data ───── */

const steps = [
  {
    number: "01",
    title: "Practice",
    description: "Solve coding problems across data structures, algorithms, and system design. Build confidence through repetition.",
  },
  {
    number: "02",
    title: "Interview",
    description: "Take AI-powered mock interviews that simulate real technical rounds. Get follow-up questions and hints as needed.",
  },
  {
    number: "03",
    title: "Improve",
    description: "Review detailed feedback, identify patterns in your weak areas, and focus your preparation where it matters most.",
  },
];

/* ───── Page Component ───── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ───── Navbar ───── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight">InterviewPrep</span>
          </Link>
          <div className="flex items-center gap-3">
            <LandingThemeToggle />
            <Link
              href="/signin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="flex h-2 w-2 rounded-full bg-success" />
            Open source &middot; Built for developers
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Prepare Smarter.{" "}
            <span className="text-primary">Interview Better.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform that combines coding practice, AI mock interviews,
            behavioral preparation, and personalized progress tracking to help you land
            your dream role.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="min-w-[180px]">
                Start Practicing
                <ArrowRightIcon />
              </Button>
            </Link>
            <Link href="/problems">
              <Button variant="outline" size="lg" className="min-w-[180px]">
                Explore Problems
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {[
              { value: "Curated", label: "Problem Sets" },
              { value: "AI", label: "Mock Interviews" },
              { value: "STAR", label: "Method Builder" },
              { value: "24/7", label: "Practice Anytime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to prepare
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From coding problems to behavioral questions, practice every aspect of
              the interview process in one place.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── How It Works Section ───── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, effective loop: practice, interview, and improve until you&apos;re ready.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative rounded-xl border border-border bg-card p-8">
                <span className="text-5xl font-bold text-primary/10 absolute top-4 right-6 select-none">
                  {step.number}
                </span>
                <div className="relative">
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to start preparing?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of developers who are using structured practice to ace
            their interviews.
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="min-w-[200px]">
                Get Started — It&apos;s Free
                <ArrowRightIcon />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">Interview Prep Platform</span>
              </Link>
              <p className="text-sm text-muted-foreground text-center sm:text-left max-w-xs">
                An open-source interview preparation platform for developers.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Problems
              </Link>
              <a
                href="https://github.com/rushikeshvpatil/interview-prep-platfor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Interview Prep Platform. Built with Next.js, TypeScript, and Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
