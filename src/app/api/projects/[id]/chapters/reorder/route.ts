import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[id]/chapters/reorder
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { items } = body; // Array<{ id: string; orderIndex: number }>

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array wajib dikirim" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.chapter.updateMany({
          where: { id: item.id, projectId },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reorder chapters error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengurutkan chapter" },
      { status: 500 }
    );
  }
}
