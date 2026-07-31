export function getSubscribersForArea(areaName: string): string[] {
  const raw = process.env.WHATSAPP_AREA_SUBSCRIBERS;
  if (!raw?.trim()) return [];

  try {
    const map = JSON.parse(raw) as Record<string, string[]>;
    const key = Object.keys(map).find(
      (k) => k.trim().toLowerCase() === areaName.trim().toLowerCase()
    );
    if (!key) return [];

    return (map[key] ?? [])
      .map((p) => p.trim())
      .filter((p) => p.startsWith("+") && p.length >= 10);
  } catch {
    console.error("[WhatsApp] Invalid WHATSAPP_AREA_SUBSCRIBERS JSON");
    return [];
  }
}
