import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/entities/[entityId]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; entityId: string }> }
) {
  const { id: projectId, entityId } = await params;

  try {
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, projectId },
      include: {
        type: true,
        relationshipsFrom: {
          include: {
            target: {
              include: { type: true },
            },
          },
        },
        relationshipsTo: {
          include: {
            source: {
              include: { type: true },
            },
          },
        },
      },
    });

    if (!entity) {
      return NextResponse.json(
        { error: "Entitas tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (err: any) {
    console.error("Fetch single entity error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data entitas" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/entities/[entityId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; entityId: string }> }
) {
  const { id: projectId, entityId } = await params;

  try {
    const body = await req.json();
    const { name, typeId, description, tags, metadata, imageUrl, status } = body;

    const existing = await prisma.entity.findFirst({
      where: { id: entityId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Entitas tidak ditemukan" },
        { status: 404 }
      );
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : existing.tags;

    const updated = await prisma.entity.update({
      where: { id: entityId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        typeId: typeId !== undefined ? typeId : existing.typeId,
        description: description !== undefined ? description.trim() : existing.description,
        tags: cleanTags,
        metadata: metadata !== undefined ? metadata : existing.metadata,
        imageUrl: imageUrl !== undefined ? (imageUrl ? imageUrl.trim() : null) : existing.imageUrl,
        status: status !== undefined ? status : existing.status,
      },
      include: {
        type: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Update entity error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui entitas" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/entities/[entityId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; entityId: string }> }
) {
  const { id: projectId, entityId } = await params;

  try {
    const existing = await prisma.entity.findFirst({
      where: { id: entityId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Entitas tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.entity.delete({
      where: { id: entityId },
    });

    return NextResponse.json({ message: "Entitas berhasil dihapus" });
  } catch (err: any) {
    console.error("Delete entity error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus entitas" },
      { status: 500 }
    );
  }
}
