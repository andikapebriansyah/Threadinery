import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        book: true,
        chapter: true,
        entitiesInvolved: {
          include: {
            entity: {
              include: {
                type: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("GET event detail error:", error);
    return NextResponse.json({ error: "Gagal mengambil data event" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await req.json();

    const { name, worldDate, description, bookId, writingStatus, entityIds } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (worldDate !== undefined) updateData.worldDate = worldDate ? worldDate.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (bookId !== undefined) updateData.bookId = bookId || null;
    if (writingStatus !== undefined) updateData.writingStatus = writingStatus || null;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        book: true,
        chapter: true,
        entitiesInvolved: {
          include: {
            entity: {
              include: {
                type: true,
              },
            },
          },
        },
      },
    });

    // Update entity relations if entityIds array provided
    if (Array.isArray(entityIds)) {
      await prisma.eventEntity.deleteMany({
        where: { eventId },
      });

      if (entityIds.length > 0) {
        await prisma.eventEntity.createMany({
          data: entityIds.map((entityId: string) => ({
            eventId,
            entityId,
          })),
        });
      }
    }

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error("PATCH event error:", error);
    return NextResponse.json({ error: "Gagal memperbarui event" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE event error:", error);
    return NextResponse.json({ error: "Gagal menghapus event" }, { status: 500 });
  }
}
