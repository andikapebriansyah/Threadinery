import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; mapId: string }> }
) {
  try {
    const { mapId } = await params;
    const body = await req.json();
    const { entityId, x, y } = body;

    if (!entityId || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json(
        { error: "entityId, x, dan y wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    // Upsert marker location
    const location = await prisma.entityLocation.upsert({
      where: { entityId },
      create: {
        entityId,
        mapId,
        x,
        y,
      },
      update: {
        mapId,
        x,
        y,
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            description: true,
            type: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(location);
  } catch (error: any) {
    console.error("POST /api/projects/[id]/maps/[mapId]/locations error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan marker lokasi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; mapId: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");

    if (!entityId) {
      return NextResponse.json(
        { error: "entityId wajib diberikan di URL" },
        { status: 400 }
      );
    }

    await prisma.entityLocation.deleteMany({
      where: { entityId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id]/maps/[mapId]/locations error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus marker lokasi" },
      { status: 500 }
    );
  }
}
