import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";

export const metadata: Metadata = {
  title: "My Stories",
  description: "Semua dunia yang sedang kamu bangun di Threadinery.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <DashboardClient user={session.user} />;
}
