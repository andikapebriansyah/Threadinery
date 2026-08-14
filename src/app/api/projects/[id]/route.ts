import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        books: { orderBy: { orderIndex: "asc" } },
        _count: { select: { entities: true, relationships: true, events: true, books: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (err: any) {
    console.error("Fetch project error:", err);
    return NextResponse.json({ error: err?.message || "Gagal mengambil data project" }, { status: 500 });
  }
}

// PUT /api/projects/[id] (Edit World / Settings)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const { name, description, genre, subGenre } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama dunia wajib diisi" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanDesc = description !== undefined ? (description ? description.trim() : null) : null;
    const cleanGenre = genre !== undefined ? (genre ? genre.trim() : null) : null;
    const cleanSubGenre = subGenre !== undefined ? (subGenre ? subGenre.trim() : null) : null;

    let updated = null;

    try {
      updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: cleanName,
          description: cleanDesc,
          genre: cleanGenre,
          subGenre: cleanSubGenre,
        } as any,
        include: {
          books: { orderBy: { orderIndex: "asc" } },
          _count: { select: { entities: true, relationships: true, events: true, books: true } },
        },
      });
    } catch (prismaErr: any) {
      console.warn("Prisma update fallback to executeRaw:", prismaErr?.message);
      // Raw SQL fallback for in-memory cached Prisma client instances
      await prisma.$executeRaw`
        UPDATE "Project"
        SET "name" = ${cleanName},
            "description" = ${cleanDesc},
            "genre" = ${cleanGenre},
            "subGenre" = ${cleanSubGenre},
            "updatedAt" = NOW()
        WHERE "id" = ${projectId}
      `;

      updated = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          books: { orderBy: { orderIndex: "asc" } },
          _count: { select: { entities: true, relationships: true, events: true, books: true } },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Update project error handler:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

// DELETE /api/projects/[id] (Delete World)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Dunia berhasil dihapus" });
  } catch (err: any) {
    console.error("Delete project error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
