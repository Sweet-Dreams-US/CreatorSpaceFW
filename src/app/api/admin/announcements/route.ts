import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { sendAnnouncementBatch } from "@/lib/announcement-sender";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Fetch announcements with live progress (counts from announcement_recipients)
  const { data: announcements } = await getSupabaseAdmin()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!announcements?.length) return NextResponse.json([]);

  // Aggregate recipient counts per announcement
  const ids = announcements.map((a) => a.id);
  const { data: counts } = await getSupabaseAdmin()
    .from("announcement_recipients")
    .select("announcement_id, status")
    .in("announcement_id", ids);

  const progress: Record<string, { sent: number; pending: number; failed: number; total: number }> = {};
  for (const id of ids) progress[id] = { sent: 0, pending: 0, failed: 0, total: 0 };
  for (const r of counts || []) {
    const p = progress[r.announcement_id];
    if (!p) continue;
    p.total++;
    if (r.status === "sent") p.sent++;
    else if (r.status === "pending") p.pending++;
    else if (r.status === "failed") p.failed++;
  }

  return NextResponse.json(
    announcements.map((a) => ({ ...a, progress: progress[a.id] }))
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { subject, body, audience } = await req.json();
  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  }

  // Resolve recipients based on audience
  let query = getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, email, claimed");
  if (audience === "claimed") query = query.eq("claimed", true);
  else if (audience === "unclaimed") query = query.eq("claimed", false);

  const { data: creators } = await query;
  const recipients = (creators || []).filter(
    (c) => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)
  );

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: `No valid email addresses found for audience "${audience}"` },
      { status: 404 }
    );
  }

  // 1. Create the announcement row
  const { data: announcement, error: insertError } = await getSupabaseAdmin()
    .from("announcements")
    .insert({ subject, body, sent_by: user.id, sent_to: 0 })
    .select()
    .single();

  if (insertError || !announcement) {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }

  // 2. Queue all recipients as pending
  const recipientRows = recipients.map((c) => ({
    announcement_id: announcement.id,
    creator_id: c.id,
    email: c.email!,
    first_name: c.first_name,
    status: "pending",
  }));
  await getSupabaseAdmin().from("announcement_recipients").insert(recipientRows);

  // 3. Send the first batch immediately
  const result = await sendAnnouncementBatch(announcement.id, subject, body);

  return NextResponse.json({
    success: true,
    announcementId: announcement.id,
    totalRecipients: recipients.length,
    ...result,
  });
}
