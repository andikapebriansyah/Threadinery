import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase, BUCKET_NAME } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const maps = await prisma.map.findMany({
      where: { projectId },
      include: {
        locations: {
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
        },
      },
    });

    return NextResponse.json(maps);
  } catch (error: any) {
    console.error("GET /api/projects/[id]/maps error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data peta" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const { name, imageUrl, width, height } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama peta wajib diisi" },
        { status: 400 }
      );
    }

    if (!imageUrl || !imageUrl.trim()) {
      return NextResponse.json(
        { error: "URL gambar peta wajib diisi" },
        { status: 400 }
      );
    }

    const createdMap = await prisma.map.create({
      data: {
        projectId,
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        width: typeof width === "number" ? width : 1200,
        height: typeof height === "number" ? height : 800,
      },
      include: {
        locations: {
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
        },
      },
    });

    return NextResponse.json(createdMap);
  } catch (error: any) {
    console.error("POST /api/projects/[id]/maps error:", error);
    return NextResponse.json(
      { error: "Gagal membuat data peta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);
    const mapId = searchParams.get("mapId");

    if (!mapId) {
      return NextResponse.json(
        { error: "mapId wajib disertakan" },
        { status: 400 }
      );
    }

    // 1. Find map first to get imageUrl
    const mapToDelete = await prisma.map.findFirst({
      where: { id: mapId, projectId },
    });

    if (mapToDelete) {
      // 2. If stored in Supabase Storage Bucket, delete the physical file!
      if (mapToDelete.imageUrl && mapToDelete.imageUrl.includes(`/${BUCKET_NAME}/`)) {
        try {
          const parts = mapToDelete.imageUrl.split(`/${BUCKET_NAME}/`);
          if (parts.length > 1) {
            const storagePath = decodeURIComponent(parts[1].split("?")[0]);
            console.log(`[Storage Cleanup] Removing file from Supabase Bucket '${BUCKET_NAME}':`, storagePath);
            await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
          }
        } catch (storageErr) {
          console.warn("[Storage Cleanup] Failed to remove file from Supabase Storage:", storageErr);
        }
      }

      // 3. Delete from database
      await prisma.map.delete({
        where: { id: mapId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id]/maps error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data peta" },
      { status: 500 }
    );
  }
}
