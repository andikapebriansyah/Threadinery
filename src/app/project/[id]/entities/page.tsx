import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EntitiesListClient } from "@/components/EntitiesListClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Entities — Project ${id}` };
}

export default async function EntitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";
  const { id: projectId } = await params;

  let project = null;
  let initialEntities: any[] = [];
  let initialEntityTypes: any[] = [];

  try {
    project = await prisma.project.findFirst({
      where: { id: projectId },
      select: { name: true },
    });

    initialEntityTypes = await prisma.entityType.findMany({
      where: { projectId },
      orderBy: { isDefault: "desc" },
    });

    initialEntities = await prisma.entity.findMany({
      where: { projectId },
      include: {
        type: true,
        relationshipsFrom: {
          include: { target: { select: { id: true, name: true } } },
        },
        relationshipsTo: {
          include: { source: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    console.warn("Fetch initial entities page error:", err);
  }

  const projectName = project?.name || "Dunia Threadinery";

  const user = session?.user || {
    id: userId,
    name: "Penulis Demo",
    email: "writer@threadinery.dev",
  };

  return (
    <EntitiesListClient
      projectId={projectId}
      projectName={projectName}
      user={user}
      initialEntities={JSON.parse(JSON.stringify(initialEntities))}
      initialEntityTypes={JSON.parse(JSON.stringify(initialEntityTypes))}
    />
  );
}
