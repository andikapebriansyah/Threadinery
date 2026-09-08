import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MapClient } from "@/components/MapClient";

interface MapPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string; entity?: string; location?: string }>;
}

export default async function MapPage({ params, searchParams }: MapPageProps) {
  const { id: projectId } = await params;
  const sParams = await searchParams;
  const initialFocus = sParams?.focus || sParams?.entity || sParams?.location;
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
    <MapClient
      projectId={project.id}
      projectName={project.name}
      user={user}
      initialFocus={initialFocus}
    />
  );
}
