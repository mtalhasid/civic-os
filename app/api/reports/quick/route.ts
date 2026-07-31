import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { getOrCreateQrGuestUser } from "@/lib/qrGuestUser";
import { notifyOnReportCreatedAsync } from "@/lib/notifications/notifyOnReportCreated";
import { lookupMlaByArea } from "@/public/data/areaToMla";
import { REPORT_CATEGORIES, type ReportCategoryValue } from "@/lib/reportCategories";

const VALID_CATEGORIES = new Set<string>(REPORT_CATEGORIES.map((c) => c.value));

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 415 });
  }

  const form = await req.formData();

  const reporterName = String(form.get("reporterName") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const areaName = String(form.get("areaName") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();

  if (!reporterName || reporterName.length < 2) {
    return NextResponse.json({ error: "Please enter your name (at least 2 characters)" }, { status: 400 });
  }
  if (!title || !areaName || !description || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const imagesToCreate: { isMain: boolean; url: string }[] = [];
  const formMainImage = form.get("mainImage");
  if (formMainImage instanceof File && formMainImage.size > 0) {
    const url = await uploadToCloudinary(formMainImage);
    if (url) imagesToCreate.push({ isMain: true, url });
  }

  const guestUser = await getOrCreateQrGuestUser();
  const mla = lookupMlaByArea(areaName);

  const report = await prisma.report.create({
    data: {
      title,
      areaName,
      description,
      category: category as ReportCategoryValue,
      mlaName: mla?.mla_name ?? null,
      constituencyName: mla?.constituency ?? null,
      createdById: guestUser.id,
      reporterName,
      reportSource: "QR",
      images: { create: imagesToCreate },
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      images: true,
    },
  });

  await prisma.issueTimeline.create({
    data: {
      issueId: report.id,
      actorId: null,
      actorName: reporterName,
      actorRole: "CITIZEN",
      action: "REPORTED",
      note: `Issue reported via QR scan by ${reporterName}.`,
    },
  });

  if (mla) {
    await prisma.issueTimeline.create({
      data: {
        issueId: report.id,
        actorId: null,
        actorName: "System",
        actorRole: "SYSTEM",
        action: "ASSIGNED",
        note: `Automatically assigned to MLA ${mla.mla_name} (${mla.constituency}) based on area: ${areaName}.`,
      },
    });
  }

  const mainImage = report.images.find((img: any) => img.isMain);
  const whatsapp = await notifyOnReportCreatedAsync({
    id: report.id,
    title: report.title,
    areaName: report.areaName,
    category: report.category,
    imageUrl: mainImage?.url,
  });

  return NextResponse.json({ report, whatsapp });
}
