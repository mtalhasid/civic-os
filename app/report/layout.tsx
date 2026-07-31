import Link from "next/link";

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg, #ffffff)" }}>
      <header
        className="border-b px-4 py-4"
        style={{ borderColor: "var(--border, #e5e7eb)", background: "var(--surface, #fff)" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="text-lg font-bold no-underline" style={{ color: "var(--primary, #16a34a)" }}>
            CIVICOS
          </Link>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted, #6b7280)" }}>
            Quick Report
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
