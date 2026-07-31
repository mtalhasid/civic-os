"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { QrCode, User, FileText, MapPin, Tag, MessageSquare, Camera } from "lucide-react";

import { REPORT_CATEGORIES, type ReportCategoryValue } from "@/lib/reportCategories";
import { AREA_TO_MLA } from "@/public/data/areaToMla";

function QuickReportForm() {
  const searchParams = useSearchParams();
  const areaFromQr = searchParams.get("area")?.trim() ?? "";

  const [reporterName, setReporterName] = useState("");
  const [title, setTitle] = useState("");
  const [areaName, setAreaName] = useState(AREA_TO_MLA[0]?.area ?? "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategoryValue>("POTHOLES");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [previewMain, setPreviewMain] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!areaFromQr) return;
    const match = AREA_TO_MLA.find(
      (a) => a.area.toLowerCase() === areaFromQr.toLowerCase()
    );
    if (match) setAreaName(match.area);
  }, [areaFromQr]);

  useEffect(() => {
    if (!mainImage) {
      setPreviewMain(null);
      return;
    }
    const url = URL.createObjectURL(mainImage);
    setPreviewMain(url);
    return () => URL.revokeObjectURL(url);
  }, [mainImage]);

  const canSubmit = useMemo(() => {
    return Boolean(
      reporterName.trim().length >= 2 &&
        title.trim() &&
        areaName.trim() &&
        description.trim() &&
        category
    );
  }, [reporterName, title, areaName, description, category]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("reporterName", reporterName.trim());
      form.set("title", title.trim());
      form.set("areaName", areaName.trim());
      form.set("description", description.trim());
      form.set("category", category);
      if (mainImage) form.set("mainImage", mainImage);

      const res = await fetch("/api/reports/quick", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit report");

      const whatsapp = data.whatsapp;
      if (whatsapp?.sent > 0) {
        toast.success(`WhatsApp alert sent to ${whatsapp.sent} resident(s) in ${areaName}`);
      }

      const params = new URLSearchParams({
        id: data.report.id,
        name: reporterName.trim(),
      });
      window.location.href = `/report/quick/success?${params.toString()}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--primary-light, #f0fdf4)", color: "var(--primary, #16a34a)" }}
        >
          <QrCode size={28} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-heading, #111827)" }}>
          Report a civic issue
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted, #6b7280)" }}>
          No login needed. Fill in the details below and submit.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border p-6 shadow-sm"
        style={{ background: "var(--surface, #fff)", borderColor: "var(--border, #e5e7eb)" }}
      >
        <label className="mb-4 grid gap-2 text-sm" style={{ color: "var(--text-primary, #374151)" }}>
          <span className="flex items-center gap-2 font-medium">
            <User size={16} /> Your name
          </span>
          <input
            className="h-12 rounded-xl border px-3 text-sm outline-none focus:border-green-500"
            style={{ borderColor: "var(--border, #e5e7eb)" }}
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="e.g. Rahul Kumar"
            required
            minLength={2}
          />
        </label>

        <label className="mb-4 grid gap-2 text-sm" style={{ color: "var(--text-primary, #374151)" }}>
          <span className="flex items-center gap-2 font-medium">
            <FileText size={16} /> Issue title
          </span>
          <input
            className="h-12 rounded-xl border px-3 text-sm outline-none focus:border-green-500"
            style={{ borderColor: "var(--border, #e5e7eb)" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pothole near main road"
            required
          />
        </label>

        <label className="mb-4 grid gap-2 text-sm" style={{ color: "var(--text-primary, #374151)" }}>
          <span className="flex items-center gap-2 font-medium">
            <MapPin size={16} /> Area
          </span>
          <select
            className="h-12 rounded-xl border px-3 text-sm outline-none focus:border-green-500"
            style={{ borderColor: "var(--border, #e5e7eb)" }}
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
          >
            {AREA_TO_MLA.map((a) => (
              <option key={a.area} value={a.area}>
                {a.area}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-4 grid gap-2 text-sm" style={{ color: "var(--text-primary, #374151)" }}>
          <span className="flex items-center gap-2 font-medium">
            <Tag size={16} /> Category
          </span>
          <select
            className="h-12 rounded-xl border px-3 text-sm outline-none focus:border-green-500"
            style={{ borderColor: "var(--border, #e5e7eb)" }}
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategoryValue)}
          >
            {REPORT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-4 grid gap-2 text-sm" style={{ color: "var(--text-primary, #374151)" }}>
          <span className="flex items-center gap-2 font-medium">
            <MessageSquare size={16} /> Description
          </span>
          <textarea
            className="min-h-[100px] rounded-xl border px-3 py-2 text-sm outline-none focus:border-green-500"
            style={{ borderColor: "var(--border, #e5e7eb)" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue clearly..."
            required
          />
        </label>

        <label className="mb-4 grid gap-2 text-sm" style={{ color: "var(--text-primary, #374151)" }}>
          <span className="flex items-center gap-2 font-medium">
            <Camera size={16} /> Photo (optional)
          </span>
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => setMainImage(e.target.files?.[0] ?? null)}
          />
        </label>

        {previewMain ? (
          <div className="mb-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border, #e5e7eb)" }}>
            <img src={previewMain} alt="Preview" className="h-40 w-full object-cover" />
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#fca5a5", background: "#fef2f2", color: "#dc2626" }}>
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--primary, #16a34a)" }}
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}

export default function QuickReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm" style={{ color: "var(--text-muted, #6b7280)" }}>
          Loading...
        </div>
      }
    >
      <QuickReportForm />
    </Suspense>
  );
}
