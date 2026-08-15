import { AppShell } from '@/components/layout/AppShell';
import { ProblemCatalog } from '@/components/problems/ProblemCatalog';

export const metadata = {
  title: 'Coding Problems | Interview Prep Platform',
  description: 'Practice curated coding problems from LeetCode, Codeforces, CSES, HackerRank, and AtCoder with topic & difficulty filters.',
};

export default function ProblemsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <ProblemCatalog />
      </div>
    </AppShell>
  );
}
