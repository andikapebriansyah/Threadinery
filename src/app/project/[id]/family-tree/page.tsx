import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FamilyTreeClient } from "@/components/FamilyTreeClient";

interface FamilyTreePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string }>;
}

export default async function FamilyTreePage({ params, searchParams }: FamilyTreePageProps) {
  const { id: projectId } = await params;
  const { focus: initialFocus } = await searchParams;
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
    <FamilyTreeClient
      projectId={project.id}
      projectName={project.name}
      user={user}
      initialFocus={initialFocus}
    />
  );
}
