import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Strict 5 Built-in Generic Types (§7.1)
const DEFAULT_TYPES = [
  "Character",
  "Location",
  "Organization",
  "Object",
  "Concept",
];

const LEGACY_UNWANTED_NAMES = ["artefak", "faksi", "sihir", "event"];

// GET /api/projects/[id]/entity-types
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";
  const { id: projectId } = await params;

  try {
    // Delete legacy unwanted default types (like 'artefak', 'faksi', 'sihir', 'event') if they have 0 entities
    await prisma.entityType.deleteMany({
      where: {
        projectId,
        name: { in: LEGACY_UNWANTED_NAMES, mode: "insensitive" },
        entities: { none: {} },
      },
    });

    let types = await prisma.entityType.findMany({
      where: { projectId },
      orderBy: { isDefault: "desc" },
    });

    // Ensure all 5 built-in generic types exist (§7.1)
    const existingNames = types.map((t) => t.name.toLowerCase());
    const missingDefaults = DEFAULT_TYPES.filter(
      (name) => !existingNames.includes(name.toLowerCase())
    );

    if (missingDefaults.length > 0) {
      await prisma.entityType.createMany({
        data: missingDefaults.map((name) => ({
          projectId,
          name,
          isDefault: true,
        })),
      });

      types = await prisma.entityType.findMany({
        where: { projectId },
        orderBy: { isDefault: "desc" },
      });
    }

    // Sort: 5 built-in types first, then active custom types
    types.sort((a, b) => {
      const idxA = DEFAULT_TYPES.indexOf(a.name);
      const idxB = DEFAULT_TYPES.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(types);
  } catch (err: any) {
    console.error("Fetch entity types error:", err);
    const fallbackTypes = DEFAULT_TYPES.map((name, idx) => ({
      id: `type-${idx + 1}`,
      projectId,
      name,
      isDefault: true,
    }));
    return NextResponse.json(fallbackTypes);
  }
}

// POST /api/projects/[id]/entity-types (Create custom entity type)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";
  const { id: projectId } = await params;

  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nama tipe wajib diisi" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();

    const existing = await prisma.entityType.findFirst({
      where: { projectId, name: { equals: cleanName, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const created = await prisma.entityType.create({
      data: {
        projectId,
        name: cleanName,
        isDefault: false,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("Create entity type error:", err);
    return NextResponse.json(
      { error: "Gagal membuat tipe entitas kustom" },
      { status: 500 }
    );
  }
}
