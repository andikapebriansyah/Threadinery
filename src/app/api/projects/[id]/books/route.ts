import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/books
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const books = await prisma.book.findMany({
      where: { projectId },
      orderBy: { orderIndex: "asc" },
      include: {
        _count: { select: { chapters: true, events: true } },
      },
    });

    if (books.length === 0) {
      // Auto-create default "Buku 1" if none exists yet
      const defaultBook = await prisma.book.create({
        data: {
          projectId,
          title: "Buku 1",
          orderIndex: 1,
        },
      });
      return NextResponse.json([defaultBook]);
    }

    return NextResponse.json(books);
  } catch (err: any) {
    console.error("Fetch books error:", err);
    return NextResponse.json({ error: "Gagal mengambil daftar buku" }, { status: 500 });
  }
}

// POST /api/projects/[id]/books
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const { title } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: "Judul buku wajib diisi" }, { status: 400 });
    }

    const existingCount = await prisma.book.count({ where: { projectId } });

    const newBook = await prisma.book.create({
      data: {
        projectId,
        title: title.trim(),
        orderIndex: existingCount + 1,
      },
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (err: any) {
    console.error("Create book error:", err);
    return NextResponse.json({ error: "Gagal menambah buku baru" }, { status: 500 });
  }
}
