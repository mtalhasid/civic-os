import { getSubscribersForArea } from "./areaSubscribers";
import { getAppBaseUrl } from "@/lib/appUrl";

export type WhatsAppNotifyResult = {
  sent: number;
  failed: number;
  skipped: boolean;
  reason?: string;
};

type ReportForWhatsApp = {
  id: string;
  title: string;
  areaName: string;
  category: string;
  imageUrl?: string;
};

function categoryLabel(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function buildMessage(report: ReportForWhatsApp): string {
  const baseUrl = getAppBaseUrl();

  return [
    `CIVICOS Alert — ${report.areaName}`,
    "",
    `New civic issue reported:`,
    `"${report.title}"`,
    "",
    `Category: ${categoryLabel(report.category)}`,
    `View: ${baseUrl}/reports/${report.id}`,
  ].join("\n");
}

async function sendTwilioWhatsApp(to: string, body: string, mediaUrl?: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) return false;

  const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const fromWhatsApp = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const params = new URLSearchParams({
    From: fromWhatsApp,
    To: toWhatsApp,
    Body: body,
  });

  if (mediaUrl) {
    params.append("MediaUrl", mediaUrl);
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WhatsApp] Failed to send to ${to}:`, err);
    return false;
  }

  return true;
}

export async function sendAreaWhatsAppNotifications(
  report: ReportForWhatsApp
): Promise<WhatsAppNotifyResult> {
  if (process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== "true") {
    return { sent: 0, failed: 0, skipped: true, reason: "disabled" };
  }

  const phones = getSubscribersForArea(report.areaName);
  if (phones.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: "no_subscribers" };
  }

  const body = buildMessage(report);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    phones.map(async (phone) => {
      const ok = await sendTwilioWhatsApp(phone, body, report.imageUrl);
      if (ok) sent++;
      else failed++;
    })
  );

  return { sent, failed, skipped: false };
}
