/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Euro, X, StickyNote } from "lucide-react";
import PostItNote from "@/components/PostItNote";
import DraggablePostItGrid from "@/components/DraggablePostItGrid";
import { format, parseISO, addMonths, addWeeks } from "date-fns";

const FREQUENZE = [
  { value: "0", label: "Una tantum" },
  { value: "0.25", label: "Ogni settimana" },
  { value: "0.5", label: "Ogni 2 settimane" },
  { value: "1", label: "Ogni mese" },
  { value: "2", label: "Ogni 2 mesi" },
  { value: "3", label: "Ogni 3 mesi" },
  { value: "6", label: "Ogni 6 mesi" },
  { value: "12", label: "Ogni anno" },
];

const POST_IT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];

type SpesaFissa = {
  id: string;
  titolo: string;
  importo: number;
  categoria: string;
  data: string;
  frequenza_mesi: number;
  n_rate: number;
  note: string | null;
  user_id: string;
  created_at: string;
};

type Categoria = { id: string; label: string; ordine: number };
type NotaSpese = { id: string; testo: string; colore: string; user_id: string };

const emptyForm = { titolo: "", importo: "0", categoria: "altro", data: "", frequenza_mesi: "0", n_rate: "1", note: "" };

export default function SpeseFisse() {
  const [spese, setSpese] = useState<SpesaFissa[]>([]);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [noteList, setNoteList] = useState<NotaSpese[]>([]);
  const [newNota, setNewNota] = useState("");
  const [newNotaColore, setNewNotaColore] = useState(POST_IT_COLORS[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filtroCategoria, setFiltroCategoria] = useState("tutte");
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const load = async () => {
    const [{ data: sp }, { data: cat }, { data: nt }] = await Promise.all([
      supabase.from("spese_fisse").select("*").order("data", { ascending: false }),
      (supabase as any).from("categorie_spesa").select("*").order("ordine"),
      (supabase as any).from("note_spese").select("*").order("ordine", { ascending: true }),
    ]);
    setSpese((sp as SpesaFissa[]) || []);
    setCategorie((cat as Categoria[]) || []);
    setNoteList((nt as NotaSpese[]) || []);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const filtered = filtroCategoria === "tutte" ? spese : spese.filter(s => s.categoria === filtroCategoria.toLowerCase());
  const totale = filtered.reduce((s, sp) => s + sp.importo * (sp.n_rate || 1), 0);

  const getFrequenzaLabel = (mesi: number) => FREQUENZE.find(f => f.value === String(mesi))?.label || (mesi > 0 ? `Ogni ${mesi} mesi` : "Una tantum");

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, data: format(new Date(), "yyyy-MM-dd") });
    setDialogOpen(true);
  };

  const openEdit = (s: SpesaFissa) => {
    setEditId(s.id);
    setForm({
      titolo: s.titolo,
      importo: String(s.importo),
      categoria: s.categoria,
      data: s.data,
      frequenza_mesi: String(s.frequenza_mesi),
      n_rate: String(s.n_rate || 1),
      note: s.note || "",
    });
    setDialogOpen(true);
  };

  const createCalendarEvents = async (userId: string, titolo: string, data: string, frequenzaMesi: number, nRate: number, importo: number) => {
    const GIALLO = "#eab308";
    const events = [];
    const baseDate = parseISO(data);

    if (frequenzaMesi === 0) {
      // Una tantum - single event
      events.push({
        titolo: `💰 ${titolo} — €${importo.toFixed(2)}`,
        data,
        colore: GIALLO,
        user_id: userId,
      });
    } else {
      // Recurring - create n_rate events
      for (let i = 0; i < nRate; i++) {
        let eventDate: Date;
        if (frequenzaMesi === 0.25) {
          eventDate = addWeeks(baseDate, i);
        } else if (frequenzaMesi === 0.5) {
          eventDate = addWeeks(baseDate, i * 2);
        } else {
          eventDate = addMonths(baseDate, i * frequenzaMesi);
        }
        events.push({
          titolo: `💰 ${titolo} (${i + 1}/${nRate}) — €${importo.toFixed(2)}`,
          data: format(eventDate, "yyyy-MM-dd"),
          colore: GIALLO,
          user_id: userId,
        });
      }
    }

    if (events.length > 0) {
      await supabase.from("eventi_calendario").insert(events);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const frequenzaMesi = parseFloat(form.frequenza_mesi) || 0;
    const nRate = frequenzaMesi > 0 ? Math.max(1, parseInt(form.n_rate) || 1) : 1;
    const importo = parseFloat(form.importo) || 0;

    const payload: any = {
      titolo: form.titolo,
      importo,
      categoria: form.categoria.toLowerCase(),
      data: form.data,
      frequenza_mesi: frequenzaMesi,
      n_rate: nRate,
      note: form.note || null,
    };

    if (editId) {
      const { error } = await supabase.from("spese_fisse").update(payload).eq("id", editId);
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
      // Sync calendar: delete old events and recreate
      const oldSpesa = spese.find(s => s.id === editId);
      if (oldSpesa) {
        await supabase.from("eventi_calendario").delete().like("titolo", `💰 ${oldSpesa.titolo}%`);
      }
      await createCalendarEvents(userId, form.titolo, form.data, frequenzaMesi, nRate, importo);
      toast({ title: "Spesa aggiornata e calendario sincronizzato" });
    } else {
      const { error } = await supabase.from("spese_fisse").insert({ ...payload, user_id: userId });
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
      // Create calendar events for new expenses
      await createCalendarEvents(userId, form.titolo, form.data, frequenzaMesi, nRate, importo);
      toast({ title: "Spesa aggiunta e inserita nel calendario" });
    }
    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (id: string, titolo: string) => {
    // Delete associated calendar events for coherence
    await supabase.from("eventi_calendario").delete().like("titolo", `💰 ${titolo}%`);
    await supabase.from("spese_fisse").delete().eq("id", id);
    toast({ title: "Spesa eliminata dal calendario e dai dati" });
    load();
  };

  const handleAddNota = async () => {
    if (!userId || !newNota.trim()) return;
    await (supabase as any).from("note_spese").insert({ testo: newNota.trim(), colore: newNotaColore, user_id: userId });
    setNewNota("");
    load();
  };

  const handleDeleteNota = async (notaId: string) => {
    await (supabase as any).from("note_spese").delete().eq("id", notaId);
    load();
  };

  const handleUpdateNota = async (notaId: string, newText: string) => {
    await (supabase as any).from("note_spese").update({ testo: newText }).eq("id", notaId);
    load();
  };

  const showNRate = parseFloat(form.frequenza_mesi) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spese Fisse</h1>
          <p className="text-muted-foreground text-sm mt-1">Bollette, macchinari e costi ricorrenti</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuova Spesa</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10"><Euro className="h-5 w-5 text-destructive" /></div>
          <div>
            <p className="text-xl font-bold">€{totale.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Totale spese {filtroCategoria !== "tutte" ? `(${filtroCategoria})` : ""}</p>
          </div>
        </CardContent>
      </Card>

      {/* Note generali - post-it */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><StickyNote className="h-5 w-5" /> Note generali</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nuova nota..." value={newNota} onChange={e => setNewNota(e.target.value)} className="flex-1"
              onKeyDown={e => { if (e.key === "Enter") handleAddNota(); }} />
            <div className="flex gap-1 items-center">
              {POST_IT_COLORS.map(c => (
                <button key={c} className={`w-6 h-6 rounded-full border-2 transition-all ${newNotaColore === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} onClick={() => setNewNotaColore(c)} />
              ))}
            </div>
            <Button size="sm" onClick={handleAddNota} disabled={!newNota.trim()}><Plus className="h-4 w-4" /></Button>
          </div>
          {noteList.length > 0 ? (
            <DraggablePostItGrid
              droppableId="note-spese"
              notes={noteList.map(n => ({ id: n.id, testo: n.testo, colore: n.colore }))}
              onUpdate={handleUpdateNota}
              onDelete={handleDeleteNota}
              onReorder={async (reordered) => {
                setNoteList(reordered.map((r, i) => ({ ...noteList.find(n => n.id === r.id)!, ...r })) as NotaSpese[]);
                for (let i = 0; i < reordered.length; i++) {
                  await (supabase as any).from("note_spese").update({ ordine: i }).eq("id", reordered[i].id);
                }
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">Nessuna nota.</p>
          )}
        </CardContent>
      </Card>

      <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="tutte">Tutte le categorie</SelectItem>
          {categorie.map(c => <SelectItem key={c.id} value={c.label.toLowerCase()}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Descrizione</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Frequenza</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Data</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Importo</th>
                <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">Totale</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <p className="font-medium">{s.titolo}</p>
                    <p className="text-xs text-muted-foreground sm:hidden capitalize">
                      {s.categoria} · {getFrequenzaLabel(s.frequenza_mesi)}{s.frequenza_mesi > 0 && s.n_rate > 1 ? ` (${s.n_rate} rate)` : ""} · {format(parseISO(s.data), "dd/MM/yy")}
                    </p>
                  </td>
                  <td className="p-3 text-muted-foreground capitalize hidden sm:table-cell">{s.categoria}</td>
                  <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {getFrequenzaLabel(s.frequenza_mesi)}
                    {s.frequenza_mesi > 0 && s.n_rate > 1 ? ` (${s.n_rate} rate)` : ""}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">{format(parseISO(s.data), "dd/MM/yyyy")}</td>
                  <td className="p-3 text-right font-medium text-destructive">€{s.importo.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium text-destructive hidden sm:table-cell">€{(s.importo * (s.n_rate || 1)).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id, s.titolo)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Nessuna spesa trovata.</p>}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Modifica Spesa" : "Nuova Spesa"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Descrizione</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Importo (€)</Label><Input type="number" step="0.01" min="0" value={form.importo} onChange={e => setForm(f => ({ ...f, importo: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required /></div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categorie.map(c => <SelectItem key={c.id} value={c.label.toLowerCase()}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequenza pagamento</Label>
              <Select value={form.frequenza_mesi} onValueChange={v => setForm(f => ({ ...f, frequenza_mesi: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FREQUENZE.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {showNRate && (
              <div className="space-y-2">
                <Label>Numero rate</Label>
                <Input type="number" min="1" value={form.n_rate} onChange={e => setForm(f => ({ ...f, n_rate: e.target.value }))} />
                <p className="text-xs text-muted-foreground">
                  Verranno create {form.n_rate} scadenze nel calendario (gialle)
                </p>
              </div>
            )}
            <div className="space-y-2"><Label>Note</Label><Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
            <Button type="submit" className="w-full h-12">{editId ? "Salva Modifiche" : "Aggiungi Spesa"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
