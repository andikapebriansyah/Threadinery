import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProjectDashboardClient } from "@/components/ProjectDashboardClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Project ${id}` };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";
  const { id } = await params;

  let project = null;
  try {
    project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        books: { orderBy: { orderIndex: "asc" } },
        _count: {
          select: {
            entities: true,
            relationships: true,
            events: true,
            chapters: true,
          },
        },
      },
    });
  } catch (err) {
    console.warn("DB fetch error in project detail page:", err);
  }

  // Fallback data jika project baru / dalam mode dev
  if (!project) {
    project = {
      id,
      name: id === "proj-1" ? "Kerajaan Ashmoor" : id === "proj-2" ? "Anak-anak Bulan Sabit" : "Plutoneija",
      description: "Dunia high fantasy low magic",
      books: [
        { id: "b1", title: "Buku 1", orderIndex: 0 },
        { id: "b2", title: "Buku 2", orderIndex: 1 },
      ],
      _count: { entities: 0, relationships: 0, events: 0, chapters: 0 },
    };
  }

  const user = session?.user || {
    id: userId,
    name: "Penulis Demo",
    email: "writer@threadinery.dev",
  };

  return <ProjectDashboardClient project={project} user={user} />;
}
