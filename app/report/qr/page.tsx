import Image from "next/image";
import QRCode from "qrcode";
import { getAppBaseUrl } from "@/lib/appUrl";

export const dynamic = "force-dynamic";

async function getQuickReportUrl(): Promise<string> {
  return `${getAppBaseUrl()}/report/quick`;
}
export default async function QrPosterPage() {
  const url = await getQuickReportUrl();
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: "#14532d", light: "#ffffff" },
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-heading, #111827)" }}>
          Scan to report
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted, #6b7280)" }}>
          Citizens can scan this QR code to report civic issues instantly — no login required.
        </p>
      </div>

      <div
        className="mx-auto mt-8 max-w-sm rounded-3xl border p-8 text-center shadow-sm"
        style={{ background: "var(--surface, #fff)", borderColor: "var(--border, #e5e7eb)" }}
      >
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="text-xl font-bold" style={{ color: "var(--primary, #16a34a)" }}>
            CIVICOS
          </span>
        </div>

        <Image
          src={qrDataUrl}
          alt="QR code to report a civic issue"
          className="mx-auto rounded-xl"
          width={280}
          height={280}
          unoptimized
        />

        <p className="mt-6 text-sm font-semibold" style={{ color: "var(--text-heading, #111827)" }}>
          Report a civic issue
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted, #6b7280)" }}>
          Scan with your phone camera
        </p>

        <p
          className="mt-6 break-all rounded-xl px-3 py-2 text-[11px] font-mono"
          style={{ background: "var(--primary-light, #f0fdf4)", color: "var(--primary-dark, #14532d)" }}
        >
          {url}
        </p>
      </div>

      <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted, #9ca3af)" }}>
        Tip: Screenshot this page for your presentation slides or print it as a poster.
      </p>
    </div>
  );
}
