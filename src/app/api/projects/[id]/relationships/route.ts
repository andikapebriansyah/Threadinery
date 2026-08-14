import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/relationships
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const relationships = await prisma.relationship.findMany({
      where: { projectId },
      include: {
        source: { include: { type: true } },
        target: { include: { type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(relationships);
  } catch (err: any) {
    console.error("Fetch relationships error:", err);
    return NextResponse.json([]);
  }
}

// POST /api/projects/[id]/relationships (§7.5 & §7.6)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { sourceEntityId, targetEntityId, label, description } = body;

    if (!sourceEntityId || !targetEntityId || !label?.trim()) {
      return NextResponse.json(
        { error: "Source entity, target entity, dan label wajib diisi" },
        { status: 400 }
      );
    }

    if (sourceEntityId === targetEntityId) {
      return NextResponse.json(
        { error: "Entity tidak dapat memiliki relasi dengan dirinya sendiri" },
        { status: 400 }
      );
    }

    const relationship = await prisma.relationship.create({
      data: {
        projectId,
        sourceEntityId,
        targetEntityId,
        label: label.trim(),
        description: description?.trim() || null,
      },
      include: {
        source: { include: { type: true } },
        target: { include: { type: true } },
      },
    });

    return NextResponse.json(relationship, { status: 201 });
  } catch (err: any) {
    console.error("Create relationship error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal membuat relasi" },
      { status: 500 }
    );
  }
}
