/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { AuditLogEntry } from "@/types/database";

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (!data) { setEntries([]); return; }
      
      // Fetch profiles separately
      const userIds = [...new Set(data.map(d => d.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome_completo, email")
        .in("id", userIds as string[]);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const entries: AuditLogEntry[] = data.map(d => ({
        ...d,
        dettagli: d.dettagli || null,
        user_id: d.user_id || null,
        profiles: d.user_id ? (profileMap.get(d.user_id) as any) || null : null,
      }));
      setEntries(entries);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro Attività</h1>
        <p className="text-muted-foreground text-sm mt-1">Cronologia delle operazioni</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="h-5 w-5 text-accent" />
            Ultime Attività
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nessuna attività registrata.</p>
          ) : (
            <div className="space-y-3">
              {entries.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{e.profiles?.nome_completo || e.profiles?.email || "Utente"}</span>
                      {" — "}
                      <span>{e.azione}</span>
                    </p>
                    {e.dettagli && <p className="text-xs text-muted-foreground mt-0.5">{e.dettagli}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(e.created_at), "dd MMM yyyy, HH:mm", { locale: it })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
