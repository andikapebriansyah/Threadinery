import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EntityProfileClient } from "@/components/EntityProfileClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; entityId: string }>;
}): Promise<Metadata> {
  const { id, entityId } = await params;
  return { title: `Profile ${entityId} — Project ${id}` };
}

export default async function EntityProfilePage({
  params,
}: {
  params: Promise<{ id: string; entityId: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id || "dev-user-id";
  const { id: projectId, entityId } = await params;

  let project = null;
  try {
    project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { name: true },
    });
  } catch (err) {
    console.warn("Fetch project error:", err);
  }

  const projectName = project?.name || "Dunia Threadinery";

  const user = session?.user || {
    id: userId,
    name: "Penulis Demo",
    email: "writer@threadinery.dev",
  };

  return (
    <EntityProfileClient
      projectId={projectId}
      entityId={entityId}
      projectName={projectName}
      user={user}
    />
  );
}
