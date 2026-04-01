import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatTime(t: string | null) {
  return t ? t.slice(0, 5) : "";
}

function buildEmailHtml(
  nome: string,
  oggi: string,
  eventi: any[],
  scadenze: any[],
  avvisi: { titolo: string; label: string; data: string }[]
): string {
  const sections: string[] = [];

  if (eventi.length > 0) {
    const rows = eventi.map(e => {
      const time = e.ora_inizio ? `<span style="color:#6b7280">${formatTime(e.ora_inizio)}${e.ora_fine ? ` – ${formatTime(e.ora_fine)}` : ""}</span> ` : "";
      return `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6">${time}<strong>${e.titolo}</strong></li>`;
    }).join("");
    sections.push(`<h2 style="color:#1e293b;font-size:16px;margin:24px 0 8px">📅 Eventi di oggi</h2><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
  }

  if (scadenze.length > 0) {
    const rows = scadenze.map(s => {
      const pratica = s.pratiche?.titolo ? ` <span style="color:#6b7280">— ${s.pratiche.titolo}</span>` : "";
      return `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6">⚠️ <strong>${s.titolo}</strong>${pratica}</li>`;
    }).join("");
    sections.push(`<h2 style="color:#1e293b;font-size:16px;margin:24px 0 8px">🔴 Scadenze di oggi</h2><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
  }

  if (avvisi.length > 0) {
    const rows = avvisi.map(a => {
      return `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6">🔔 <strong>${a.titolo}</strong> <span style="color:#6b7280">(${a.label} — ${a.data})</span></li>`;
    }).join("");
    sections.push(`<h2 style="color:#1e293b;font-size:16px;margin:24px 0 8px">🔔 Promemoria</h2><ul style="list-style:none;padding:0;margin:0">${rows}</ul>`);
  }

  if (sections.length === 0) {
    return ""; // No email needed
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff">
  <div style="text-align:center;padding:16px 0;border-bottom:2px solid #e2e8f0;margin-bottom:16px">
    <h1 style="color:#1e293b;font-size:20px;margin:0">Studio Ferrante</h1>
    <p style="color:#6b7280;font-size:14px;margin:4px 0 0">Riepilogo del ${oggi}</p>
  </div>
  <p style="color:#374151;font-size:14px">Ciao ${nome || ""},</p>
  <p style="color:#374151;font-size:14px">Ecco le cose da fare oggi:</p>
  ${sections.join("")}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="color:#9ca3af;font-size:12px">Questa email è stata inviata automaticamente da Studio Ferrante.</p>
  </div>
</body>
</html>`;
}

// Map avviso key → days offset
const AVVISO_DAYS: Record<string, number> = {
  "stesso_giorno": 0,
  "1_giorno_prima": 1,
  "2_giorni_prima": 2,
  "3_giorni_prima": 3,
  "1_settimana_prima": 7,
  "2_settimane_prima": 14,
  "1_mese_prima": 30,
};

const AVVISO_LABELS: Record<string, string> = {
  "stesso_giorno": "oggi",
  "1_giorno_prima": "domani",
  "2_giorni_prima": "tra 2 giorni",
  "3_giorni_prima": "tra 3 giorni",
  "1_settimana_prima": "tra 1 settimana",
  "2_settimane_prima": "tra 2 settimane",
  "1_mese_prima": "tra 1 mese",
};

function getAvvisiForToday(
  eventi: any[],
  scadenze: any[],
  oggi: string
): { titolo: string; label: string; data: string }[] {
  const result: { titolo: string; label: string; data: string }[] = [];
  const oggiMs = new Date(oggi).getTime();

  const check = (avvisiArr: string[], itemDate: string, titolo: string) => {
    if (!avvisiArr || avvisiArr.length === 0) return;
    if (itemDate === oggi) return; // same day events shown in main section
    for (const avviso of avvisiArr) {
      const days = AVVISO_DAYS[avviso];
      if (days === undefined) continue;
      const targetMs = oggiMs + days * 86400000;
      const itemMs = new Date(itemDate).getTime();
      if (Math.abs(targetMs - itemMs) < 43200000) { // within 12h tolerance
        result.push({ titolo, label: AVVISO_LABELS[avviso] || avviso, data: itemDate });
      }
    }
  };

  for (const ev of eventi) {
    check(ev.avvisi || [], ev.data, ev.titolo);
  }
  for (const sc of scadenze) {
    check(sc.avvisi || [], sc.data_scadenza, `📌 ${sc.titolo}`);
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get today's date in Europe/Rome timezone
    const now = new Date();
    const romaFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" });
    const oggi = romaFormatter.format(now);

    const hourFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", hour: "numeric", hour12: false });
    const currentHour = parseInt(hourFormatter.format(now));

    // Get users with email enabled and matching hour
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, email, nome_completo, daily_email_enabled, daily_email_hour")
      .eq("daily_email_enabled", true);

    if (profErr) throw profErr;

    const usersToNotify = (profiles || []).filter((p: any) => (p.daily_email_hour ?? 7) === currentHour);

    console.log(`[daily-digest] ${oggi} hour=${currentHour}: ${usersToNotify.length} users to notify`);

    // Date range for avvisi (up to 35 days ahead for 1-month avviso)
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 35);
    const futureStr = romaFormatter.format(futureDate);

    let sent = 0;
    for (const user of usersToNotify) {
      if (!user.email) continue;

      // Get events for today
      const { data: eventi } = await supabase
        .from("eventi_calendario")
        .select("*")
        .eq("user_id", user.id)
        .eq("data", oggi)
        .order("ora_inizio");

      // Get scadenze for today
      const { data: scadenze } = await supabase
        .from("scadenze")
        .select("*, pratiche(titolo)")
        .eq("data_scadenza", oggi)
        .eq("completata", false);

      // Get future events with avvisi
      const { data: futureEventi } = await supabase
        .from("eventi_calendario")
        .select("*")
        .eq("user_id", user.id)
        .gt("data", oggi)
        .lte("data", futureStr);

      // Get future scadenze with avvisi
      const { data: futureScadenze } = await supabase
        .from("scadenze")
        .select("*, pratiche(titolo)")
        .gt("data_scadenza", oggi)
        .lte("data_scadenza", futureStr)
        .eq("completata", false);

      const avvisi = getAvvisiForToday(
        futureEventi || [],
        futureScadenze || [],
        oggi
      );

      const html = buildEmailHtml(
        user.nome_completo || "",
        oggi,
        eventi || [],
        scadenze || [],
        avvisi
      );

      if (!html) {
        console.log(`[daily-digest] No content for ${user.email}, skipping`);
        continue;
      }

      if (!resendApiKey) {
        console.log(`[daily-digest] RESEND_API_KEY not configured, would send to ${user.email}`);
        console.log(`[daily-digest] Content: ${(eventi || []).length} eventi, ${(scadenze || []).length} scadenze, ${avvisi.length} avvisi`);
        continue;
      }

      // Send via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Studio Ferrante <noreply@studioferrante.it>",
          to: [user.email],
          subject: `📋 Riepilogo del ${oggi} — Studio Ferrante`,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[daily-digest] Failed to send to ${user.email}: ${errText}`);
      } else {
        sent++;
        console.log(`[daily-digest] Sent to ${user.email}`);
      }
    }

    return new Response(JSON.stringify({ ok: true, date: oggi, hour: currentHour, users: usersToNotify.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[daily-digest] Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
