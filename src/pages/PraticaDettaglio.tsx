/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Lock, CalendarIcon, Plus, Trash2, CheckCircle2, Circle, Printer, Pencil, Euro, TrendingDown, TrendingUp, GripVertical, StickyNote, FileText, Bell } from "lucide-react";
import PostItNote from "@/components/PostItNote";
import DraggablePostItGrid from "@/components/DraggablePostItGrid";
import logoNero from "@/assets/logo-scritta-grande.png";
import { logAudit } from "@/lib/audit";
import { format, parseISO, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useStatiPratica } from "@/hooks/use-stati-pratica";
import { useColoriPratica } from "@/hooks/use-colori-pratica";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import type { Pratica, Cliente, TipoPratica, Scadenza, StatoPratica, PuntoDellaSituazione, MovimentoPratica, NotaPratica } from "@/types/database";
import PraticaDocumenti from "@/components/PraticaDocumenti";
import PraticaImmagini from "@/components/PraticaImmagini";

type ScadenzaEntry = { titolo: string; data: Date | undefined };

const POST_IT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];

const AVVISI_OPTIONS = [
  { value: "stesso_giorno", label: "Stesso giorno" },
  { value: "1_giorno_prima", label: "1g prima" },
  { value: "2_giorni_prima", label: "2g prima" },
  { value: "3_giorni_prima", label: "3g prima" },
  { value: "1_settimana_prima", label: "1 sett." },
  { value: "2_settimane_prima", label: "2 sett." },
  { value: "1_mese_prima", label: "1 mese" },
];

export default function PraticaDettaglio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stati, getLabel, getColore } = useStatiPratica();
  const { colori } = useColoriPratica();
  const [pratica, setPratica] = useState<Pratica | null>(null);
  const [scadenzeList, setScadenzeList] = useState<Scadenza[]>([]);
  const [punti, setPunti] = useState<PuntoDellaSituazione[]>([]);
  const [movimenti, setMovimenti] = useState<MovimentoPratica[]>([]);
  const [note, setNote] = useState<NotaPratica[]>([]);
  const [documenti, setDocumenti] = useState<any[]>([]);
  const [immagini, setImmagini] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [tipi, setTipi] = useState<TipoPratica[]>([]);
  const [clienteMode, setClienteMode] = useState<"registrato" | "libero">("registrato");
  const [form, setForm] = useState({
    titolo: "", descrizione: "", id_cliente: "", id_tipo: "", cliente_nome: "",
    privata: false, stato: "aperta" as StatoPratica, colore: "",
    guadagno_preventivato: "0", data_preventivata_fine: "",
  });
  const [newScadenze, setNewScadenze] = useState<ScadenzaEntry[]>([]);

  // Nota pratica modal
  const [notaPraticaOpen, setNotaPraticaOpen] = useState(false);
  const [npTitolo, setNpTitolo] = useState("");
  const [npDescrizione, setNpDescrizione] = useState("");
  const [npCompletata, setNpCompletata] = useState(false);
  const [npData, setNpData] = useState("");
  const [npOraInizio, setNpOraInizio] = useState("");
  const [npOraFine, setNpOraFine] = useState("");
  const [npEditingId, setNpEditingId] = useState<string | null>(null);

  const [newNota, setNewNota] = useState("");
  const [newNotaColore, setNewNotaColore] = useState(POST_IT_COLORS[0]);

  // Movimenti form
  const [movTipo, setMovTipo] = useState<"entrata" | "uscita">("entrata");
  const [movImporto, setMovImporto] = useState("");
  const [movDescrizione, setMovDescrizione] = useState("");
  const [movData, setMovData] = useState(format(new Date(), "yyyy-MM-dd"));

  const [editingScadenza, setEditingScadenza] = useState<string | null>(null);
  const [editScadenzaTitolo, setEditScadenzaTitolo] = useState("");
  const [editScadenzaData, setEditScadenzaData] = useState("");
  const [editScadenzaAvvisi, setEditScadenzaAvvisi] = useState<string[]>([]);
  const [newScadenzaTitolo, setNewScadenzaTitolo] = useState("");
  const [newScadenzaData, setNewScadenzaData] = useState("");
  const [newScadenzaAvvisi, setNewScadenzaAvvisi] = useState<string[]>([]);

  const puntoRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("pratiche").select("*, clienti(*), tipi_pratica(*)").eq("id", id).single();
    if (data) setPratica(data as Pratica);
    const [{ data: sc }, { data: pt }, { data: mv }, { data: nt }, { data: docs }, { data: imgs }] = await Promise.all([
      supabase.from("scadenze").select("*").eq("id_pratica", id).order("data_scadenza", { ascending: true }),
      supabase.from("punti_situazione").select("*").eq("id_pratica", id).order("ordine", { ascending: true }),
      supabase.from("movimenti_pratica").select("*").eq("id_pratica", id).order("data", { ascending: false }),
      supabase.from("note_pratica").select("*").eq("id_pratica", id).order("ordine", { ascending: true }),
      supabase.from("file_pratica").select("*").eq("id_pratica", id).eq("tipo", "documento").order("created_at", { ascending: false }),
      supabase.from("file_pratica").select("*").eq("id_pratica", id).eq("tipo", "immagine").order("created_at", { ascending: false }),
    ]);
    setScadenzeList((sc as Scadenza[]) || []);
    setPunti((pt as PuntoDellaSituazione[]) || []);
    setMovimenti((mv as MovimentoPratica[]) || []);
    setNote((nt as unknown as NotaPratica[]) || []);
    setDocumenti(docs || []);
    setImmagini(imgs || []);
  };

  useEffect(() => { load(); }, [id]);

  const totaleEntrate = movimenti.filter(m => m.tipo === "entrata").reduce((s, m) => s + (m.importo || 0), 0);
  const totaleUscite = movimenti.filter(m => m.tipo === "uscita").reduce((s, m) => s + (m.importo || 0), 0);
  const saldoRimanente = (pratica?.guadagno_preventivato ?? 0) - totaleEntrate;

  const openEdit = async () => {
    if (!pratica) return;
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("clienti").select("*").order("nome_completo"),
      supabase.from("tipi_pratica").select("*").order("label"),
    ]);
    setClienti((c as Cliente[]) || []);
    setTipi((t as TipoPratica[]) || []);
    setClienteMode(pratica.id_cliente ? "registrato" : "libero");
    setForm({
      titolo: pratica.titolo, descrizione: pratica.descrizione || "",
      id_cliente: pratica.id_cliente || "", id_tipo: pratica.id_tipo || "",
      cliente_nome: pratica.cliente_nome || "", privata: pratica.privata,
      stato: pratica.stato, colore: pratica.colore || "",
      guadagno_preventivato: String(pratica.guadagno_preventivato ?? 0),
      data_preventivata_fine: pratica.data_preventivata_fine || "",
    });
    setNewScadenze([]);
    setEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const payload: any = {
      titolo: form.titolo, descrizione: form.descrizione || null,
      id_cliente: clienteMode === "registrato" && form.id_cliente ? form.id_cliente : null,
      cliente_nome: clienteMode === "libero" && form.cliente_nome ? form.cliente_nome : null,
      id_tipo: form.id_tipo || null, privata: form.privata, stato: form.stato,
      colore: form.colore || null,
      guadagno_preventivato: parseFloat(form.guadagno_preventivato) || 0,
      data_preventivata_fine: form.data_preventivata_fine || null,
    };
    const { error } = await supabase.from("pratiche").update(payload).eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }

    const validScadenze = newScadenze.filter(s => s.data);
    if (validScadenze.length > 0) {
      await supabase.from("scadenze").insert(validScadenze.map(s => ({ titolo: s.titolo || form.titolo, data_scadenza: format(s.data!, "yyyy-MM-dd"), id_pratica: id })));
      // Also create calendar events for each deadline
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await (supabase as any).from("eventi_calendario").insert(validScadenze.map(s => ({
          user_id: currentUser.id,
          titolo: `📌 ${s.titolo || form.titolo}`,
          colore: "#ef4444",
          data: format(s.data!, "yyyy-MM-dd"),
          id_pratica: id,
        })));
      }
    }

    await logAudit("Modifica pratica", `Pratica "${form.titolo}" modificata`);
    toast({ title: "Pratica aggiornata" });
    setEditOpen(false);
    load();
  };

  const toggleScadenza = async (s: Scadenza) => { await supabase.from("scadenze").update({ completata: !s.completata }).eq("id", s.id); load(); };

  const addNotaPratica = async () => {
    if (!id || !npTitolo.trim()) return;
    if (npEditingId) {
      await supabase.from("punti_situazione").update({
        testo: npTitolo.trim(), descrizione: npDescrizione.trim() || null,
        completata: npCompletata, data: npData || null,
        ora_inizio: npData && npOraInizio ? npOraInizio : null,
        ora_fine: npData && npOraFine ? npOraFine : null,
      } as any).eq("id", npEditingId);
      toast({ title: "Nota pratica aggiornata" });
    } else {
      const minOrdine = punti.length ? Math.min(...punti.map(p => p.ordine)) - 1 : 0;
      await supabase.from("punti_situazione").insert({
        id_pratica: id, testo: npTitolo.trim(), descrizione: npDescrizione.trim() || null,
        completata: npCompletata, ordine: minOrdine,
        data: npData || null,
        ora_inizio: npData && npOraInizio ? npOraInizio : null,
        ora_fine: npData && npOraFine ? npOraFine : null,
      } as any);
      // If date is set, create calendar event
      if (npData) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("eventi_calendario").insert({
            user_id: user.id,
            titolo: npTitolo.trim(),
            colore: pratica?.colore || "#3b82f6",
            data: npData,
            ora_inizio: npOraInizio || null,
            ora_fine: npOraFine || null,
            id_pratica: id,
          } as any);
        }
      }
      toast({ title: "Nota pratica aggiunta" });
    }
    setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setNpOraInizio(""); setNpOraFine(""); setNpEditingId(null);
    setNotaPraticaOpen(false);
    load();
  };

  const editPunto = (p: PuntoDellaSituazione) => {
    setNpEditingId(p.id);
    setNpTitolo(p.testo);
    setNpDescrizione(p.descrizione || "");
    setNpCompletata(p.completata);
    setNpData(p.data || "");
    setNpOraInizio(p.ora_inizio || "");
    setNpOraFine(p.ora_fine || "");
    setNotaPraticaOpen(true);
  };

  const deletePunto = async (pid: string) => {
    const punto = punti.find(p => p.id === pid);
    // Also delete linked calendar event
    if (punto && id) {
      await (supabase as any).from("eventi_calendario").delete()
        .eq("id_pratica", id)
        .eq("titolo", punto.testo);
    }
    await supabase.from("punti_situazione").delete().eq("id", pid);
    toast({ title: "Nota pratica eliminata" });
    load();
  };

  const togglePunto = async (p: PuntoDellaSituazione) => { await supabase.from("punti_situazione").update({ completata: !p.completata }).eq("id", p.id); load(); };

  const handlePuntiDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(punti);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setPunti(items);
    for (let i = 0; i < items.length; i++) {
      await supabase.from("punti_situazione").update({ ordine: i } as any).eq("id", items[i].id);
    }
  };

  const addMovimento = async () => {
    if (!id || !movImporto) return;
    const { error } = await supabase.from("movimenti_pratica").insert({
      id_pratica: id, tipo: movTipo, importo: parseFloat(movImporto) || 0,
      descrizione: movDescrizione || null, data: movData,
    } as any);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Movimento aggiunto" });
    setMovImporto(""); setMovDescrizione(""); setMovData(format(new Date(), "yyyy-MM-dd"));
    load();
    const newEntrate = movTipo === "entrata" ? totaleEntrate + (parseFloat(movImporto) || 0) : totaleEntrate;
    const newUscite = movTipo === "uscita" ? totaleUscite + (parseFloat(movImporto) || 0) : totaleUscite;
    await supabase.from("pratiche").update({ soldi_presi: newEntrate, spese: newUscite }).eq("id", id);
  };

  const deleteMovimento = async (mid: string) => {
    await supabase.from("movimenti_pratica").delete().eq("id", mid);
    toast({ title: "Movimento eliminato" });
    load();
  };

  const startEditScadenza = (s: Scadenza) => { setEditingScadenza(s.id); setEditScadenzaTitolo(s.titolo); setEditScadenzaData(s.data_scadenza); setEditScadenzaAvvisi(s.avvisi || []); };
  const saveScadenza = async (sid: string) => {
    await supabase.from("scadenze").update({ titolo: editScadenzaTitolo, data_scadenza: editScadenzaData, avvisi: editScadenzaAvvisi } as any).eq("id", sid);
    // Sync calendar: find matching event and update
    const oldScadenza = scadenzeList.find(s => s.id === sid);
    if (oldScadenza) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to update existing calendar event linked to this pratica with similar title
        const { data: calEvents } = await (supabase as any).from("eventi_calendario")
          .select("id")
          .eq("id_pratica", id)
          .like("titolo", `📌 ${oldScadenza.titolo}%`)
          .eq("data", oldScadenza.data_scadenza);
        if (calEvents && calEvents.length > 0) {
          await (supabase as any).from("eventi_calendario").update({
            titolo: `📌 ${editScadenzaTitolo}`, data: editScadenzaData,
          }).eq("id", calEvents[0].id);
        }
      }
    }
    setEditingScadenza(null);
    toast({ title: "Deadline aggiornata" });
    load();
  };
  const deleteScadenza = async (sid: string) => {
    const scadenza = scadenzeList.find(s => s.id === sid);
    // Also delete linked calendar event
    if (scadenza && id) {
      await (supabase as any).from("eventi_calendario").delete()
        .eq("id_pratica", id)
        .like("titolo", `📌 ${scadenza.titolo}%`)
        .eq("data", scadenza.data_scadenza);
    }
    await supabase.from("scadenze").delete().eq("id", sid);
    toast({ title: "Deadline eliminata" });
    load();
  };

  const addScadenzaInline = async () => {
    if (!id || !newScadenzaData) return;
    // Create deadline with avvisi
    await supabase.from("scadenze").insert({ titolo: newScadenzaTitolo || pratica?.titolo || "Deadline", data_scadenza: newScadenzaData, id_pratica: id, avvisi: newScadenzaAvvisi } as any);
    // Also create calendar event with red color
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("eventi_calendario").insert({
        user_id: user.id,
        titolo: `📌 ${newScadenzaTitolo || pratica?.titolo || "Deadline"}`,
        colore: "#ef4444",
        data: newScadenzaData,
        id_pratica: id,
      } as any);
    }
    setNewScadenzaTitolo(""); setNewScadenzaData(""); setNewScadenzaAvvisi([]); toast({ title: "Deadline aggiunta" }); load();
  };

  const addNota = async () => {
    if (!id || !newNota.trim()) return;
    await supabase.from("note_pratica").insert({ id_pratica: id, testo: newNota.trim(), colore: newNotaColore } as any);
    setNewNota(""); toast({ title: "Nota aggiunta" }); load();
  };

  const updateNota = async (nid: string, newText: string) => {
    await supabase.from("note_pratica").update({ testo: newText } as any).eq("id", nid);
    toast({ title: "Nota aggiornata" }); load();
  };

  const deleteNota = async (nid: string) => {
    await supabase.from("note_pratica").delete().eq("id", nid);
    toast({ title: "Nota eliminata" }); load();
  };

  const handlePrint = () => { window.print(); };
  const getClientName = (p: Pratica) => p.clienti?.nome_completo || p.cliente_nome || "—";

  if (!pratica) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Caricamento...</p></div>;

  const dataFinStimata = pratica.data_preventivata_fine || format(addMonths(parseISO(pratica.created_at), 4), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { margin: 15mm 12mm; size: A4; }
          body * { visibility: hidden; }
          .print-pratica, .print-pratica * { visibility: visible; }
          .print-pratica { position: absolute; left: 0; top: 0; width: 100%; padding: 0; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000 !important; }
          .no-print { display: none !important; }
          .print-pratica .print-header { display: flex !important; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
          .print-pratica .print-header-logo img { height: 40px; width: auto; }
          .print-pratica .print-header-date { font-size: 16px; font-weight: 700; }
          .print-pratica .print-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; }
          .print-pratica table { border-collapse: collapse; width: 100%; font-size: 10px; }
          .print-pratica th { background: #f5f5f5 !important; print-color-adjust: exact; font-weight: 600; text-transform: uppercase; font-size: 9px; padding: 5px 8px; border: 0.5px solid #bbb; text-align: left; }
          .print-pratica td { padding: 4px 8px; border: 0.5px solid #ddd; font-size: 10px; vertical-align: top; }
          .print-pratica .print-detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; font-size: 10px; margin-bottom: 12px; }
          .print-pratica .print-detail-item label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; color: #777; display: block; }
          .print-pratica .print-detail-item span { font-size: 11px; font-weight: 500; }
          .print-pratica [class*="card"] { border: none !important; box-shadow: none !important; padding: 0 !important; }
          .print-pratica .print-note { print-color-adjust: exact; -webkit-print-color-adjust: exact; border-radius: 6px; padding: 8px; font-size: 10px; break-inside: avoid; }
        }
      `}</style>

      <div className="flex items-center gap-3 no-print">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {pratica.colore && <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: pratica.colore }} />}
            {pratica.titolo} {pratica.privata && <Lock className="h-5 w-5 text-muted-foreground" />}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Creata il {format(parseISO(pratica.created_at), "dd MMMM yyyy", { locale: it })}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-10" onClick={handlePrint}><Printer className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline"> Stampa</span></Button>
          <Button className="h-10" onClick={openEdit}><Edit className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline"> Modifica</span></Button>
        </div>
      </div>

      <div className="print-pratica">
        <div className="hidden print:flex print-header">
          <div className="print-header-logo"><img src={logoNero} alt="Studio Tecnico Ferrante" /></div>
          <div className="print-header-date">{format(new Date(), "dd/MM/yyyy")}</div>
        </div>
        <div className="hidden print:block" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{pratica.titolo}</h2>
        </div>
        <div className="hidden print:grid print-detail-grid">
          <div className="print-detail-item"><label>Stato</label><span>{getLabel(pratica.stato)}</span></div>
          <div className="print-detail-item"><label>Tipo</label><span>{pratica.tipi_pratica?.label || "—"}</span></div>
          <div className="print-detail-item"><label>Cliente</label><span>{getClientName(pratica)}</span></div>
          <div className="print-detail-item"><label>Data creazione</label><span>{format(parseISO(pratica.created_at), "dd/MM/yyyy")}</span></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Dettagli */}
            <Card className="print:hidden">
              <CardHeader><CardTitle>Dettagli</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Stato</p>
                    <Badge variant="outline" className="mt-1 text-xs" style={{ borderColor: getColore(pratica.stato), color: getColore(pratica.stato), backgroundColor: `${getColore(pratica.stato)}15` }}>{getLabel(pratica.stato)}</Badge>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Tipo</p><p className="text-sm font-medium mt-1">{pratica.tipi_pratica?.label || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Cliente</p><p className="text-sm font-medium mt-1">{getClientName(pratica)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Data creazione</p><p className="text-sm font-medium mt-1">{format(parseISO(pratica.created_at), "dd/MM/yyyy")}</p></div>
                </div>
                {pratica.descrizione && <div><p className="text-xs text-muted-foreground mb-1">Descrizione</p><p className="text-sm">{pratica.descrizione}</p></div>}
              </CardContent>
            </Card>

            {/* Note Post-It */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg"><StickyNote className="h-5 w-5 print:hidden" /> Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 no-print">
                  <Input placeholder="Aggiungi una nota..." value={newNota} onChange={e => setNewNota(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addNota(); }} className="h-8 text-sm flex-1" />
                  <div className="flex gap-1 shrink-0">
                    {POST_IT_COLORS.map(c => (
                      <button key={c} type="button" className={cn("w-5 h-5 rounded-sm border transition-transform", newNotaColore === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setNewNotaColore(c)} />
                    ))}
                  </div>
                  <Button size="sm" className="h-8" onClick={addNota} disabled={!newNota.trim()}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
                <DraggablePostItGrid
                  droppableId="note-pratica"
                  notes={note.map(n => ({ id: n.id, testo: n.testo, colore: n.colore, timestamp: format(parseISO(n.created_at), "dd/MM/yy HH:mm") }))}
                  onUpdate={updateNota}
                  onDelete={deleteNota}
                  onReorder={async (reordered) => {
                    setNote(reordered.map(r => note.find(n => n.id === r.id)!));
                    for (let i = 0; i < reordered.length; i++) {
                      await supabase.from("note_pratica").update({ ordine: i } as any).eq("id", reordered[i].id);
                    }
                  }}
                />
              </CardContent>
            </Card>

            {pratica.descrizione && (
              <div className="hidden print:block" style={{ fontSize: 10, marginBottom: 8 }}><strong>Descrizione:</strong> {pratica.descrizione}</div>
            )}

            {/* Print notes */}
            {note.length > 0 && (
              <div className="hidden print:block">
                <div className="print-section-title">Note</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {note.map(n => (
                    <div key={n.id} className="print-note" style={{ backgroundColor: n.colore }}>
                      <p style={{ fontSize: 10, color: "#333", whiteSpace: "pre-wrap" }}>{n.testo}</p>
                      <p style={{ fontSize: 8, color: "#777", marginTop: 2 }}>{format(parseISO(n.created_at), "dd/MM/yy HH:mm")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nota pratica (ex Punto della Situazione) — BEFORE Deadline */}
            <div ref={puntoRef}>
              <div className="hidden print:block print-section-title">Nota Pratica</div>
              <Card className="print:border-none print:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between print:hidden">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Nota Pratica</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{pratica.titolo} — {getClientName(pratica)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setNpEditingId(null); setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setNotaPraticaOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Aggiungi
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 print:p-0">
                  <div className="print:hidden">
                    {punti.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nessuna nota pratica inserita.</p>
                    ) : (
                      <DragDropContext onDragEnd={handlePuntiDragEnd}>
                        <Droppable droppableId="punti-list">
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="border rounded-lg divide-y">
                              {punti.map((p, idx) => (
                                <Draggable key={p.id} draggableId={p.id} index={idx}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "flex items-start gap-3 px-4 py-3 transition-colors",
                                        p.completata ? "bg-muted/30" : "hover:bg-muted/20",
                                        snapshot.isDragging && "bg-accent/10 shadow-md rounded-lg"
                                      )}
                                    >
                                      <div {...provided.dragHandleProps} className="mt-1 cursor-grab shrink-0 text-muted-foreground">
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-medium", p.completata && "line-through text-muted-foreground")}>{p.testo}</p>
                                        {p.descrizione && <p className="text-xs text-muted-foreground mt-0.5">{p.descrizione}</p>}
                                      </div>
                                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                                        {p.data && (
                                          <span className="text-[11px] font-medium text-primary whitespace-nowrap">
                                            <CalendarIcon className="h-3 w-3 inline mr-0.5" />
                                            {format(parseISO(p.data), "dd/MM/yyyy")}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(parseISO(p.created_at), "dd/MM/yy")}</span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editPunto(p)}><Pencil className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePunto(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                      </div>
                                      <Checkbox checked={p.completata} onCheckedChange={() => togglePunto(p)} className="mt-0.5" />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </div>
                  <div className="hidden print:block">
                    {punti.length > 0 && (
                      <table><thead><tr><th style={{ width: 30 }}></th><th>Titolo</th><th>Descrizione</th><th style={{ width: 80 }}>Data</th></tr></thead>
                        <tbody>{punti.map(p => (<tr key={p.id}><td style={{ textAlign: "center" }}>{p.completata ? "✓" : "○"}</td><td style={p.completata ? { textDecoration: "line-through", color: "#999" } : {}}>{p.testo}</td><td style={{ fontSize: 9, color: "#666" }}>{p.descrizione || "—"}</td><td style={{ fontSize: 9 }}>{p.data ? format(parseISO(p.data), "dd/MM/yy") : format(parseISO(p.created_at), "dd/MM/yy")}</td></tr>))}</tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deadline (ex Scadenze) — AFTER Nota Pratica */}
            <Card className="no-print">
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Deadline</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 pb-2 border-b">
                  <Input placeholder="Titolo deadline" value={newScadenzaTitolo} onChange={e => setNewScadenzaTitolo(e.target.value)} className="h-8 text-sm flex-1" />
                  <Input type="date" value={newScadenzaData} onChange={e => setNewScadenzaData(e.target.value)} className="h-8 text-sm w-auto" />
                  <Button size="sm" className="h-8" onClick={addScadenzaInline} disabled={!newScadenzaData}><Plus className="h-3.5 w-3.5 mr-1" /> Aggiungi</Button>
                </div>
                {newScadenzaData && (
                  <div className="flex items-center gap-2 flex-wrap pb-2 border-b">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {AVVISI_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                        <Checkbox checked={newScadenzaAvvisi.includes(opt.value)} onCheckedChange={(checked) => setNewScadenzaAvvisi(prev => checked ? [...prev, opt.value] : prev.filter(a => a !== opt.value))} className="h-3.5 w-3.5" />
                        <span className="text-xs">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                {scadenzeList.length === 0 && <p className="text-sm text-muted-foreground">Nessuna deadline collegata.</p>}
                <div className="space-y-2">
                  {scadenzeList.map(s => (
                    <div key={s.id} className={cn("flex items-center justify-between p-3 rounded-lg border", s.completata ? "bg-success/5 border-success/20" : "bg-card border-border")}>
                      {editingScadenza === s.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input value={editScadenzaTitolo} onChange={e => setEditScadenzaTitolo(e.target.value)} className="h-8 text-sm" />
                            <Input type="date" value={editScadenzaData} onChange={e => setEditScadenzaData(e.target.value)} className="h-8 text-sm w-auto" />
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" className="h-8" onClick={() => saveScadenza(s.id)}>Salva</Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingScadenza(null)}>Annulla</Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {AVVISI_OPTIONS.map(opt => (
                              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                                <Checkbox checked={editScadenzaAvvisi.includes(opt.value)} onCheckedChange={(checked) => setEditScadenzaAvvisi(prev => checked ? [...prev, opt.value] : prev.filter(a => a !== opt.value))} className="h-3.5 w-3.5" />
                                <span className="text-xs">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleScadenza(s)} className="shrink-0">
                              {s.completata ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                            </button>
                            <div>
                              <p className={cn("text-sm font-medium", s.completata && "line-through text-muted-foreground")}>{s.titolo}</p>
                              <p className="text-xs text-muted-foreground">{format(parseISO(s.data_scadenza), "dd MMMM yyyy", { locale: it })}</p>
                              {s.avvisi && s.avvisi.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Bell className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">{s.avvisi.length} avvis{s.avvisi.length === 1 ? "o" : "i"}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditScadenza(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteScadenza(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Print deadline */}
            <div className="hidden print:block">
              <div className="print-section-title">Deadline</div>
              {scadenzeList.length > 0 ? (
                <table><thead><tr><th>Titolo</th><th style={{ width: 100 }}>Data</th><th style={{ width: 50 }}>Stato</th></tr></thead>
                  <tbody>{scadenzeList.map(s => (<tr key={s.id}><td style={s.completata ? { textDecoration: "line-through", color: "#999" } : {}}>{s.titolo}</td><td style={{ fontSize: 9 }}>{format(parseISO(s.data_scadenza), "dd/MM/yyyy")}</td><td style={{ textAlign: "center" }}>{s.completata ? "✓" : "○"}</td></tr>))}</tbody>
                </table>
              ) : <p style={{ fontSize: 10, color: "#999" }}>Nessuna deadline.</p>}
            </div>
          </div>

          {/* Sidebar: Soldi soldi soldi soldi  */}
          <div className="space-y-6 no-print">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">SOLDIII</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <p className="text-[10px] text-muted-foreground uppercase">Preventivato</p>
                    <p className="text-sm font-bold">€{(pratica.guadagno_preventivato ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Data fine stimata</p>
                    <p className="text-sm font-bold">
                      {pratica.data_preventivata_fine ? format(parseISO(pratica.data_preventivata_fine), "dd/MM/yyyy") : (
                        <span className="text-muted-foreground">{format(parseISO(dataFinStimata), "dd/MM/yyyy")} <span className="text-[9px] italic">(auto)</span></span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Spese</span><span className="font-medium text-destructive">€{totaleUscite.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Soldi già presi</span><span className="font-medium text-success">€{totaleEntrate.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm border-t pt-1"><span className="text-muted-foreground font-medium">Saldo rimanente</span><span className={cn("font-bold", saldoRimanente > 0 ? "text-foreground" : "text-success")}>€{saldoRimanente.toFixed(2)}</span></div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Nuovo movimento</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={movTipo === "entrata" ? "default" : "outline"} className={movTipo === "entrata" ? "bg-success hover:bg-success/90 text-success-foreground" : ""} onClick={() => setMovTipo("entrata")}><TrendingUp className="h-3.5 w-3.5 mr-1" /> +</Button>
                    <Button type="button" size="sm" variant={movTipo === "uscita" ? "default" : "outline"} className={movTipo === "uscita" ? "bg-destructive hover:bg-destructive/90" : ""} onClick={() => setMovTipo("uscita")}><TrendingDown className="h-3.5 w-3.5 mr-1" /> −</Button>
                  </div>
                  <Input type="number" step="0.01" min="0" placeholder="Importo (€)" value={movImporto} onChange={e => setMovImporto(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Descrizione" value={movDescrizione} onChange={e => setMovDescrizione(e.target.value)} className="h-8 text-sm" />
                  <Input type="date" value={movData} onChange={e => setMovData(e.target.value)} className="h-8 text-sm" />
                  <Button size="sm" className="w-full h-9" onClick={addMovimento} disabled={!movImporto}><Plus className="h-3.5 w-3.5 mr-1" /> Aggiungi</Button>
                </div>
                {movimenti.length > 0 && (
                  <div className="border-t pt-2 space-y-1 max-h-[250px] overflow-y-auto">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Movimenti</p>
                    {movimenti.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/30 group">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={cn("font-bold", m.tipo === "entrata" ? "text-success" : "text-destructive")}>{m.tipo === "entrata" ? "+" : "−"}€{m.importo.toFixed(2)}</span>
                          {m.descrizione && <span className="text-muted-foreground truncate">{m.descrizione}</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-muted-foreground">{format(parseISO(m.data), "dd/MM/")}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => deleteMovimento(m.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>



        </div>
      </div>

      {/* Nota pratica modal */}
      <Dialog open={notaPraticaOpen} onOpenChange={setNotaPraticaOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>{npEditingId ? "Modifica Nota Pratica" : "Nuova Nota Pratica"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input placeholder="Titolo della nota..." value={npTitolo} onChange={e => setNpTitolo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrizione <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
              <Textarea placeholder="Descrizione..." value={npDescrizione} onChange={e => setNpDescrizione(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Data <span className="text-muted-foreground text-xs">(opzionale — apparirà nel calendario)</span></Label>
              <Input type="date" value={npData} onChange={e => setNpData(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={npCompletata} onCheckedChange={setNpCompletata} />
              <Label>{npCompletata ? "Fatto" : "Da fare"}</Label>
            </div>
            <Button className="w-full h-12" onClick={addNotaPratica} disabled={!npTitolo.trim()}>{npEditingId ? "Salva Modifiche" : "Aggiungi"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === SEZIONE DOCUMENTI E IMMAGINI ===
         Scommentare le righe seguenti per attivare le sezioni.
         Il database (tabella file_pratica), lo storage (bucket pratica-files),
         i componenti (PraticaDocumenti, PraticaImmagini) e gli stati
         (documenti, immagini) sono già predisposti e pronti all'uso.
      {id && (
        <div className="space-y-4">
          <PraticaDocumenti praticaId={id} files={documenti} onUpdate={load} />
          <PraticaImmagini praticaId={id} files={immagini} onUpdate={load} />
        </div>
      )}
      */}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifica Pratica</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Titolo</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Descrizione</Label><Textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2 mb-2">
                <Button type="button" size="sm" variant={clienteMode === "registrato" ? "default" : "outline"} onClick={() => setClienteMode("registrato")}>Registrato</Button>
                <Button type="button" size="sm" variant={clienteMode === "libero" ? "default" : "outline"} onClick={() => setClienteMode("libero")}>Non registrato</Button>
              </div>
              {clienteMode === "registrato" ? (
                <Select value={form.id_cliente} onValueChange={v => setForm(f => ({ ...f, id_cliente: v }))}><SelectTrigger><SelectValue placeholder="Seleziona cliente" /></SelectTrigger><SelectContent>{clienti.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent></Select>
              ) : (
                <Input placeholder="Nome cliente" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.id_tipo} onValueChange={v => setForm(f => ({ ...f, id_tipo: v }))}><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger><SelectContent>{tipi.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={form.stato} onValueChange={v => setForm(f => ({ ...f, stato: v as StatoPratica }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colore pratica</Label>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center text-xs ${!form.colore ? "border-foreground scale-110" : "border-muted"}`}
                  onClick={() => setForm(f => ({ ...f, colore: "" }))}>—</button>
                {colori.map(c => (
                  <button key={c.id} type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${form.colore === c.colore ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.colore }} onClick={() => setForm(f => ({ ...f, colore: c.colore }))} title={c.label} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.privata} onCheckedChange={v => setForm(f => ({ ...f, privata: v }))} /><Label>Pratica privata</Label></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" /> Preventivato (€)</Label><Input type="number" step="0.01" min="0" value={form.guadagno_preventivato} onChange={e => setForm(f => ({ ...f, guadagno_preventivato: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Data fine stimata</Label><Input type="date" value={form.data_preventivata_fine} onChange={e => setForm(f => ({ ...f, data_preventivata_fine: e.target.value }))} /></div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Nuove Deadline</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setNewScadenze(p => [...p, { titolo: "", data: undefined }])}><Plus className="h-3 w-3 mr-1" /> Aggiungi</Button>
              </div>
              {newScadenze.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input placeholder={`Titolo (default: ${form.titolo || "titolo pratica"})`} value={s.titolo} onChange={e => setNewScadenze(p => p.map((x, i) => i === idx ? { ...x, titolo: e.target.value } : x))} />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !s.data && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{s.data ? format(s.data, "dd/MM/yyyy") : "Seleziona data"}</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={s.data} onSelect={d => setNewScadenze(p => p.map((x, i) => i === idx ? { ...x, data: d } : x))} locale={it} className="p-3 pointer-events-auto" /></PopoverContent>
                    </Popover>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => setNewScadenze(p => p.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full h-12">Salva Modifiche</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
