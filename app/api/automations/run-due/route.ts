import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getNextAutomationRun } from "@/features/automation/engine";
import { executeAutomation } from "@/lib/automation/runner";
import type { Automation } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ message: "Scheduler is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ message: "Automation scheduler requires a Supabase service role key." }, { status: 503 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("automations").select("*")
    .eq("enabled", true).eq("trigger_type", "schedule")
    .lte("next_run_at", new Date().toISOString()).order("next_run_at", { ascending: true }).limit(100);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const results = [];
  for (const row of data || []) {
    if (!row.next_run_at) continue;
    const nextRunAt = row.repeat_interval && row.repeat_interval !== "once"
      ? getNextAutomationRun(new Date(row.next_run_at), row.repeat_interval)?.toISOString()
      : row.next_run_at;
    const claim = await supabase.from("automations").update({
      ...(row.repeat_interval === "once" ? { enabled: false } : { next_run_at: nextRunAt }),
    }).eq("id", row.id).eq("workspace_id", row.workspace_id).eq("enabled", true).eq("next_run_at", row.next_run_at).select("id").maybeSingle();
    if (claim.error) {
      results.push({ success: false, message: claim.error.message });
      continue;
    }
    if (!claim.data) continue;
    results.push(await executeAutomation(supabase, row as Automation, { source: "schedule", scheduledAt: row.next_run_at }));
  }

  return NextResponse.json({ processed: results.length, failed: results.filter((result) => !result.success).length });
}
