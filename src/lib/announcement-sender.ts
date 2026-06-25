import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sendAnnouncementEmail } from "@/lib/email";

// Resend free tier is ~2 req/sec, so we send serially with a throttle.
// 25 emails per click = ~15s (well under Vercel's 300s function timeout).
export const BATCH_SIZE = 25;
const THROTTLE_MS = 600; // ~1.66 emails/sec, safely under 2/sec

export interface BatchResult {
  batchSent: number;
  batchFailed: number;
  firstError: string | null;
  progress: {
    sent: number;
    pending: number;
    failed: number;
    total: number;
  };
}

/**
 * Process up to BATCH_SIZE pending recipients for an announcement.
 * Updates each recipient row's status as it goes so a crash mid-batch
 * doesn't lose progress. Returns the updated progress so the UI can refresh.
 */
export async function sendAnnouncementBatch(
  announcementId: string,
  subject: string,
  body: string
): Promise<BatchResult> {
  // Pull the next batch of pending recipients
  const { data: pending } = await getSupabaseAdmin()
    .from("announcement_recipients")
    .select("id, email, first_name")
    .eq("announcement_id", announcementId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  let sent = 0;
  let failed = 0;
  let firstError: string | null = null;

  for (const recipient of pending || []) {
    try {
      const res = (await sendAnnouncementEmail(
        recipient.email,
        recipient.first_name || "Creator",
        subject,
        body
      )) as { data?: unknown; error?: { message?: string } };

      if (res?.error) {
        failed++;
        const msg = res.error.message || JSON.stringify(res.error);
        if (!firstError) firstError = msg;
        await getSupabaseAdmin()
          .from("announcement_recipients")
          .update({ status: "failed", error_message: msg })
          .eq("id", recipient.id);
      } else {
        sent++;
        await getSupabaseAdmin()
          .from("announcement_recipients")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", recipient.id);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (!firstError) firstError = msg;
      await getSupabaseAdmin()
        .from("announcement_recipients")
        .update({ status: "failed", error_message: msg })
        .eq("id", recipient.id);
    }

    // Throttle between sends so we don't trip Resend's 2 req/sec limit
    if (THROTTLE_MS > 0) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }
  }

  // Recompute totals and update the announcement.sent_to counter
  const { data: counts } = await getSupabaseAdmin()
    .from("announcement_recipients")
    .select("status")
    .eq("announcement_id", announcementId);

  const totalSent = (counts || []).filter((c) => c.status === "sent").length;
  const totalPending = (counts || []).filter((c) => c.status === "pending").length;
  const totalFailed = (counts || []).filter((c) => c.status === "failed").length;

  await getSupabaseAdmin()
    .from("announcements")
    .update({ sent_to: totalSent })
    .eq("id", announcementId);

  return {
    batchSent: sent,
    batchFailed: failed,
    firstError,
    progress: {
      sent: totalSent,
      pending: totalPending,
      failed: totalFailed,
      total: counts?.length || 0,
    },
  };
}
