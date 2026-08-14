import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const { orderedEventIds } = body;

    if (!Array.isArray(orderedEventIds)) {
      return NextResponse.json(
        { error: "orderedEventIds harus berupa array string ID" },
        { status: 400 }
      );
    }

    // Execute bulk update using prisma transaction
    await prisma.$transaction(
      orderedEventIds.map((eventId: string, index: number) =>
        prisma.event.updateMany({
          where: { id: eventId, projectId },
          data: { orderInChapter: index + 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/events/reorder error:", error);
    return NextResponse.json(
      { error: "Gagal merubah urutan event" },
      { status: 500 }
    );
  }
}
