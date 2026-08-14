import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const events = await prisma.event.findMany({
      where: { projectId },
      orderBy: [{ orderInChapter: "asc" }, { createdAt: "asc" }],
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

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("GET /api/projects/[id]/events error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar event" },
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
    const {
      name,
      description,
      worldDate,
      bookId,
      writingStatus,
      entitiesInvolved, // Array of { entityId: string, role?: string }
      relationshipChanges, // Array of { relationshipId?: string, sourceEntityId?: string, targetEntityId?: string, beforeLabel?: string, afterLabel: string }
      statusChanges, // Array of { entityId: string, oldStatus?: string, newStatus: string }
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Nama event wajib diisi" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project tidak ditemukan" },
        { status: 404 }
      );
    }

    // Process Relationship Changes (Create new Relationship if source & target provided!)
    const relChangeCreateItems: { relationshipId: string; beforeLabel?: string | null; afterLabel: string }[] = [];

    if (Array.isArray(relationshipChanges) && relationshipChanges.length > 0) {
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
                description: `Relasi baru dari event: ${name.trim()}`,
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
    }

    // Determine highest orderInChapter for sequential listing
    const maxOrderEvent = await prisma.event.findFirst({
      where: { projectId },
      orderBy: { orderInChapter: "desc" },
      select: { orderInChapter: true },
    });
    const nextOrder = (maxOrderEvent?.orderInChapter ?? 0) + 1;

    const createdEvent = await prisma.event.create({
      data: {
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
        worldDate: worldDate?.trim() || null,
        bookId: bookId || null,
        writingStatus: writingStatus || "planned",
        orderInChapter: nextOrder,
        entitiesInvolved:
          Array.isArray(entitiesInvolved) && entitiesInvolved.length > 0
            ? {
                create: entitiesInvolved.map((item: any) => ({
                  entityId: item.entityId,
                  role: item.role?.trim() || null,
                })),
              }
            : undefined,
        relationshipChanges:
          relChangeCreateItems.length > 0
            ? {
                create: relChangeCreateItems,
              }
            : undefined,
        statusChanges:
          Array.isArray(statusChanges) && statusChanges.length > 0
            ? {
                create: statusChanges.map((sc: any) => ({
                  entityId: sc.entityId,
                  oldStatus: sc.oldStatus?.trim() || null,
                  newStatus: sc.newStatus.trim(),
                })),
              }
            : undefined,
      },
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

    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/events error:", error);
    return NextResponse.json(
      { error: "Gagal membuat event baru" },
      { status: 500 }
    );
  }
}
