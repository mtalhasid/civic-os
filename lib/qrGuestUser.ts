import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const QR_GUEST_EMAIL = "qr-guest@civicos.local";

export async function getOrCreateQrGuestUser() {
  return prisma.user.upsert({
    where: { email: QR_GUEST_EMAIL },
    update: {},
    create: {
      email: QR_GUEST_EMAIL,
      name: "CIVICOS Quick Report",
      passwordHash: await bcrypt.hash("qr-guest-not-for-login", 10),
      role: "CITIZEN",
    },
  });
}
