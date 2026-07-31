import { sendAreaWhatsAppNotifications, type WhatsAppNotifyResult } from "./whatsapp";

type ReportPayload = {
  id: string;
  title: string;
  areaName: string;
  category: string;
  imageUrl?: string;
};

export function notifyOnReportCreated(report: ReportPayload): void {
  sendAreaWhatsAppNotifications(report).catch((err) => {
    console.error("[WhatsApp] Notification error:", err);
  });
}

export async function notifyOnReportCreatedAsync(
  report: ReportPayload
): Promise<WhatsAppNotifyResult> {
  try {
    return await sendAreaWhatsAppNotifications(report);
  } catch (err) {
    console.error("[WhatsApp] Notification error:", err);
    return { sent: 0, failed: 0, skipped: true, reason: "error" };
  }
}
