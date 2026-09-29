"use client";
import { ErrorState } from "@/components/shared/States";
import { ApiError } from "@/lib/api";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState error={new ApiError("INTERNAL_ERROR", "")} onRetry={reset} />;
}
