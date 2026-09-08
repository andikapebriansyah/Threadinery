import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[id]/entities/[entityId]/include-book
// Adds a bookId to the entity's metadata.bookIds appearance list
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; entityId: string }> }
) {
  const { id: projectId, entityId } = await params;

  try {
    const body = await req.json();
    const { bookId } = body;

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json(
        { error: "bookId wajib disertakan" },
        { status: 400 }
      );
    }

    const entity = await prisma.entity.findFirst({
      where: { id: entityId, projectId },
    });

    if (!entity) {
      return NextResponse.json(
        { error: "Entitas tidak ditemukan" },
        { status: 404 }
      );
    }

    const metadata: any = (entity.metadata as any) || {};
    const currentBookIds: string[] = Array.isArray(metadata.bookIds)
      ? metadata.bookIds
      : [];

    if (!currentBookIds.includes(bookId)) {
      currentBookIds.push(bookId);
    }

    metadata.bookIds = currentBookIds;

    const updated = await prisma.entity.update({
      where: { id: entityId },
      data: { metadata },
      include: { type: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Include book error:", err);
    return NextResponse.json(
      { error: "Gagal menghubungkan entitas ke buku", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
