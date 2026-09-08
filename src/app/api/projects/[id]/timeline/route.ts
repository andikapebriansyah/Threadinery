import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);

    const entityId = searchParams.get("entityId");
    const bookId = searchParams.get("bookId");

    let project: any = null;
    try {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, calendarType: true },
      });
    } catch (pErr) {
      console.warn("Project query fallback without calendarType:", pErr);
      project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true },
      });
    }

    if (!project) {
      return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
    }

    // Build filter query
    const whereCondition: any = {
      projectId,
    };

    if (bookId) {
      whereCondition.bookId = bookId;
    }

    if (entityId) {
      whereCondition.entitiesInvolved = {
        some: {
          entityId,
        },
      };
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
      include: {
        book: true,
        chapter: true,
        entitiesInvolved: {
          include: {
            entity: {
              include: {
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Separate dated and undated events
    const datedEvents = events.filter((e) => e.worldDate && e.worldDate.trim() !== "");
    const undatedEvents = events.filter((e) => !e.worldDate || e.worldDate.trim() === "");

    // Sort dated events chronologically: primary by worldDate string, secondary by orderIndex/orderInChapter
    datedEvents.sort((a, b) => {
      const dateA = a.worldDate?.toLowerCase() || "";
      const dateB = b.worldDate?.toLowerCase() || "";
      const dateCmp = dateA.localeCompare(dateB, undefined, { numeric: true, sensitivity: "base" });
      if (dateCmp !== 0) return dateCmp;

      // Same worldDate → sort by orderInChapter ascending, then createdAt
      const orderA = a.orderInChapter ?? 0;
      const orderB = b.orderInChapter ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        calendarType: project.calendarType || "fantasy",
      },
      datedEvents,
      undatedEvents,
      totalCount: events.length,
    });
  } catch (error: any) {
    console.error("GET timeline error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data timeline" },
      { status: 500 }
    );
  }
}
