import { Suspense } from "react";
import JobsExplorer from "@/components/jobs/JobsExplorer";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center text-sm text-ink-muted">
          Loading jobs…
        </div>
      }
    >
      <JobsExplorer />
    </Suspense>
  );
}
