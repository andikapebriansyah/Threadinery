import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase, BUCKET_NAME } from "@/lib/supabase";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; mapId: string }> }
) {
  try {
    const { id: projectId, mapId } = await params;

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
      await prisma.map.deleteMany({
        where: { id: mapId, projectId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id]/maps/[mapId] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data peta" },
      { status: 500 }
    );
  }
}
