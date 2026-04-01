import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { useNavigate } from "react-router-dom";
import type { Cliente } from "@/types/database";

const emptyForm = { nome_completo: "", p_iva_cf: "", email: "", telefono: "", note: "" };

export default function Clienti() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [ricerca, setRicerca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await supabase.from("clienti").select("*").order("nome_completo");
    setClienti((data as Cliente[]) || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = clienti.filter(c =>
    c.nome_completo.toLowerCase().includes(ricerca.toLowerCase()) ||
    c.p_iva_cf?.toLowerCase().includes(ricerca.toLowerCase()) ||
    c.email?.toLowerCase().includes(ricerca.toLowerCase())
  );

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditId(c.id);
    setForm({
      nome_completo: c.nome_completo,
      p_iva_cf: c.p_iva_cf || "",
      email: c.email || "",
      telefono: c.telefono || "",
      note: c.note || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome_completo: form.nome_completo,
      p_iva_cf: form.p_iva_cf || null,
      email: form.email || null,
      telefono: form.telefono || null,
      note: form.note || null,
    };

    if (editId) {
      const { error } = await supabase.from("clienti").update(payload).eq("id", editId);
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
      await logAudit("Modifica cliente", `Cliente "${form.nome_completo}" modificato`);
      toast({ title: "Cliente aggiornato" });
    } else {
      const { error } = await supabase.from("clienti").insert(payload);
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
      await logAudit("Creazione cliente", `Cliente "${form.nome_completo}" creato`);
      toast({ title: "Cliente aggiunto" });
    }
    setForm(emptyForm);
    setDialogOpen(false);
    setEditId(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clienti</h1>
          <p className="text-muted-foreground text-sm mt-1">{clienti.length} clienti registrati</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuovo Cliente</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Modifica Cliente" : "Nuovo Cliente"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo / Ragione Sociale</Label>
              <Input value={form.nome_completo} onChange={e => setForm(f => ({ ...f, nome_completo: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>P.IVA / Codice Fiscale</Label>
              <Input value={form.p_iva_cf} onChange={e => setForm(f => ({ ...f, p_iva_cf: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
            </div>
            {editId && (
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            )}
            <Button type="submit" className="w-full h-12">{editId ? "Salva Modifiche" : "Aggiungi Cliente"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca cliente..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">P.IVA / CF</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Telefono</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/clienti/${c.id}`)}>
                    <td className="p-3 font-medium">{c.nome_completo}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{c.p_iva_cf || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{c.email || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{c.telefono || "—"}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => openEdit(c, e)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Nessun cliente trovato.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
