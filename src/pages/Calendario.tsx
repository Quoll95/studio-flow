/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Bell, StickyNote, Edit } from "lucide-react";
import TimePicker from "@/components/TimePicker";
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, isSameMonth } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DraggablePostItGrid from "@/components/DraggablePostItGrid";
import type { Scadenza, EventoCalendario, Pratica, NotaGiornalieraPostit } from "@/types/database";

const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const COLORI = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

const POST_IT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];

const AVVISI_OPTIONS = [
  { value: "stesso_giorno", label: "Stesso giorno" },
  { value: "1_giorno_prima", label: "1 giorno prima" },
  { value: "2_giorni_prima", label: "2 giorni prima" },
  { value: "3_giorni_prima", label: "3 giorni prima" },
  { value: "1_settimana_prima", label: "1 settimana prima" },
  { value: "2_settimane_prima", label: "2 settimane prima" },
  { value: "1_mese_prima", label: "1 mese prima" },
];

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scadenze, setScadenze] = useState<Scadenza[]>([]);
  const [eventi, setEventi] = useState<EventoCalendario[]>([]);
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({ titolo: "", descrizione: "", colore: "#3b82f6", data: "", ora_inizio: "", ora_fine: "", id_pratica: "", avvisi: [] as string[], tipo_pratica_link: "evento" as "evento" | "nota_pratica" | "deadline" });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Post-it notes for day view
  const [dayPostits, setDayPostits] = useState<NotaGiornalieraPostit[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  // Track which days have post-it notes (for month/week indicators)
  const [daysWithNotes, setDaysWithNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    supabase.from("pratiche").select("id, titolo, colore").order("titolo").then(({ data }) => {
      setPratiche((data as Pratica[]) || []);
    });
  }, []);

  useEffect(() => {
    async function load() {
      let start: string, end: string;
      if (view === "month") {
        start = format(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), "yyyy-MM-dd");
        end = format(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), "yyyy-MM-dd");
      } else if (view === "week") {
        start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
        end = format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
      } else {
        start = format(currentDate, "yyyy-MM-dd");
        end = format(currentDate, "yyyy-MM-dd");
      }

      const { data: ev } = await (supabase as any).from("eventi_calendario").select("*, pratiche(titolo, id, colore)").gte("data", start).lte("data", end).order("ora_inizio");
      setScadenze([]);
      setEventi((ev as any[])?.map((e: any) => ({ ...e, avvisi: e.avvisi || [] })) as EventoCalendario[] || []);

      // Load post-it note indicators for month/week views
      if (userId && (view === "month" || view === "week")) {
        const { data: noteDays } = await (supabase as any)
          .from("note_giornaliere_postit")
          .select("data")
          .eq("user_id", userId)
          .gte("data", start)
          .lte("data", end);
        const set = new Set<string>();
        (noteDays || []).forEach((n: any) => set.add(n.data));
        setDaysWithNotes(set);
      }
    }
    load();
  }, [currentDate, view, userId]);

  // Load post-it notes for day view
  useEffect(() => {
    if (view !== "day" || !userId) return;
    const dateStr = format(currentDate, "yyyy-MM-dd");
    (supabase as any).from("note_giornaliere_postit")
      .select("*")
      .eq("user_id", userId)
      .eq("data", dateStr)
      .order("ordine")
      .then(({ data }: any) => setDayPostits((data as NotaGiornalieraPostit[]) || []));
  }, [currentDate, view, userId]);

  const navigatePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const navigateNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const getTitle = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy", { locale: it });
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "dd MMM", { locale: it })} – ${format(we, "dd MMM yyyy", { locale: it })}`;
    }
    return format(currentDate, "EEEE dd MMMM yyyy", { locale: it });
  };

  const getScadenzeForDay = (day: Date) => scadenze.filter(s => isSameDay(parseISO(s.data_scadenza), day));
  const getEventiForDay = (day: Date) => eventi.filter(e => isSameDay(parseISO(e.data), day));

  const handleScadenzaClick = (s: Scadenza) => { if (s.id_pratica) navigate(`/pratiche/${s.id_pratica}`); };

  const handleDayClick = (day: Date) => { setCurrentDate(day); setView("day"); };

  const getEventColor = (ev: EventoCalendario) => {
    if (ev.colore === "#ef4444") return "#ef4444";
    const praticaColore = (ev.pratiche as any)?.colore;
    if (praticaColore && praticaColore !== "#ef4444" && praticaColore !== "#f59e0b") return praticaColore;
    return ev.colore;
  };

  const getScadenzaColor = (_s: Scadenza) => "#ef4444";

  const openNewEvent = (dateStr?: string) => {
    setEditingEventId(null);
    setEventForm({ titolo: "", descrizione: "", colore: "#3b82f6", data: dateStr || format(currentDate, "yyyy-MM-dd"), ora_inizio: "", ora_fine: "", id_pratica: "", avvisi: [], tipo_pratica_link: "evento" });
    setEventDialogOpen(true);
  };

  const isSpesaFissaEvent = (ev: EventoCalendario) => ev.titolo.startsWith("💰");

  const openEditEvent = (ev: EventoCalendario) => {
    if (isSpesaFissaEvent(ev)) {
      toast({ title: "Non modificabile", description: "Le spese fisse vanno modificate dalla sezione Spese Fisse.", variant: "destructive" });
      return;
    }
    setEditingEventId(ev.id);
    // Detect tipo_pratica_link based on event color/content
    let tipo: "evento" | "nota_pratica" | "deadline" = "evento";
    if (ev.colore === "#ef4444" && ev.id_pratica) tipo = "deadline";
    setEventForm({
      titolo: ev.titolo, descrizione: ev.descrizione || "", colore: ev.colore,
      data: ev.data, ora_inizio: ev.ora_inizio || "", ora_fine: ev.ora_fine || "",
      id_pratica: ev.id_pratica || "", avvisi: ev.avvisi || [], tipo_pratica_link: tipo,
    });
    setEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.titolo || !eventForm.data) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const eventPayload: any = {
      user_id: user.id, titolo: eventForm.titolo, descrizione: eventForm.descrizione || null,
      colore: eventForm.colore, data: eventForm.data, ora_inizio: eventForm.ora_inizio || null,
      ora_fine: eventForm.ora_fine || null, id_pratica: eventForm.id_pratica || null, avvisi: eventForm.avvisi,
    };

    if (editingEventId) {
      const { error } = await (supabase as any).from("eventi_calendario").update(eventPayload).eq("id", editingEventId);
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }

      // Sync changes to linked pratica entities (scadenze / punti_situazione)
      if (eventForm.id_pratica) {
        if (eventForm.tipo_pratica_link === "deadline") {
          // Find and update matching scadenza by pratica + old title pattern
          await supabase.from("scadenze")
            .update({ titolo: eventForm.titolo, data_scadenza: eventForm.data })
            .eq("id_pratica", eventForm.id_pratica)
            .eq("titolo", eventi.find(e => e.id === editingEventId)?.titolo || eventForm.titolo);
        } else if (eventForm.tipo_pratica_link === "nota_pratica") {
          await supabase.from("punti_situazione")
            .update({ testo: eventForm.titolo, descrizione: eventForm.descrizione || null, data: eventForm.data || null, ora_inizio: eventForm.ora_inizio || null, ora_fine: eventForm.ora_fine || null } as any)
            .eq("id_pratica", eventForm.id_pratica)
            .eq("testo", eventi.find(e => e.id === editingEventId)?.titolo || eventForm.titolo);
        }
      }

      toast({ title: "Evento aggiornato" });
    } else {
      const { error } = await (supabase as any).from("eventi_calendario").insert(eventPayload);
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }

      // If linked to a pratica, also create nota_pratica or deadline
      if (eventForm.id_pratica && eventForm.tipo_pratica_link === "nota_pratica") {
        await supabase.from("punti_situazione").insert({
          id_pratica: eventForm.id_pratica, testo: eventForm.titolo,
          descrizione: eventForm.descrizione || null, completata: false, ordine: 0,
          data: eventForm.data,
        } as any);
      } else if (eventForm.id_pratica && eventForm.tipo_pratica_link === "deadline") {
        await supabase.from("scadenze").insert({
          titolo: eventForm.titolo, data_scadenza: eventForm.data,
          id_pratica: eventForm.id_pratica,
        });
      }

      toast({ title: "Evento creato" });
    }

    setEventDialogOpen(false);
    setEditingEventId(null);
    // Reload events
    const start = format(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const { data: ev } = await (supabase as any).from("eventi_calendario").select("*, pratiche(titolo, id, colore)").gte("data", start).lte("data", end).order("ora_inizio");
    setEventi((ev as any[])?.map((e: any) => ({ ...e, avvisi: e.avvisi || [] })) as EventoCalendario[] || []);
  };

  const deleteEvent = async (evId: string) => {
    const ev = eventi.find(e => e.id === evId);
    // Also delete linked pratica entities
    if (ev?.id_pratica) {
      if (ev.colore === "#ef4444") {
        // It's a deadline — delete matching scadenza
        const cleanTitle = ev.titolo.replace(/^📌\s*/, "");
        await supabase.from("scadenze").delete()
          .eq("id_pratica", ev.id_pratica)
          .eq("titolo", cleanTitle);
      } else {
        // It may be a nota pratica — delete matching punto_situazione
        await supabase.from("punti_situazione").delete()
          .eq("id_pratica", ev.id_pratica)
          .eq("testo", ev.titolo);
      }
    }
    await supabase.from("eventi_calendario").delete().eq("id", evId);
    setEventi(prev => prev.filter(e => e.id !== evId));
    toast({ title: "Evento eliminato" });
  };

  // Post-it handlers
  const addPostit = async () => {
    if (!userId) return;
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const colore = POST_IT_COLORS[dayPostits.length % POST_IT_COLORS.length];
    const { data, error } = await (supabase as any).from("note_giornaliere_postit").insert({
      user_id: userId, data: dateStr, testo: "", colore, ordine: dayPostits.length,
    }).select().single();
    if (data) setDayPostits(prev => [...prev, data as NotaGiornalieraPostit]);
  };

  const updatePostit = async (id: string, newText: string) => {
    await (supabase as any).from("note_giornaliere_postit").update({ testo: newText }).eq("id", id);
    setDayPostits(prev => prev.map(n => n.id === id ? { ...n, testo: newText } : n));
  };

  const deletePostit = async (id: string) => {
    await (supabase as any).from("note_giornaliere_postit").delete().eq("id", id);
    setDayPostits(prev => prev.filter(n => n.id !== id));
  };

  const reorderPostit = async (reordered: { id: string; testo: string; colore: string }[]) => {
    const updated = reordered.map((n, i) => ({ ...dayPostits.find(x => x.id === n.id)!, ordine: i }));
    setDayPostits(updated);
    await Promise.all(updated.map((n, i) => (supabase as any).from("note_giornaliere_postit").update({ ordine: i }).eq("id", n.id)));
  };

  const renderEventDot = (colore: string, compact = false) => (
    <span className={`inline-block rounded-full shrink-0 ${compact ? "w-2 h-2" : "w-2.5 h-2.5"}`} style={{ backgroundColor: colore }} />
  );

  const renderMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Invece di usare gli spazi vuoti, prendiamo tutta la settimana di inizio e fine
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-px">
        {dayNames.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 hidden sm:block">{d}</div>)}
        {dayNames.map(d => <div key={`m-${d}`} className="text-center text-[10px] font-medium text-muted-foreground py-1 sm:hidden">{d.charAt(0)}</div>)}
        
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dayScadenze = getScadenzeForDay(day);
          const dayEventi = getEventiForDay(day);
          const dayStr = format(day, "yyyy-MM-dd");
          const hasNotes = daysWithNotes.has(dayStr);
          const allItems = [
            ...dayEventi.map(e => ({ type: "evento" as const, colore: getEventColor(e), titolo: e.titolo })),
            ...dayScadenze.map(s => ({ type: "scadenza" as const, colore: getScadenzaColor(s), titolo: s.titolo })),
          ];
          return (
            <div key={day.toISOString()} onClick={() => handleDayClick(day)}
              className={`min-h-[48px] sm:min-h-[80px] md:min-h-[100px] p-1 sm:p-1.5 border rounded-md text-sm cursor-pointer transition-colors ${isToday(day) ? "bg-accent/10 border-accent/30" : "border-transparent hover:bg-muted/30"} ${!isCurrentMonth ? "opacity-50 bg-muted/20" : ""}`}>
              <div className="flex items-center gap-0.5">
                <span className={`text-[10px] sm:text-xs font-medium ${isToday(day) ? "text-accent" : (isCurrentMonth ? "text-muted-foreground" : "text-muted-foreground/60")}`}>{format(day, "d")}</span>
                {hasNotes && <StickyNote className={`h-2.5 w-2.5 ${!isCurrentMonth ? "text-yellow-500/50" : "text-yellow-500"}`} />}
              </div>
              <div className="flex gap-0.5 mt-0.5 flex-wrap sm:hidden">
                {allItems.slice(0, 4).map((item, i) => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.colore }} />)}
              </div>
              <div className="mt-1 space-y-0.5 hidden sm:block">
                {allItems.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-1 truncate">
                    {renderEventDot(item.colore, true)}
                    <span className="text-[10px] truncate">{item.titolo}</span>
                  </div>
                ))}
                {allItems.length > 3 && <span className="text-[10px] text-muted-foreground">+{allItems.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeek = () => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: ws, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
    return (
      <div className="space-y-2">
        {days.map(day => {
          const dayScadenze = getScadenzeForDay(day);
          const dayEventi = getEventiForDay(day);
          const dayStr = format(day, "yyyy-MM-dd");
          const hasNotes = daysWithNotes.has(dayStr);
          return (
            <div key={day.toISOString()} className={`p-3 rounded-lg cursor-pointer ${isToday(day) ? "bg-accent/10 border border-accent/30" : "bg-muted/30 hover:bg-muted/50"}`} onClick={() => handleDayClick(day)}>
              <div className="flex gap-3 sm:gap-4">
                <div className="w-14 sm:w-20 shrink-0">
                  <div className="flex items-center gap-1">
                    <p className={`text-xs sm:text-sm font-semibold capitalize ${isToday(day) ? "text-accent" : ""}`}>{format(day, "EEE", { locale: it })}</p>
                    {hasNotes && <StickyNote className="h-3 w-3 text-yellow-500" />}
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold ${isToday(day) ? "text-accent" : "text-muted-foreground"}`}>{format(day, "d")}</p>
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  {dayEventi.map(ev => (
                    <div key={ev.id} className="flex items-center gap-2 p-2 rounded-md border bg-card text-sm">
                      {renderEventDot(getEventColor(ev))}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ev.titolo}</p>
                        {(ev.pratiche as any)?.titolo && <p className="text-xs text-muted-foreground truncate">📁 {(ev.pratiche as any).titolo}</p>}
                        {(ev.ora_inizio || ev.ora_fine) && <p className="text-xs text-muted-foreground">{ev.ora_inizio?.slice(0, 5) || ""}{ev.ora_fine ? ` – ${ev.ora_fine.slice(0, 5)}` : ""}</p>}
                      </div>
                    </div>
                  ))}
                  {dayScadenze.map(s => (
                    <div key={s.id} onClick={(e) => { e.stopPropagation(); handleScadenzaClick(s); }}
                      className={`cursor-pointer p-2 rounded-md border text-sm ${s.completata ? "bg-success/10 border-success/20 line-through text-success" : "bg-card border-accent/20 hover:bg-accent/5"}`}>
                      <div className="flex items-center gap-2">
                        {renderEventDot(getScadenzaColor(s))}
                        <p className="font-medium truncate">{s.titolo}</p>
                      </div>
                      {s.pratiche && <p className="text-xs text-muted-foreground mt-0.5 ml-4 truncate">Pratica: {(s.pratiche as any).titolo}</p>}
                    </div>
                  ))}
                  {dayEventi.length === 0 && dayScadenze.length === 0 && <p className="text-xs text-muted-foreground italic">Nessun evento</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const dayScadenze = getScadenzeForDay(currentDate);
    const dayEventi = getEventiForDay(currentDate);
    return (
      <div className="space-y-4">
        <div className={`text-center p-4 rounded-lg ${isToday(currentDate) ? "bg-accent/10" : "bg-muted/30"}`}>
          <p className="text-sm text-muted-foreground capitalize">{format(currentDate, "EEEE", { locale: it })}</p>
          <p className={`text-4xl font-bold ${isToday(currentDate) ? "text-accent" : ""}`}>{format(currentDate, "d")}</p>
          <p className="text-sm text-muted-foreground capitalize">{format(currentDate, "MMMM yyyy", { locale: it })}</p>
        </div>
        {dayEventi.length > 0 && (
          <div className="space-y-2">
            {dayEventi.map(ev => (
              <div key={ev.id} className="p-4 rounded-lg border bg-card text-sm" style={{ borderLeftWidth: 4, borderLeftColor: getEventColor(ev) }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{ev.titolo}</p>
                    {(ev.pratiche as any)?.titolo && (
                      <p className="text-xs text-accent mt-0.5 cursor-pointer hover:underline" onClick={() => navigate(`/pratiche/${(ev.pratiche as any).id}`)}>
                        📁 {(ev.pratiche as any).titolo}
                      </p>
                    )}
                    {(ev.ora_inizio || ev.ora_fine) && <p className="text-xs text-muted-foreground mt-0.5">{ev.ora_inizio?.slice(0, 5) || ""}{ev.ora_fine ? ` – ${ev.ora_fine.slice(0, 5)}` : ""}</p>}
                    {ev.descrizione && <p className="text-sm text-muted-foreground mt-1">{ev.descrizione}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!ev.titolo.startsWith("💰") && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEvent(ev)}><Edit className="h-4 w-4" /></Button>}
                    {!ev.titolo.startsWith("💰") && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteEvent(ev.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {dayScadenze.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deadline</p>
            {dayScadenze.map(s => (
              <div key={s.id} onClick={() => handleScadenzaClick(s)}
                className={`cursor-pointer p-4 rounded-lg border text-sm ${s.completata ? "bg-success/10 border-success/20 line-through text-success" : "bg-card border-accent/20 hover:bg-accent/5"}`}
                style={{ borderLeftWidth: 4, borderLeftColor: getScadenzaColor(s) }}>
                <p className="font-semibold">{s.titolo}</p>
                {s.pratiche && <p className="text-sm text-muted-foreground mt-1">Pratica: {(s.pratiche as any).titolo}</p>}
                <Badge variant="outline" className={`mt-2 text-xs ${s.completata ? "bg-success/15 text-success" : "bg-accent/15 text-accent"}`}>
                  {s.completata ? "Completata" : "Da completare"}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {dayEventi.length === 0 && dayScadenze.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nessun evento o scadenza per questo giorno.</p>}

        {/* Post-it notes section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5" /> Note rapide
            </p>
            <Button variant="outline" size="sm" onClick={addPostit}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Nota
            </Button>
          </div>
          {dayPostits.length > 0 ? (
            <DraggablePostItGrid
              notes={dayPostits.map(n => ({ id: n.id, testo: n.testo, colore: n.colore }))}
              onReorder={reorderPostit}
              onUpdate={updatePostit}
              onDelete={deletePostit}
              droppableId="calendar-day-postit"
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Nessuna nota per questo giorno.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <p className="text-muted-foreground text-sm mt-1">Eventi e scadenze</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={navigatePrev}><ChevronLeft className="h-4 w-4" /></Button>
                <CardTitle className="text-base sm:text-lg capitalize min-w-0 text-center">{getTitle()}</CardTitle>
                <Button variant="ghost" size="icon" onClick={navigateNext}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <Button size="sm" onClick={() => openNewEvent()}>
                <Plus className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Evento</span>
              </Button>
            </div>
            <Tabs value={view} onValueChange={v => setView(v as any)} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="month">Mese</TabsTrigger>
                <TabsTrigger value="week">Settimana</TabsTrigger>
                <TabsTrigger value="day">Giorno</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {view === "month" && renderMonth()}
          {view === "week" && renderWeek()}
          {view === "day" && renderDay()}
        </CardContent>
      </Card>

      {/* New Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto top-[7%] translate-y-0 sm:top-[50%] sm:-translate-y-[50%]">
          <DialogHeader><DialogTitle>{editingEventId ? "Modifica Evento" : "Nuovo Evento"}</DialogTitle></DialogHeader>
          <Button className="w-full h-12 sm:flex" onClick={handleSaveEvent} disabled={!eventForm.titolo || !eventForm.data}>{editingEventId ? "Salva Modifiche" : "Crea Evento"}</Button>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input value={eventForm.titolo} onChange={e => setEventForm(f => ({ ...f, titolo: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Pratica collegata</Label>
              <Select value={eventForm.id_pratica} onValueChange={v => {
                const praticaId = v === "none" ? "" : v;
                const pratica = pratiche.find(p => p.id === praticaId);
                setEventForm(f => ({ ...f, id_pratica: praticaId, colore: pratica?.colore || "#3b82f6" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Nessuna pratica" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna pratica</SelectItem>
                  {pratiche.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        {p.colore && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
                        {p.titolo}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {eventForm.id_pratica && !editingEventId && (
              <div className="space-y-2">
                <Label>Tipo collegamento pratica</Label>
                <Select value={eventForm.tipo_pratica_link} onValueChange={v => {
                  const tipo = v as any;
                  const pratica = pratiche.find(p => p.id === eventForm.id_pratica);
                  const colore = tipo === "deadline" ? "#ef4444" : (pratica?.colore || "#3b82f6");
                  setEventForm(f => ({ ...f, tipo_pratica_link: tipo, colore }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evento">Solo evento calendario</SelectItem>
                    <SelectItem value="nota_pratica">Nota pratica (visibile nella pratica)</SelectItem>
                    <SelectItem value="deadline">Deadline (scadenza pratica)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea value={eventForm.descrizione} onChange={e => setEventForm(f => ({ ...f, descrizione: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={eventForm.data} onChange={e => setEventForm(f => ({ ...f, data: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ora inizio</Label>
                <TimePicker ora={eventForm.ora_inizio.split(":")[0] || ""} minuti={eventForm.ora_inizio.split(":")[1] || ""} onOraChange={h => setEventForm(f => ({ ...f, ora_inizio: `${h}:${f.ora_inizio.split(":")[1] || "00"}` }))} onMinutiChange={m => setEventForm(f => ({ ...f, ora_inizio: `${f.ora_inizio.split(":")[0] || "00"}:${m}` }))} disabled={!eventForm.data} />
              </div>
              <div className="space-y-2">
                <Label>Ora fine</Label>
                <TimePicker ora={eventForm.ora_fine.split(":")[0] || ""} minuti={eventForm.ora_fine.split(":")[1] || ""} onOraChange={h => setEventForm(f => ({ ...f, ora_fine: `${h}:${f.ora_fine.split(":")[1] || "00"}` }))} onMinutiChange={m => setEventForm(f => ({ ...f, ora_fine: `${f.ora_fine.split(":")[0] || "00"}:${m}` }))} disabled={!eventForm.data} />
              </div>
            </div>
            {!eventForm.id_pratica && (
            <div className="space-y-2">
              <Label>Colore</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORI.map(c => (
                  <button key={c} type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${eventForm.colore === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} onClick={() => setEventForm(f => ({ ...f, colore: c }))} />
                ))}
              </div>
            </div>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Avvisi</Label>
              <div className="space-y-2">
                {AVVISI_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={eventForm.avvisi.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        setEventForm(f => ({
                          ...f,
                          avvisi: checked
                            ? [...f.avvisi, opt.value]
                            : f.avvisi.filter(a => a !== opt.value),
                        }));
                      }}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full h-12 hidden sm:hidden" onClick={handleSaveEvent} disabled={!eventForm.titolo || !eventForm.data}>{editingEventId ? "Salva Modifiche" : "Crea Evento"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}