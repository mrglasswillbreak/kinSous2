"use client";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("page_error", { digest: error.digest });
  }, [error]);
  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold">We couldn’t load this page</h1>
      <p className="text-muted my-4">
        Your connection or a service may be temporarily unavailable. Please try
        again.
      </p>
      <button
        className="min-h-11 px-5 rounded-xl bg-primary text-white"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
