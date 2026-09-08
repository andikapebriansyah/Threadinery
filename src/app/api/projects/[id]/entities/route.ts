import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/entities
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const { searchParams } = new URL(req.url);
  const typeId = searchParams.get("typeId");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const bookId = searchParams.get("bookId");

  try {
    const whereClause: any = { projectId };

    if (typeId && typeId !== "all") {
      whereClause.typeId = typeId;
    }

    if (tag && tag !== "all") {
      whereClause.tags = { has: tag };
    }

    if (search?.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    let entities = await prisma.entity.findMany({
      where: whereClause,
      include: {
        type: true,
        relationshipsFrom: {
          include: { target: { select: { id: true, name: true } } },
        },
        relationshipsTo: {
          include: { source: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Book-Scoped Appearance Filter
    if (bookId && bookId !== "all") {
      entities = entities.filter((e) => {
        const meta = e.metadata as any;
        const metaBooks = Array.isArray(meta?.bookIds) ? meta.bookIds : [];
        if (metaBooks.includes(bookId)) return true;
        // If entity has no specific bookIds recorded yet, show in default roster
        if (metaBooks.length === 0) return true;
        return false;
      });
    }

    return NextResponse.json(entities);
  } catch (err: any) {
    console.error("Fetch entities error in route handler:", err);
    return NextResponse.json(
      { error: "Failed to fetch entities", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/entities
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { name, typeId, description, tags, metadata, imageUrl, status, bookId, initialRelationship } = body;

    if (!name?.trim() || !typeId) {
      return NextResponse.json(
        { error: "Nama dan Tipe wajib diisi" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanDesc = description?.trim() || null;

    const cleanTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : [];

    const finalMetadata: any = metadata || {};
    if (bookId && typeof bookId === "string") {
      const existingBooks = Array.isArray(finalMetadata.bookIds) ? finalMetadata.bookIds : [];
      if (!existingBooks.includes(bookId)) {
        finalMetadata.bookIds = [...existingBooks, bookId];
      }
    }

    const entity = await prisma.entity.create({
      data: {
        projectId,
        typeId,
        name: cleanName,
        description: cleanDesc,
        tags: cleanTags,
        metadata: finalMetadata,
        imageUrl: imageUrl?.trim() || null,
        status: status?.trim() || null,
      },
      include: {
        type: true,
      },
    });

    // Create initial relationship if provided during creation
    if (initialRelationship?.targetEntityId && initialRelationship?.label?.trim()) {
      try {
        await prisma.relationship.create({
          data: {
            projectId,
            sourceEntityId: entity.id,
            targetEntityId: initialRelationship.targetEntityId,
            label: initialRelationship.label.trim(),
          },
        });
      } catch (relErr) {
        console.warn("Initial relationship creation warning:", relErr);
      }
    }

    return NextResponse.json(entity, { status: 201 });
  } catch (err: any) {
    console.error("Create entity error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal membuat entitas baru" },
      { status: 500 }
    );
  }
}
