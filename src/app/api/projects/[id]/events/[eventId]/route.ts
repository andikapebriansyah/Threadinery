import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id: projectId, eventId } = await params;

    const event = await prisma.event.findFirst({
      where: { id: eventId, projectId },
      include: {
        book: {
          select: { id: true, title: true },
        },
        entitiesInvolved: {
          include: {
            entity: {
              select: {
                id: true,
                name: true,
                status: true,
                type: { select: { id: true, name: true } },
              },
            },
          },
        },
        relationshipChanges: {
          include: {
            relationship: {
              include: {
                source: { select: { id: true, name: true } },
                target: { select: { id: true, name: true } },
              },
            },
          },
        },
        statusChanges: {
          include: {
            entity: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("GET /api/projects/[id]/events/[eventId] error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id: projectId, eventId } = await params;
    const body = await req.json();
    const {
      name,
      description,
      worldDate,
      bookId,
      writingStatus,
      entitiesInvolved, // Array of { entityId: string, role?: string }
      relationshipChanges, // Array of { relationshipId?: string, sourceEntityId?: string, targetEntityId?: string, beforeLabel?: string, afterLabel: string }
      statusChanges, // Array of { entityId: string, oldStatus?: string, newStatus: string }
      orderInChapter,
    } = body;

    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, projectId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    const updatedData: any = {};
    if (name !== undefined) updatedData.name = name.trim();
    if (description !== undefined) updatedData.description = description?.trim() || null;
    if (worldDate !== undefined) updatedData.worldDate = worldDate?.trim() || null;
    if (bookId !== undefined) updatedData.bookId = bookId || null;
    if (writingStatus !== undefined) updatedData.writingStatus = writingStatus;
    if (orderInChapter !== undefined) updatedData.orderInChapter = orderInChapter;

    // Handle entitiesInvolved re-linking
    if (Array.isArray(entitiesInvolved)) {
      await prisma.eventEntity.deleteMany({ where: { eventId } });
      if (entitiesInvolved.length > 0) {
        updatedData.entitiesInvolved = {
          create: entitiesInvolved.map((item: any) => ({
            entityId: item.entityId,
            role: item.role?.trim() || null,
          })),
        };
      }
    }

    // Handle relationshipChanges re-linking (including dynamic creation of new relationships!)
    if (Array.isArray(relationshipChanges)) {
      await prisma.eventRelationshipChange.deleteMany({ where: { eventId } });

      const relChangeCreateItems: { relationshipId: string; beforeLabel?: string | null; afterLabel: string }[] = [];

      for (const rc of relationshipChanges) {
        let relId = rc.relationshipId;

        // If no relationshipId, but source & target provided -> Find or Create Relationship!
        if (!relId && rc.sourceEntityId && rc.targetEntityId) {
          let existingRel = await prisma.relationship.findFirst({
            where: {
              projectId,
              OR: [
                { sourceEntityId: rc.sourceEntityId, targetEntityId: rc.targetEntityId },
                { sourceEntityId: rc.targetEntityId, targetEntityId: rc.sourceEntityId },
              ],
            },
          });

          if (!existingRel) {
            existingRel = await prisma.relationship.create({
              data: {
                projectId,
                sourceEntityId: rc.sourceEntityId,
                targetEntityId: rc.targetEntityId,
                label: rc.afterLabel.trim(),
                description: `Relasi baru dari event: ${name ? name.trim() : existingEvent.name}`,
              },
            });
          }
          relId = existingRel.id;
        }

        if (relId) {
          relChangeCreateItems.push({
            relationshipId: relId,
            beforeLabel: rc.beforeLabel?.trim() || null,
            afterLabel: rc.afterLabel.trim(),
          });
        }
      }

      if (relChangeCreateItems.length > 0) {
        updatedData.relationshipChanges = {
          create: relChangeCreateItems,
        };
      }
    }

    // Handle statusChanges re-linking
    if (Array.isArray(statusChanges)) {
      await prisma.entityStatusLog.deleteMany({ where: { eventId } });
      if (statusChanges.length > 0) {
        updatedData.statusChanges = {
          create: statusChanges.map((sc: any) => ({
            entityId: sc.entityId,
            oldStatus: sc.oldStatus?.trim() || null,
            newStatus: sc.newStatus.trim(),
          })),
        };
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updatedData,
      include: {
        book: {
          select: { id: true, title: true },
        },
        entitiesInvolved: {
          include: {
            entity: {
              select: {
                id: true,
                name: true,
                status: true,
                type: { select: { id: true, name: true } },
              },
            },
          },
        },
        relationshipChanges: {
          include: {
            relationship: {
              include: {
                source: { select: { id: true, name: true } },
                target: { select: { id: true, name: true } },
              },
            },
          },
        },
        statusChanges: {
          include: {
            entity: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error("PATCH /api/projects/[id]/events/[eventId] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id: projectId, eventId } = await params;

    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, projectId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id]/events/[eventId] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus event" },
      { status: 500 }
    );
  }
}
