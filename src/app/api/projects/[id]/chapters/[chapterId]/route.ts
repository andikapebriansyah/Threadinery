import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/chapters/[chapterId]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { id: projectId, chapterId } = await params;

  try {
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId },
      include: {
        book: { select: { id: true, title: true } },
        events: {
          include: {
            entitiesInvolved: {
              include: {
                entity: { select: { id: true, name: true, typeId: true, type: true } },
              },
            },
          },
          orderBy: { orderInChapter: "asc" },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(chapter);
  } catch (err: any) {
    console.error("Fetch chapter detail error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil detail chapter", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/chapters/[chapterId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { id: projectId, chapterId } = await params;

  try {
    const body = await req.json();
    const { title, summary, bookId, orderIndex, eventIds } = body;

    const existing = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Chapter tidak ditemukan" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (typeof title === "string" && title.trim()) updateData.title = title.trim();
    if (typeof summary === "string") updateData.summary = summary.trim() || null;
    if (typeof bookId === "string") updateData.bookId = bookId;
    if (typeof orderIndex === "number") updateData.orderIndex = orderIndex;

    const updated = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
    });

    // Handle Linked Events Sync
    if (Array.isArray(eventIds)) {
      const targetBookId = updateData.bookId || existing.bookId;

      // 1. Unlink events previously linked to this chapter that are not in eventIds
      await prisma.event.updateMany({
        where: { chapterId: chapterId, id: { notIn: eventIds } },
        data: { chapterId: null },
      });

      // 2. Link events specified in eventIds
      if (eventIds.length > 0) {
        await prisma.event.updateMany({
          where: { id: { in: eventIds }, projectId },
          data: { chapterId: chapterId, bookId: targetBookId },
        });
      }
    }

    // Return updated chapter with full details
    const result = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: { select: { id: true, title: true } },
        events: {
          include: {
            entitiesInvolved: {
              include: {
                entity: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { orderInChapter: "asc" },
        },
      },
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Update chapter error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengupdate chapter" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/chapters/[chapterId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { id: projectId, chapterId } = await params;

  try {
    const existing = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Chapter tidak ditemukan" },
        { status: 404 }
      );
    }

    // Unlink events from chapter before deletion
    await prisma.event.updateMany({
      where: { chapterId: chapterId },
      data: { chapterId: null },
    });

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ success: true, deletedId: chapterId });
  } catch (err: any) {
    console.error("Delete chapter error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menghapus chapter" },
      { status: 500 }
    );
  }
}
