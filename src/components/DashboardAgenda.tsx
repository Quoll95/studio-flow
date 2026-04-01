/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CalendarDays,
  Bell,
  AlertTriangle,
  Wallet,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  CalendarRange,
  StickyNote,
  Plus,
} from "lucide-react";
import { format, parseISO, addDays, addWeeks } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import DraggablePostItGrid from "./DraggablePostItGrid";
import type { EventoCalendario, Scadenza, PuntoDellaSituazione, NotaGiornalieraPostit } from "@/types/database";

type AvvisoEvento = {
  evento: EventoCalendario;
  tipo_avviso: string;
};

const AVVISO_LABELS: Record<string, string> = {
  "1_giorno_prima": "domani",
  "2_giorni_prima": "tra 2 giorni",
  "3_giorni_prima": "tra 3 giorni",
  "1_settimana_prima": "tra 1 settimana",
  "2_settimane_prima": "tra 2 settimane",
  "1_mese_prima": "tra 1 mese",
};

const POST_IT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];

function getAvvisiPerOggi(eventi: EventoCalendario[], scadenze: Scadenza[], oggi: string): AvvisoEvento[] {
  const result: AvvisoEvento[] = [];
  const oggiDate = parseISO(oggi);

  const calcTarget = (avviso: string, oggiD: Date): Date | null => {
    if (avviso === "1_giorno_prima") return addDays(oggiD, 1);
    if (avviso === "2_giorni_prima") return addDays(oggiD, 2);
    if (avviso === "3_giorni_prima") return addDays(oggiD, 3);
    if (avviso === "1_settimana_prima") return addWeeks(oggiD, 1);
    if (avviso === "2_settimane_prima") return addWeeks(oggiD, 2);
    if (avviso === "1_mese_prima") return addDays(oggiD, 30);
    return null;
  };

  // Eventi avvisi
  for (const ev of eventi) {
    if (!ev.avvisi || ev.avvisi.length === 0 || ev.data === oggi) continue;
    for (const avviso of ev.avvisi) {
      const targetDate = calcTarget(avviso, oggiDate);
      if (targetDate && format(targetDate, "yyyy-MM-dd") === ev.data) {
        result.push({ evento: { ...ev } as any, tipo_avviso: avviso });
      }
    }
  }

  // Scadenze avvisi
  for (const sc of scadenze) {
    if (!sc.avvisi || sc.avvisi.length === 0 || sc.data_scadenza === oggi) continue;
    for (const avviso of sc.avvisi) {
      const targetDate = calcTarget(avviso, oggiDate);
      if (targetDate && format(targetDate, "yyyy-MM-dd") === sc.data_scadenza) {
        result.push({
          evento: { id: sc.id, titolo: `📌 ${sc.titolo}`, data: sc.data_scadenza, colore: "#ef4444" } as any,
          tipo_avviso: avviso,
        });
      }
    }
  }

  return result;
}

function isSpesaEvent(ev: EventoCalendario) {
  return ev.titolo.startsWith("💰");
}

type AgendaItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: { label: string; color?: string };
  borderColor?: string;
  onClick?: () => void;
};

function AgendaItem({ icon, title, subtitle, badge, borderColor, onClick }: AgendaItemProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 ${onClick ? "cursor-pointer hover:bg-muted/80" : ""} transition-colors`}
      style={borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : undefined}
      onClick={onClick}
    >
      <div className="shrink-0 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {badge && (
        <Badge variant="outline" className="text-xs shrink-0" style={badge.color ? { borderColor: badge.color, color: badge.color, backgroundColor: `${badge.color}15` } : undefined}>
          {badge.label}
        </Badge>
      )}
      {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </div>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 mt-3 mb-1 first:mt-0">
      <span className="text-muted-foreground">{icon}</span>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <Badge variant="secondary" className="text-[10px] h-5 min-w-5 justify-center">{count}</Badge>
    </div>
  );
}

export default function DashboardAgenda() {
  const navigate = useNavigate();
  const oggi = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  const fineSettimana = format(addDays(now, 7), "yyyy-MM-dd");

  const [eventiOggi, setEventiOggi] = useState<EventoCalendario[]>([]);
  const [scadenzeOggi, setScadenzeOggi] = useState<Scadenza[]>([]);
  const [puntiOggi, setPuntiOggi] = useState<(PuntoDellaSituazione & { pratica_titolo?: string; pratica_colore?: string })[]>([]);
  const [avvisiOggi, setAvvisiOggi] = useState<AvvisoEvento[]>([]);
  const [notePostit, setNotePostit] = useState<NotaGiornalieraPostit[]>([]);
  const [newNota, setNewNota] = useState("");
  const [newNotaColore, setNewNotaColore] = useState(POST_IT_COLORS[0]);

  const [eventiSettimana, setEventiSettimana] = useState<EventoCalendario[]>([]);
  const [scadenzeSettimana, setScadenzeSettimana] = useState<Scadenza[]>([]);
  const [puntiSettimana, setPuntiSettimana] = useState<(PuntoDellaSituazione & { pratica_titolo?: string; pratica_colore?: string })[]>([]);
  const [scadenzeScadute, setScadenzeScadute] = useState<Scadenza[]>([]);
  const [scaduteOpen, setScaduteOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const fineMeseAvvisi = format(addDays(now, 35), "yyyy-MM-dd"); // wider range for 1-month avvisi
      const [
        { data: evOggi },
        { data: scOggi },
        { data: evFuturi },
        { data: scSettimana },
        { data: scScadute },
        { data: puntiConData },
        { data: notePostitData },
        { data: scFutureAvvisi },
      ] = await Promise.all([
        (supabase as any).from("eventi_calendario").select("*").eq("user_id", user.id).eq("data", oggi).order("ora_inizio"),
        supabase.from("scadenze").select("*, pratiche(titolo)").eq("data_scadenza", oggi).eq("completata", false),
        (supabase as any).from("eventi_calendario").select("*").eq("user_id", user.id).gt("data", oggi).lte("data", fineMeseAvvisi),
        supabase.from("scadenze").select("*, pratiche(titolo)").gt("data_scadenza", oggi).lte("data_scadenza", fineSettimana).eq("completata", false).order("data_scadenza"),
        supabase.from("scadenze").select("*, pratiche(titolo)").lt("data_scadenza", oggi).eq("completata", false).order("data_scadenza"),
        supabase.from("punti_situazione").select("*, pratiche(titolo, colore)").eq("completata", false).gte("data", oggi).lte("data", fineSettimana).order("data"),
        (supabase as any).from("note_giornaliere_postit").select("*").eq("user_id", user.id).eq("data", oggi).order("ordine"),
        supabase.from("scadenze").select("*, pratiche(titolo)").gt("data_scadenza", oggi).lte("data_scadenza", fineMeseAvvisi).eq("completata", false),
      ]);

      setEventiOggi((evOggi as EventoCalendario[]) || []);
      setScadenzeOggi((scOggi as Scadenza[]) || []);
      setScadenzeScadute((scScadute as Scadenza[]) || []);
      setNotePostit((notePostitData as NotaGiornalieraPostit[]) || []);

      const allFuture = (evFuturi as EventoCalendario[]) || [];
      const allFutureScadenze = ((scFutureAvvisi as any[]) || []) as Scadenza[];
      setAvvisiOggi(getAvvisiPerOggi(allFuture, allFutureScadenze, oggi));
      // Filter eventi to only week range for the week section
      const eventiInSettimana = allFuture.filter(e => e.data <= fineSettimana);
      setEventiSettimana(eventiInSettimana);
      setScadenzeSettimana((scSettimana as Scadenza[]) || []);

      const allPunti = ((puntiConData as any[]) || []).map((p: any) => ({
        ...p,
        pratica_titolo: p.pratiche?.titolo,
        pratica_colore: p.pratiche?.colore,
      }));
      setPuntiOggi(allPunti.filter((p: any) => p.data === oggi));
      setPuntiSettimana(allPunti.filter((p: any) => p.data !== oggi));
    }
    load();
  }, []);

  // Post-it handlers
  const addPostit = async () => {
    if (!userId || !newNota.trim()) return;
    const { data } = await (supabase as any).from("note_giornaliere_postit").insert({
      user_id: userId,
      data: oggi,
      testo: newNota.trim(),
      colore: newNotaColore,
      ordine: notePostit.length,
    }).select().single();
    if (data) {
      setNotePostit(prev => [...prev, data as NotaGiornalieraPostit]);
      setNewNota("");
    }
  };

  const updatePostit = async (id: string, newText: string) => {
    await (supabase as any).from("note_giornaliere_postit").update({ testo: newText }).eq("id", id);
    setNotePostit(prev => prev.map(n => n.id === id ? { ...n, testo: newText } : n));
  };

  const deletePostit = async (id: string) => {
    await (supabase as any).from("note_giornaliere_postit").delete().eq("id", id);
    setNotePostit(prev => prev.filter(n => n.id !== id));
  };

  const reorderPostit = async (reordered: { id: string; testo: string; colore: string }[]) => {
    const updated = reordered.map((n, i) => ({ ...notePostit.find(x => x.id === n.id)!, ordine: i }));
    setNotePostit(updated);
    await Promise.all(updated.map((n, i) => (supabase as any).from("note_giornaliere_postit").update({ ordine: i }).eq("id", n.id)));
  };

  // Filter out deadline events (colore #ef4444 with id_pratica) to avoid duplicates with scadenze section
  const isDeadlineEvent = (e: EventoCalendario) => e.colore === "#ef4444" && !!e.id_pratica;
  const speseOggi = eventiOggi.filter(isSpesaEvent);
  const eventiRegolariOggi = eventiOggi.filter(e => !isSpesaEvent(e) && !isDeadlineEvent(e));
  const speseSettimana = eventiSettimana.filter(isSpesaEvent);
  const eventiRegolariSettimana = eventiSettimana.filter(e => !isSpesaEvent(e) && !isDeadlineEvent(e));

  const hasToday = scadenzeScadute.length > 0 || eventiRegolariOggi.length > 0 || scadenzeOggi.length > 0 || puntiOggi.length > 0 || speseOggi.length > 0 || avvisiOggi.length > 0;
  const hasWeek = eventiRegolariSettimana.length > 0 || scadenzeSettimana.length > 0 || puntiSettimana.length > 0 || speseSettimana.length > 0;

  return (
    <div className="space-y-4">
      {/* === OGGI === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-accent" />
            Oggi — {format(now, "EEEE dd MMMM", { locale: it })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasToday && notePostit.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nessun impegno per oggi. 🎉</p>
          ) : (
            <div>
              {/* Scadute — collapsible, closed by default */}
              {scadenzeScadute.length > 0 && (
                <Collapsible open={scaduteOpen} onOpenChange={setScaduteOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/15 transition-colors mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-sm font-semibold text-destructive">Scadenze scadute</span>
                    <Badge variant="destructive" className="text-[10px] h-5 min-w-5 justify-center">{scadenzeScadute.length}</Badge>
                    <ChevronDown className={`h-3.5 w-3.5 text-destructive ml-auto transition-transform ${scaduteOpen ? "" : "-rotate-90"}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mb-2">
                    {scadenzeScadute.map(s => (
                      <AgendaItem key={s.id} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} title={s.titolo}
                        subtitle={`Scaduta il ${format(parseISO(s.data_scadenza), "dd MMM", { locale: it })}${s.pratiche ? ` · ${(s.pratiche as any).titolo}` : ""}`}
                        badge={{ label: "Scaduta", color: "#ef4444" }} borderColor="#ef4444"
                        onClick={() => s.id_pratica && navigate(`/pratiche/${s.id_pratica}`)} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Deadline di oggi */}
              <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="Deadline" count={scadenzeOggi.length} />
              {scadenzeOggi.map(s => (
                <AgendaItem key={s.id} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} title={s.titolo}
                  subtitle={s.pratiche ? (s.pratiche as any).titolo : undefined}
                  badge={{ label: "Scadenza", color: "#ef4444" }} borderColor="#ef4444"
                  onClick={() => s.id_pratica && navigate(`/pratiche/${s.id_pratica}`)} />
              ))}

              {/* Cose da fare */}
              <SectionTitle icon={<CheckSquare className="h-4 w-4" />} title="Cose da fare" count={puntiOggi.length} />
              {puntiOggi.map(p => (
                <AgendaItem key={p.id} icon={<CheckSquare className="h-4 w-4" />} title={p.testo}
                  subtitle={p.pratica_titolo ? `Pratica: ${p.pratica_titolo}` : undefined}
                  borderColor={p.pratica_colore || "#94a3b8"}
                  onClick={() => navigate(`/pratiche/${p.id_pratica}`)} />
              ))}

              {/* Eventi */}
              <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="Eventi" count={eventiRegolariOggi.length} />
              {eventiRegolariOggi.map(ev => (
                <AgendaItem key={ev.id} icon={<CalendarDays className="h-4 w-4" />} title={ev.titolo}
                  subtitle={(ev.ora_inizio || ev.ora_fine) ? `${ev.ora_inizio?.slice(0, 5) || ""}${ev.ora_fine ? ` – ${ev.ora_fine.slice(0, 5)}` : ""}` : undefined}
                  borderColor={ev.colore}
                  onClick={ev.id_pratica ? () => navigate(`/pratiche/${ev.id_pratica}`) : undefined} />
              ))}

              {/* Spese / Rate */}
              <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Spese / Rate" count={speseOggi.length} />
              {speseOggi.map(ev => (
                <AgendaItem key={ev.id} icon={<Wallet className="h-4 w-4 text-yellow-600" />} title={ev.titolo.replace("💰 ", "")}
                  borderColor="#eab308" badge={{ label: "Rata", color: "#eab308" }} />
              ))}

              {/* Promemoria */}
              <SectionTitle icon={<Bell className="h-4 w-4" />} title="Promemoria" count={avvisiOggi.length} />
              {avvisiOggi.map((a, i) => (
                <AgendaItem key={`avviso-${i}`} icon={<Bell className="h-4 w-4" />} title={a.evento.titolo}
                  subtitle={`${AVVISO_LABELS[a.tipo_avviso] || a.tipo_avviso} — ${format(parseISO(a.evento.data), "dd MMM", { locale: it })}`}
                  borderColor={a.evento.colore} badge={{ label: "Promemoria" }} />
              ))}
            </div>
          )}

          {/* Note rapide — same pattern as PraticaDettaglio */}
          <div className="mt-4">
            <SectionTitle icon={<StickyNote className="h-4 w-4" />} title="Note rapide" count={notePostit.length} />
            <div className="flex gap-2 mt-2">
              <Input placeholder="Aggiungi una nota..." value={newNota} onChange={e => setNewNota(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addPostit(); }} className="h-8 text-sm flex-1" />
              <div className="flex gap-1 shrink-0">
                {POST_IT_COLORS.map(c => (
                  <button key={c} type="button" className={cn("w-5 h-5 rounded-sm border transition-transform", newNotaColore === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setNewNotaColore(c)} />
                ))}
              </div>
              <Button size="sm" className="h-8" onClick={addPostit} disabled={!newNota.trim()}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="mt-2">
              <DraggablePostItGrid
                notes={notePostit.map(n => ({ id: n.id, testo: n.testo, colore: n.colore }))}
                onReorder={reorderPostit}
                onUpdate={updatePostit}
                onDelete={deletePostit}
                droppableId="dashboard-postit"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === QUESTA SETTIMANA === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarRange className="h-5 w-5 text-accent" />
            Prossimi giorni — fino a {format(addDays(now, 7), "EEEE dd", { locale: it })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasWeek ? (
            <p className="text-sm text-muted-foreground py-2">Nessun impegno in programma questa settimana.</p>
          ) : (
            <div>
              <SectionTitle icon={<AlertTriangle className="h-4 w-4" />} title="Deadline" count={scadenzeSettimana.length} />
              {scadenzeSettimana.map(s => (
                <AgendaItem key={s.id} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} title={s.titolo}
                  subtitle={`${format(parseISO(s.data_scadenza), "EEEE dd MMM", { locale: it })}${s.pratiche ? ` · ${(s.pratiche as any).titolo}` : ""}`}
                  badge={{ label: format(parseISO(s.data_scadenza), "dd/MM"), color: "#ef4444" }} borderColor="#ef4444"
                  onClick={() => s.id_pratica && navigate(`/pratiche/${s.id_pratica}`)} />
              ))}

              <SectionTitle icon={<CheckSquare className="h-4 w-4" />} title="Cose da fare" count={puntiSettimana.length} />
              {puntiSettimana.map(p => (
                <AgendaItem key={p.id} icon={<CheckSquare className="h-4 w-4" />} title={p.testo}
                  subtitle={`${p.data ? format(parseISO(p.data), "EEEE dd MMM", { locale: it }) : ""}${p.pratica_titolo ? ` · ${p.pratica_titolo}` : ""}`}
                  borderColor={p.pratica_colore || "#94a3b8"}
                  onClick={() => navigate(`/pratiche/${p.id_pratica}`)} />
              ))}

              <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="Eventi" count={eventiRegolariSettimana.length} />
              {eventiRegolariSettimana.map(ev => (
                <AgendaItem key={ev.id} icon={<CalendarDays className="h-4 w-4" />} title={ev.titolo}
                  subtitle={`${format(parseISO(ev.data), "EEEE dd MMM", { locale: it })}${ev.ora_inizio ? ` · ${ev.ora_inizio.slice(0, 5)}` : ""}`}
                  borderColor={ev.colore}
                  onClick={ev.id_pratica ? () => navigate(`/pratiche/${ev.id_pratica}`) : undefined} />
              ))}

              <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Spese / Rate" count={speseSettimana.length} />
              {speseSettimana.map(ev => (
                <AgendaItem key={ev.id} icon={<Wallet className="h-4 w-4 text-yellow-600" />} title={ev.titolo.replace("💰 ", "")}
                  subtitle={format(parseISO(ev.data), "EEEE dd MMM", { locale: it })}
                  borderColor="#eab308" badge={{ label: "Rata", color: "#eab308" }} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
