import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-black)]">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
