import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OutlineClient } from "@/components/OutlineClient";

interface OutlinePageProps {
  params: Promise<{ id: string }>;
}

export default async function OutlinePage({ params }: OutlinePageProps) {
  const { id: projectId } = await params;
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
    <OutlineClient
      projectId={project.id}
      projectName={project.name}
      user={user}
    />
  );
}
