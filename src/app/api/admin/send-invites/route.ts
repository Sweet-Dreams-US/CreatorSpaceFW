import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { creatorIds } = await req.json();

  if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
    return NextResponse.json({ error: "No creator IDs provided" }, { status: 400 });
  }

  // Fetch the creators
  const { data: creators } = await supabaseAdmin
    .from("creators")
    .select("id, first_name, email, invite_token")
    .in("id", creatorIds)
    .eq("claimed", false);

  if (!creators || creators.length === 0) {
    return NextResponse.json({ error: "No eligible creators found" }, { status: 404 });
  }

  let sent = 0;
  let failed = 0;

  // Send in batches of 10 to respect rate limits
  const batchSize = 10;
  for (let i = 0; i < creators.length; i += batchSize) {
    const batch = creators.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (creator) => {
        if (!creator.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creator.email)) {
          throw new Error("Invalid email");
        }

        await sendInviteEmail(
          creator.email,
          creator.first_name || "Creator",
          creator.invite_token
        );

        // Update invite_sent_at
        await supabaseAdmin
          .from("creators")
          .update({ invite_sent_at: new Date().toISOString() })
          .eq("id", creator.id);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") sent++;
      else failed++;
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}
