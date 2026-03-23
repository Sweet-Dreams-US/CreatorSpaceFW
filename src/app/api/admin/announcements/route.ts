import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { sendAnnouncementEmail } from "@/lib/email";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { data } = await getSupabaseAdmin()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { subject, body, audience } = await req.json();

  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  }

  // Build query based on audience
  let query = getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, email, claimed");

  if (audience === "claimed") {
    query = query.eq("claimed", true);
  } else if (audience === "unclaimed") {
    query = query.eq("claimed", false);
  }

  const { data: creators } = await query;

  if (!creators || creators.length === 0) {
    return NextResponse.json({ error: "No recipients found" }, { status: 404 });
  }

  // Filter to valid emails
  const recipients = creators.filter(
    (c) => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)
  );

  if (recipients.length === 0) {
    return NextResponse.json({ error: `No valid email addresses found (${creators.length} creators matched audience "${audience}" but none had valid emails)` }, { status: 404 });
  }

  let sent = 0;
  let failed = 0;
  let firstError: string | null = null;

  // Send in batches
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((creator) =>
        sendAnnouncementEmail(
          creator.email!,
          creator.first_name || "Creator",
          subject,
          body
        )
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        // Resend returns { data, error } — check for error in response
        const res = result.value as { data?: unknown; error?: { message?: string } };
        if (res?.error) {
          failed++;
          if (!firstError) firstError = res.error.message || JSON.stringify(res.error);
          console.error("Resend API error:", res.error);
        } else {
          sent++;
        }
      } else {
        failed++;
        const errMsg = result.reason?.message || String(result.reason);
        if (!firstError) firstError = errMsg;
        console.error("Announcement email exception:", errMsg);
      }
    }
  }

  // Log the announcement
  await getSupabaseAdmin().from("announcements").insert({
    subject,
    body,
    sent_by: user.id,
    sent_to: sent,
  });

  return NextResponse.json({
    success: true,
    sent,
    failed,
    totalRecipients: recipients.length,
    firstError,
  });
}
