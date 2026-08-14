import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE /api/projects/[id]/relationships/[relationshipId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";
  const { id: projectId, relationshipId } = await params;

  try {
    const existing = await prisma.relationship.findFirst({
      where: { id: relationshipId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Relasi tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.relationship.delete({
      where: { id: relationshipId },
    });

    return NextResponse.json({ message: "Relasi berhasil dihapus" });
  } catch (err: any) {
    console.error("Delete relationship error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus relasi" },
      { status: 500 }
    );
  }
}
