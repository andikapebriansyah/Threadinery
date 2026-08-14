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

    const entities = await prisma.entity.findMany({
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
    const { name, typeId, description, tags, metadata, imageUrl, status, initialRelationship } = body;

    if (!name?.trim() || !typeId || !description?.trim()) {
      return NextResponse.json(
        { error: "Nama, Tipe, dan Deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanDesc = description.trim();

    const cleanTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : [];

    const entity = await prisma.entity.create({
      data: {
        projectId,
        typeId,
        name: cleanName,
        description: cleanDesc,
        tags: cleanTags,
        metadata: metadata || {},
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
