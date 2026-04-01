/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Printer, Mail, Phone, FileText, Edit, Trash2, Plus, X, StickyNote } from "lucide-react";
import PostItNote from "@/components/PostItNote";
import DraggablePostItGrid from "@/components/DraggablePostItGrid";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useStatiPratica } from "@/hooks/use-stati-pratica";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import logoNero from "@/assets/logo-scritta-grande.png";
import type { Cliente, Pratica, PuntoDellaSituazione } from "@/types/database";

const POST_IT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];

type PraticaWithPunti = Pratica & { punti_attivi: PuntoDellaSituazione[] };

export default function ClienteDettaglio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getLabel, getColore } = useStatiPratica();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pratiche, setPratiche] = useState<PraticaWithPunti[]>([]);
  const [note, setNote] = useState<{ id: string; testo: string; colore: string }[]>([]);
  const [newNota, setNewNota] = useState("");
  const [newNotaColore, setNewNotaColore] = useState(POST_IT_COLORS[0]);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nome_completo: "", p_iva_cf: "", email: "", telefono: "", note: "" });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadAll();
  }, [id]);

  const loadAll = async () => {
    if (!id) return;
    const { data: c } = await supabase.from("clienti").select("*").eq("id", id).single();
    setCliente(c as Cliente);

    const { data: p } = await supabase
      .from("pratiche")
      .select("*, tipi_pratica(*)")
      .eq("id_cliente", id)
      .order("created_at", { ascending: false });

    const praticheRaw = (p as Pratica[]) || [];
    const withPunti: PraticaWithPunti[] = [];
    for (const pr of praticheRaw) {
      const { data: punti } = await supabase
        .from("punti_situazione")
        .select("*")
        .eq("id_pratica", pr.id)
        .eq("completata", false)
        .order("ordine", { ascending: true });
      withPunti.push({ ...pr, punti_attivi: (punti || []) as PuntoDellaSituazione[] });
    }
    setPratiche(withPunti);

    const { data: noteData } = await (supabase as any).from("note_cliente")
      .select("*")
      .eq("id_cliente", id)
      .order("ordine", { ascending: true });
    setNote((noteData as any[]) || []);
  };

  const praticheAperte = pratiche.filter(p => p.stato !== "chiusa");
  const praticheChiuse = pratiche.filter(p => p.stato === "chiusa");

  const handleEdit = () => {
    if (!cliente) return;
    setEditForm({
      nome_completo: cliente.nome_completo,
      p_iva_cf: cliente.p_iva_cf || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      note: cliente.note || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!id || !editForm.nome_completo.trim()) return;
    const { error } = await supabase.from("clienti").update({
      nome_completo: editForm.nome_completo.trim(),
      p_iva_cf: editForm.p_iva_cf.trim() || null,
      email: editForm.email.trim() || null,
      telefono: editForm.telefono.trim() || null,
      note: editForm.note.trim() || null,
    }).eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    await logAudit("modifica_cliente", `Cliente: ${editForm.nome_completo}`);
    toast({ title: "Cliente aggiornato" });
    setEditOpen(false);
    loadAll();
  };

  const handleDelete = async () => {
    if (!id || !cliente) return;
    const { error } = await supabase.from("clienti").delete().eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    await logAudit("elimina_cliente", `Cliente: ${cliente.nome_completo}`);
    toast({ title: "Cliente eliminato" });
    navigate("/clienti");
  };

  const handleAddNota = async () => {
    if (!id || !newNota.trim()) return;
    const { error } = await (supabase as any).from("note_cliente").insert({ id_cliente: id, testo: newNota.trim(), colore: newNotaColore });
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    setNewNota("");
    loadAll();
  };

  const handleDeleteNota = async (notaId: string) => {
    await (supabase as any).from("note_cliente").delete().eq("id", notaId);
    loadAll();
  };

  const handleUpdateNota = async (notaId: string, newText: string) => {
    await (supabase as any).from("note_cliente").update({ testo: newText }).eq("id", notaId);
    loadAll();
  };

  if (!cliente) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Caricamento...</p></div>;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { margin: 15mm 12mm; size: A4; }
          body * { visibility: hidden; }
          .print-cliente, .print-cliente * { visibility: visible; }
          .print-cliente { position: absolute; left: 0; top: 0; width: 100%; padding: 0; color: #000 !important; font-family: 'Inter', sans-serif; }
          .no-print { display: none !important; }
          .print-cliente .print-header-logo img { height: 40px; width: auto; }
          .print-cliente table { border-collapse: collapse; width: 100%; font-size: 10px; }
          .print-cliente th { background: #f5f5f5 !important; print-color-adjust: exact; font-weight: 600; text-transform: uppercase; font-size: 9px; padding: 5px 8px; border: 0.5px solid #bbb; text-align: left; }
          .print-cliente td { padding: 4px 8px; border: 0.5px solid #ddd; font-size: 10px; }
        }
      `}</style>

      <div className="no-print space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{cliente.nome_completo}</h1>
            <p className="text-muted-foreground text-sm mt-1">Scheda cliente</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" /> Modifica
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Elimina
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Stampa
          </Button>
        </div>
      </div>

      <div className="print-cliente">
        <div className="hidden print:flex items-center justify-between" style={{ borderBottom: "2px solid #000", paddingBottom: 8, marginBottom: 16 }}>
          <div className="print-header-logo"><img src={logoNero} alt="Studio Tecnico Ferrante" /></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: "right" as const }}>{cliente.nome_completo}</div>
            <div style={{ fontSize: 10, color: "#555", textAlign: "right" as const }}>Stampato il {format(new Date(), "dd/MM/yyyy 'alle' HH:mm")}</div>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Informazioni</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cliente.p_iva_cf && (
                <div><p className="text-xs text-muted-foreground">P.IVA / CF</p><p className="text-sm font-medium mt-1 flex items-center gap-2"><FileText className="h-3.5 w-3.5 print:hidden" /> {cliente.p_iva_cf}</p></div>
              )}
              {cliente.email && (
                <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium mt-1 flex items-center gap-2"><Mail className="h-3.5 w-3.5 print:hidden" /> {cliente.email}</p></div>
              )}
              {cliente.telefono && (
                <div><p className="text-xs text-muted-foreground">Telefono</p><p className="text-sm font-medium mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 print:hidden" /> {cliente.telefono}</p></div>
              )}
              <div><p className="text-xs text-muted-foreground">Registrato il</p><p className="text-sm font-medium mt-1">{format(parseISO(cliente.created_at), "dd MMMM yyyy", { locale: it })}</p></div>
            </div>
            {cliente.note && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Note</p>
                <p className="text-sm">{cliente.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Post-it notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><StickyNote className="h-5 w-5" /> Note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 no-print">
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
            {note.length > 0 ? (
              <DraggablePostItGrid
                droppableId="note-cliente"
                notes={note.map(n => ({ id: n.id, testo: n.testo, colore: n.colore }))}
                onUpdate={handleUpdateNota}
                onDelete={handleDeleteNota}
                onReorder={async (reordered) => {
                  setNote(reordered.map(r => note.find(n => n.id === r.id)!));
                  for (let i = 0; i < reordered.length; i++) {
                    await (supabase as any).from("note_cliente").update({ ordine: i }).eq("id", reordered[i].id);
                  }
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nessuna nota.</p>
            )}
          </CardContent>
        </Card>

        {/* Pratiche aperte */}
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-lg">Pratiche aperte ({praticheAperte.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {praticheAperte.length > 0 ? (
              <div className="divide-y">
                {praticheAperte.map(p => (
                  <div key={p.id} className="p-4 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => navigate(`/pratiche/${p.id}`)}>
                    <div className="flex items-center gap-2 mb-2">
                      {p.colore && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
                      <span className="font-semibold text-sm">{p.titolo}</span>
                      <Badge variant="outline" className="text-xs ml-auto" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>
                        {getLabel(p.stato)}
                      </Badge>
                    </div>
                    {p.punti_attivi.length > 0 ? (
                      <div className="ml-5 space-y-0.5">
                        {p.punti_attivi.map(punto => (
                          <p key={punto.id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                            {punto.testo}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="ml-5 text-xs text-muted-foreground italic">Nessun punto attivo</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-center text-muted-foreground text-sm">Nessuna pratica aperta.</p>
            )}
          </CardContent>
        </Card>

        {/* Pratiche chiuse */}
        {praticheChiuse.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle className="text-lg text-muted-foreground">Pratiche chiuse ({praticheChiuse.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Titolo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {praticheChiuse.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => navigate(`/pratiche/${p.id}`)}>
                      <td className="p-3 font-medium text-muted-foreground">{p.titolo}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{p.tipi_pratica?.label || "—"}</td>
                      <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">{format(parseISO(p.created_at), "dd/MM/yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifica cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome completo *</Label><Input value={editForm.nome_completo} onChange={e => setEditForm(f => ({ ...f, nome_completo: e.target.value }))} /></div>
            <div><Label>P.IVA / CF</Label><Input value={editForm.p_iva_cf} onChange={e => setEditForm(f => ({ ...f, p_iva_cf: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Telefono</Label><Input value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} /></div>
            <div><Label>Note</Label><Textarea value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} /></div>
            <Button className="w-full h-12" onClick={handleSaveEdit} disabled={!editForm.nome_completo.trim()}>Salva modifiche</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[95vw] sm:max-w-sm">
          <DialogHeader><DialogTitle>Elimina cliente</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Sei sicuro di voler eliminare <strong>{cliente.nome_completo}</strong>? Questa azione non può essere annullata.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Annulla</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Elimina</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
