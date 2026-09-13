import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/authServer";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { notifyOnReportCreatedAsync } from "@/lib/notifications/notifyOnReportCreated";
import { lookupMlaByArea } from "@/public/data/areaToMla";

const REPORT_CATEGORY_VALUES = [
  "POTHOLES",
  "GARBAGE",
  "WATER_LEAKAGE",
  "DRAINAGE_SEWAGE",
  "STREETLIGHT",
  "ROAD_DAMAGE",
  "ILLEGAL_DUMPING",
  "STRAY_ANIMALS",
  "TRAFFIC_SIGNAL",
  "ENCROACHMENT",
  "BUILDING",
  "FLOODING",
  "OTHER",
] as const;

type ReportCategoryValue = (typeof REPORT_CATEGORY_VALUES)[number];

export async function GET() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const session = await requireServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 415 });
  }

  const form = await req.formData();

  const title       = String(form.get("title")       ?? "").trim();
  const areaName    = String(form.get("areaName")     ?? "").trim();
  const mapAreaText = String(form.get("mapAreaText")  ?? "").trim();
  const description = String(form.get("description")  ?? "").trim();
  const category    = String(form.get("category")     ?? "").trim();
  const latRaw      = String(form.get("latitude")     ?? "").trim();
  const lngRaw      = String(form.get("longitude")    ?? "").trim();

  const latitude  = latRaw  ? Number(latRaw)  : null;
  const longitude = lngRaw ? Number(lngRaw) : null;

  if (!title || !areaName || !description || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!REPORT_CATEGORY_VALUES.includes(category as ReportCategoryValue)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const imagesToCreate: { isMain: boolean; url: string }[] = [];

  const mainImageFile = form.get("mainImage");
  if (mainImageFile instanceof File && mainImageFile.size > 0) {
    const url = await uploadToCloudinary(mainImageFile);
    if (url) imagesToCreate.push({ isMain: true, url });
  }

  for (const entry of form.getAll("bodyImages").slice(0, 4)) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    const url = await uploadToCloudinary(entry);
    if (url) imagesToCreate.push({ isMain: false, url });
  }

  const mla = lookupMlaByArea(areaName);

  const report = await prisma.report.create({
    data: {
      title,
      areaName,
      mapAreaText: mapAreaText || null,
      description,
      category: category as any,
      latitude,
      longitude,
      mlaName: mla?.mla_name ?? null,
      constituencyName: mla?.constituency ?? null,
      createdById: session.user.id,
      reportSource: "WEB",
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
      actorId: session.user.id,
      actorName: session.user.name || "Citizen",
      actorRole: "CITIZEN",
      action: "REPORTED",
      note: `Issue reported by ${session.user.name || "Citizen"}.`,
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

  const mainImage = report.images.find((img: (typeof report.images)[number]) => img.isMain);
  const whatsapp = await notifyOnReportCreatedAsync({
    id: report.id,
    title: report.title,
    areaName: report.areaName,
    category: report.category,
    imageUrl: mainImage?.url,
  });

  return NextResponse.json({ report, whatsapp });
}
