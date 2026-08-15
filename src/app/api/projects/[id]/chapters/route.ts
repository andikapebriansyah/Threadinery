import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/chapters
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");

  try {
    const whereClause: any = { projectId };
    if (bookId && bookId !== "ALL") {
      whereClause.bookId = bookId;
    }

    const chapters = await prisma.chapter.findMany({
      where: whereClause,
      include: {
        book: { select: { id: true, title: true } },
        events: {
          select: {
            id: true,
            name: true,
            worldDate: true,
            writingStatus: true,
            orderInChapter: true,
            entitiesInvolved: {
              include: {
                entity: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { orderInChapter: "asc" },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(chapters);
  } catch (err: any) {
    console.error("Fetch chapters error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil daftar chapter", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/chapters
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { title, bookId, summary, orderIndex, eventIds } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Judul bab wajib diisi" },
        { status: 400 }
      );
    }

    // Determine target bookId
    let targetBookId = bookId;
    if (!targetBookId) {
      const firstBook = await prisma.book.findFirst({
        where: { projectId },
        orderBy: { orderIndex: "asc" },
      });
      if (!firstBook) {
        // Create default book if none exists
        const newBook = await prisma.book.create({
          data: { projectId, title: "Buku 1", orderIndex: 0 },
        });
        targetBookId = newBook.id;
      } else {
        targetBookId = firstBook.id;
      }
    }

    // Calculate next orderIndex if not provided
    let finalOrderIndex = orderIndex;
    if (typeof finalOrderIndex !== "number") {
      const lastChapter = await prisma.chapter.findFirst({
        where: { projectId, bookId: targetBookId },
        orderBy: { orderIndex: "desc" },
      });
      finalOrderIndex = (lastChapter?.orderIndex ?? -1) + 1;
    }

    const chapter = await prisma.chapter.create({
      data: {
        projectId,
        bookId: targetBookId,
        title: title.trim(),
        summary: summary?.trim() || null,
        orderIndex: finalOrderIndex,
      },
      include: {
        book: { select: { id: true, title: true } },
        events: true,
      },
    });

    // Link optional events
    if (Array.isArray(eventIds) && eventIds.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: eventIds }, projectId },
        data: { chapterId: chapter.id, bookId: targetBookId },
      });
    }

    // Fetch updated chapter with linked events
    const updatedChapter = await prisma.chapter.findUnique({
      where: { id: chapter.id },
      include: {
        book: { select: { id: true, title: true } },
        events: {
          select: {
            id: true,
            name: true,
            worldDate: true,
            writingStatus: true,
            orderInChapter: true,
          },
          orderBy: { orderInChapter: "asc" },
        },
      },
    });

    return NextResponse.json(updatedChapter, { status: 201 });
  } catch (err: any) {
    console.error("Create chapter error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal membuat chapter baru" },
      { status: 500 }
    );
  }
}
