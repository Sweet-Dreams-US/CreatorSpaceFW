import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { sendAnnouncementBatch } from "@/lib/announcement-sender";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;

  // Fetch the announcement so we have subject/body for the email
  const { data: announcement } = await getSupabaseAdmin()
    .from("announcements")
    .select("id, subject, body")
    .eq("id", id)
    .single();

  if (!announcement) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  const result = await sendAnnouncementBatch(announcement.id, announcement.subject, announcement.body);
  return NextResponse.json({ success: true, ...result });
}
