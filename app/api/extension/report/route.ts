import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authServer";
import { notifyOnReportCreatedAsync } from "@/lib/notifications/notifyOnReportCreated";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, category, areaName, location, latitude, longitude } = body;

    if (!title || !description || !category || !areaName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { email: "ahmed.khan@gmail.com" },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      } else {
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
          userId = anyUser.id;
        } else {
          return NextResponse.json({ error: "No user found to assign report" }, { status: 500 });
        }
      }
    }

    const report = await prisma.report.create({
      data: {
        title,
        description,
        category,
        areaName,
        mapAreaText: areaName,
        locationText: location || areaName,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        createdById: userId,
        status: "REPORTED",
      },
    });

    await prisma.issueTimeline.create({
      data: {
        issueId: report.id,
        actorId: userId,
        actorName: "Extension Bot",
        actorRole: "SYSTEM",
        action: "REPORTED",
        note: "Reported via CIVICOS Chrome Extension",
      },
    });

    const whatsapp = await notifyOnReportCreatedAsync({
      id: report.id,
      title: report.title,
      areaName: report.areaName,
      category: report.category,
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report successfully created from extension",
      whatsapp,
    });
  } catch (error: any) {
    console.error("Extension report error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
