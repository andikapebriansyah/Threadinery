import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChapterDetailClient } from "@/components/ChapterDetailClient";

interface ChapterDetailPageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

export default async function ChapterDetailPage({ params }: ChapterDetailPageProps) {
  const { id: projectId, chapterId } = await params;
  const session = await auth();

  const user = {
    id: session?.user?.id || "dev-user-id",
    name: session?.user?.name || "Penulis Demo",
    email: session?.user?.email || "writer@threadinery.dev",
  };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ChapterDetailClient
      projectId={project.id}
      projectName={project.name}
      chapterId={chapterId}
      user={user}
    />
  );
}
