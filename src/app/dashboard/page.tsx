import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "My Stories",
  description: "Semua dunia yang sedang kamu bangun di Threadinery.",
};

export default async function DashboardPage() {
  const session = await auth();

  // Fallback user untuk mempermudah debugging tanpa login
  const user = session?.user || {
    id: "dev-user-id",
    name: "Penulis Demo",
    email: "writer@threadinery.dev",
  };

  return <DashboardClient user={user} />;
}
