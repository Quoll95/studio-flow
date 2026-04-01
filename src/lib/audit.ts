import { supabase } from "@/integrations/supabase/client";

export async function logAudit(azione: string, dettagli?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_log").insert({
    user_id: user.id,
    azione,
    dettagli: dettagli || null,
  });
}
