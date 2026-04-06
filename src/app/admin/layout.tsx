import { redirect } from "next/navigation";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin, hasModeratorAccess } from "@/lib/admin";
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

  if (!user) redirect("/");

  // Check email-based admin OR DB role
  const emailAdmin = isAdmin(user.email);
  let dbRole: string | null = null;

  if (!emailAdmin) {
    const { data: creator } = await getSupabaseAdmin()
      .from("creators")
      .select("role")
      .eq("auth_id", user.id)
      .single();
    dbRole = creator?.role || null;
  }

  if (!emailAdmin && !hasModeratorAccess(dbRole)) {
    redirect("/");
  }

  const userRole = emailAdmin ? "admin" : dbRole;

  return (
    <div className="flex min-h-screen bg-[var(--color-black)]">
      <AdminSidebar userRole={userRole} />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
