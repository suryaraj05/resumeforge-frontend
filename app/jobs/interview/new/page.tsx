import { Suspense } from "react";
import NewInterviewForm from "./NewInterviewForm";

export default function NewInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <NewInterviewForm />
    </Suspense>
  );
}
