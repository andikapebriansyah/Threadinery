import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimelineClient } from "@/components/TimelineClient";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, userId: true },
  });

  if (!project || project.userId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <TimelineClient
      projectId={project.id}
      projectName={project.name}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }}
    />
  );
}
