import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/projects/[id]/books/[bookId] (Rename Book)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; bookId: string }> }
) {
  const { id: projectId, bookId } = await params;

  try {
    const { title } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Judul buku wajib diisi" }, { status: 400 });
    }

    const updatedBook = await prisma.book.update({
      where: { id: bookId, projectId },
      data: { title: title.trim() },
    });

    return NextResponse.json(updatedBook);
  } catch (err: any) {
    console.error("Update book error:", err);
    return NextResponse.json({ error: err?.message || "Gagal mengedit nama buku" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/books/[bookId] (Delete Book)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; bookId: string }> }
) {
  const { id: projectId, bookId } = await params;

  try {
    const count = await prisma.book.count({ where: { projectId } });
    if (count <= 1) {
      return NextResponse.json(
        { error: "Dunia harus memiliki minimal 1 buku. Tidak dapat menghapus buku terakhir." },
        { status: 400 }
      );
    }

    await prisma.book.delete({
      where: { id: bookId, projectId },
    });

    return NextResponse.json({ message: "Buku berhasil dihapus" });
  } catch (err: any) {
    console.error("Delete book error:", err);
    return NextResponse.json({ error: err?.message || "Gagal menghapus buku" }, { status: 500 });
  }
}
