"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name")?.trim() || "Citizen";
  const reportId = searchParams.get("id")?.trim();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 text-center">
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "var(--primary-light, #f0fdf4)", color: "var(--primary, #16a34a)" }}
      >
        <CheckCircle2 size={40} />
      </div>

      <h1 className="text-2xl font-bold" style={{ color: "var(--text-heading, #111827)" }}>
        Thank you, {name}!
      </h1>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted, #6b7280)" }}>
        Your civic issue has been logged successfully. The relevant authorities and area residents
        have been notified.
      </p>

      {reportId ? (
        <p className="mt-4 rounded-xl border px-4 py-3 text-xs font-mono" style={{ borderColor: "var(--border, #e5e7eb)", color: "var(--text-muted, #6b7280)" }}>
          Report ID: {reportId}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/feed"
          className="inline-flex h-12 items-center justify-center rounded-xl text-sm font-semibold text-white no-underline"
          style={{ background: "var(--primary, #16a34a)" }}
        >
          View community feed
        </Link>
        <Link
          href="/report/quick"
          className="inline-flex h-12 items-center justify-center rounded-xl border text-sm font-medium no-underline"
          style={{ borderColor: "var(--border, #e5e7eb)", color: "var(--text-primary, #374151)" }}
        >
          Report another issue
        </Link>
      </div>
    </div>
  );
}

export default function QuickReportSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm" style={{ color: "var(--text-muted, #6b7280)" }}>
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
