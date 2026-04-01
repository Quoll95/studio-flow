/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStatiPratica } from "@/hooks/use-stati-pratica";
import DashboardAgenda from "@/components/DashboardAgenda";
import type { Pratica } from "@/types/database";

export default function Dashboard() {
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [statCounts, setStatCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { stati, getLabel, getColore } = useStatiPratica();

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from("pratiche").select("*, clienti(*), tipi_pratica(*)")
        .order("updated_at", { ascending: false }).limit(5);
      setPratiche((p as Pratica[]) || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (stati.length === 0) return;
    async function countStati() {
      const counts: Record<string, number> = {};
      await Promise.all(stati.map(async (s) => {
        const { count } = await supabase.from("pratiche").select("*", { count: "exact", head: true }).eq("stato", s.valore);
        counts[s.valore] = count || 0;
      }));
      setStatCounts(counts);
    }
    countStati();
  }, [stati]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Panoramica dello studio</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {stati.map(s => (
          <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/pratiche?stato=${s.valore}`)}>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${s.colore}20` }}>
                  <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: s.colore }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{statCounts[s.valore] ?? 0}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardAgenda />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><FolderOpen className="h-5 w-5 text-accent" /> Ultime Pratiche</CardTitle>
        </CardHeader>
        <CardContent>
          {pratiche.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna pratica trovata.</p>
          ) : (
            <div className="space-y-3">
              {pratiche.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => navigate(`/pratiche/${p.id}`)}>
                  <div className="flex items-center gap-2 min-w-0">
                    {p.colore && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.titolo}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.clienti?.nome_completo || "—"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>
                    {getLabel(p.stato)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
