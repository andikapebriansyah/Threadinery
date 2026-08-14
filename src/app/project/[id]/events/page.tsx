import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EventsClient } from "@/components/EventsClient";

interface EventsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventsPage({ params }: EventsPageProps) {
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
    <EventsClient
      projectId={project.id}
      projectName={project.name}
      user={user}
    />
  );
}
