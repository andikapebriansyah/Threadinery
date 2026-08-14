import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/projects
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        books: { orderBy: { orderIndex: "asc" } },
        _count: { select: { entities: true, books: true, events: true, relationships: true } },
      },
    });

    return NextResponse.json(projects);
  } catch (err) {
    console.warn("DB Connection fallback:", err);
    return NextResponse.json([]);
  }
}

// POST /api/projects
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";

  try {
    const body = await req.json();
    const { name, description, genre, subGenre } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama project wajib diisi" }, { status: 400 });
    }

    let userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists && userId === "dev-user-id") {
      userExists = await prisma.user.create({
        data: { id: "dev-user-id", email: "writer@threadinery.dev", password: "dev", name: "Penulis Demo" },
      });
    }

    const cleanName = name.trim();
    const cleanDesc = description?.trim() || null;
    const cleanGenre = genre?.trim() || "Fantasy";
    const cleanSubGenre = subGenre?.trim() || null;

    let project: any = null;

    try {
      project = await prisma.project.create({
        data: {
          userId,
          name: cleanName,
          description: cleanDesc,
          genre: cleanGenre,
          subGenre: cleanSubGenre,
        } as any,
      });
    } catch (prismaErr) {
      console.warn("Prisma create fallback:", prismaErr);
      project = await prisma.project.create({
        data: {
          userId,
          name: cleanName,
          description: cleanDesc,
        },
      });

      await prisma.$executeRaw`
        UPDATE "Project"
        SET "genre" = ${cleanGenre},
            "subGenre" = ${cleanSubGenre}
        WHERE "id" = ${project.id}
      `;
    }

    // Auto-create default 5 EntityTypes (§7.1)
    await prisma.entityType.createMany({
      data: [
        { projectId: project.id, name: "Character", isDefault: true },
        { projectId: project.id, name: "Location", isDefault: true },
        { projectId: project.id, name: "Organization", isDefault: true },
        { projectId: project.id, name: "Object", isDefault: true },
        { projectId: project.id, name: "Concept", isDefault: true },
      ],
    });

    // Auto-create default "Buku 1"
    await prisma.book.create({
      data: {
        projectId: project.id,
        title: "Buku 1",
        orderIndex: 1,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    console.warn("DB Post error:", err);
    return NextResponse.json({ error: err?.message || "Gagal membuat dunia baru" }, { status: 500 });
  }
}
