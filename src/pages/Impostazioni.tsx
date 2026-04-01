/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings as SettingsIcon, Pencil, Check, X, GripVertical, Palette, Tag, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TipoPratica, StatoPraticaRecord, ColorePratica } from "@/types/database";

type CategoriaSpesa = { id: string; label: string; ordine: number };

export default function Impostazioni() {
  const [tipi, setTipi] = useState<TipoPratica[]>([]);
  const [stati, setStati] = useState<StatoPraticaRecord[]>([]);
  const [colori, setColori] = useState<ColorePratica[]>([]);
  const [categorieSpesa, setCategorieSpesa] = useState<CategoriaSpesa[]>([]);
  const [nuovoTipo, setNuovoTipo] = useState("");
  const [nuovoStatoLabel, setNuovoStatoLabel] = useState("");
  const [nuovoStatoColore, setNuovoStatoColore] = useState("#3b82f6");
  const [editingStato, setEditingStato] = useState<string | null>(null);
  const [editStatoLabel, setEditStatoLabel] = useState("");
  const [editStatoColore, setEditStatoColore] = useState("");
  const [nuovoColoreLabel, setNuovoColoreLabel] = useState("");
  const [nuovoColoreValore, setNuovoColoreValore] = useState("#3b82f6");
  const [editingColore, setEditingColore] = useState<string | null>(null);
  const [editColoreLabel, setEditColoreLabel] = useState("");
  const [editColoreValore, setEditColoreValore] = useState("");
  const [nuovaCategoria, setNuovaCategoria] = useState("");
  const [dailyEmailEnabled, setDailyEmailEnabled] = useState(true);
  const [dailyEmailHour, setDailyEmailHour] = useState("7");
  const { toast } = useToast();

  const load = async () => {
    const [{ data: t }, { data: s }, { data: c }, { data: cat }] = await Promise.all([
      supabase.from("tipi_pratica").select("*").order("label"),
      supabase.from("stati_pratica").select("*").order("ordine"),
      supabase.from("colori_pratica").select("*").order("ordine"),
      (supabase as any).from("categorie_spesa").select("*").order("ordine"),
    ]);
    setTipi((t as TipoPratica[]) || []);
    setStati((s as StatoPraticaRecord[]) || []);
    setColori((c as ColorePratica[]) || []);
    setCategorieSpesa((cat as CategoriaSpesa[]) || []);
  };

  const loadEmailPrefs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any).from("profiles").select("daily_email_enabled, daily_email_hour").eq("id", user.id).single();
    if (data) {
      setDailyEmailEnabled(data.daily_email_enabled ?? true);
      setDailyEmailHour(String(data.daily_email_hour ?? 7));
    }
  };

  useEffect(() => { load(); loadEmailPrefs(); }, []);

  const updateEmailPref = async (field: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("profiles").update({ [field]: value }).eq("id", user.id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else toast({ title: "Preferenza aggiornata" });
  };

  // Tipi handlers
  const handleAddTipo = async () => {
    if (!nuovoTipo.trim()) return;
    const { error } = await supabase.from("tipi_pratica").insert({ label: nuovoTipo.trim() });
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Tipo aggiunto" }); setNuovoTipo(""); load(); }
  };
  const handleDeleteTipo = async (id: string, label: string) => {
    const { error } = await supabase.from("tipi_pratica").delete().eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: `"${label}" rimosso` }); load(); }
  };

  // Stati handlers
  const handleAddStato = async () => {
    if (!nuovoStatoLabel.trim()) return;
    const valore = nuovoStatoLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const maxOrdine = stati.length > 0 ? Math.max(...stati.map(s => s.ordine)) : 0;
    const { error } = await supabase.from("stati_pratica").insert({ label: nuovoStatoLabel.trim(), valore, colore: nuovoStatoColore, ordine: maxOrdine + 1 });
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Stato aggiunto" }); setNuovoStatoLabel(""); setNuovoStatoColore("#3b82f6"); load(); }
  };
  const startEditStato = (s: StatoPraticaRecord) => { setEditingStato(s.id); setEditStatoLabel(s.label); setEditStatoColore(s.colore); };
  const saveEditStato = async (id: string) => {
    if (!editStatoLabel.trim()) return;
    const { error } = await supabase.from("stati_pratica").update({ label: editStatoLabel.trim(), colore: editStatoColore }).eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Stato aggiornato" }); setEditingStato(null); load(); }
  };
  const handleDeleteStato = async (id: string, label: string) => {
    const { error } = await supabase.from("stati_pratica").delete().eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: `"${label}" rimosso` }); load(); }
  };

  // Colori pratica handlers
  const handleAddColore = async () => {
    if (!nuovoColoreLabel.trim()) return;
    const maxOrdine = colori.length > 0 ? Math.max(...colori.map(c => c.ordine)) : 0;
    const { error } = await supabase.from("colori_pratica").insert({ label: nuovoColoreLabel.trim(), colore: nuovoColoreValore, ordine: maxOrdine + 1 });
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Colore aggiunto" }); setNuovoColoreLabel(""); setNuovoColoreValore("#3b82f6"); load(); }
  };
  const startEditColore = (c: ColorePratica) => { setEditingColore(c.id); setEditColoreLabel(c.label); setEditColoreValore(c.colore); };
  const saveEditColore = async (id: string) => {
    if (!editColoreLabel.trim()) return;
    const { error } = await supabase.from("colori_pratica").update({ label: editColoreLabel.trim(), colore: editColoreValore }).eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Colore aggiornato" }); setEditingColore(null); load(); }
  };
  const handleDeleteColore = async (id: string, label: string) => {
    const { error } = await supabase.from("colori_pratica").delete().eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: `"${label}" rimosso` }); load(); }
  };

  // Categorie spesa handlers
  const handleAddCategoria = async () => {
    if (!nuovaCategoria.trim()) return;
    const maxOrdine = categorieSpesa.length > 0 ? Math.max(...categorieSpesa.map(c => c.ordine)) : 0;
    const { error } = await (supabase as any).from("categorie_spesa").insert({ label: nuovaCategoria.trim(), ordine: maxOrdine + 1 });
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Categoria aggiunta" }); setNuovaCategoria(""); load(); }
  };
  const handleDeleteCategoria = async (id: string, label: string) => {
    const { error } = await (supabase as any).from("categorie_spesa").delete().eq("id", id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: `"${label}" rimossa` }); load(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground text-sm mt-1">Configura il gestionale</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Email Giornaliera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5 text-accent" /> Email Giornaliera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-email" className="text-sm">Ricevi riepilogo giornaliero</Label>
              <Switch
                id="daily-email"
                checked={dailyEmailEnabled}
                onCheckedChange={(checked) => {
                  setDailyEmailEnabled(checked);
                  updateEmailPref("daily_email_enabled", checked);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Orario di invio</Label>
              <Select value={dailyEmailHour} onValueChange={(v) => { setDailyEmailHour(v); updateEmailPref("daily_email_hour", parseInt(v)); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => i + 6).map(h => (
                    <SelectItem key={h} value={String(h)}>{`${String(h).padStart(2, "0")}:00`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Riceverai ogni mattina un'email con gli eventi, le scadenze e gli avvisi del giorno. Per attivare l'invio è necessario configurare la API key Resend.
            </p>
          </CardContent>
        </Card>

        {/* Tipi di Pratica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><SettingsIcon className="h-5 w-5 text-accent" /> Tipi di Pratica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nuovo tipo di pratica..." value={nuovoTipo} onChange={e => setNuovoTipo(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddTipo()} />
              <Button onClick={handleAddTipo} size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {tipi.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{t.label}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTipo(t.id, t.label)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stati Pratica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><GripVertical className="h-5 w-5 text-accent" /> Stati delle Pratiche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nome stato (es: Sospesa)" value={nuovoStatoLabel} onChange={e => setNuovoStatoLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddStato()} className="flex-1" />
              <input type="color" value={nuovoStatoColore} onChange={e => setNuovoStatoColore(e.target.value)} className="w-10 h-10 rounded-md border border-input cursor-pointer shrink-0" />
              <Button onClick={handleAddStato} size="icon" disabled={!nuovoStatoLabel.trim()}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {stati.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  {editingStato === s.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input value={editStatoLabel} onChange={e => setEditStatoLabel(e.target.value)} className="h-8 text-sm" onKeyDown={e => e.key === "Enter" && saveEditStato(s.id)} />
                      <input type="color" value={editStatoColore} onChange={e => setEditStatoColore(e.target.value)} className="w-8 h-8 rounded border border-input cursor-pointer shrink-0" />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => saveEditStato(s.id)}><Check className="h-4 w-4 text-success" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingStato(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.colore }} />
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditStato(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteStato(s.id, s.label)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Colori Pratica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Palette className="h-5 w-5 text-accent" /> Colori Pratica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nome colore (es: Urgente)" value={nuovoColoreLabel} onChange={e => setNuovoColoreLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddColore()} className="flex-1" />
              <input type="color" value={nuovoColoreValore} onChange={e => setNuovoColoreValore(e.target.value)} className="w-10 h-10 rounded-md border border-input cursor-pointer shrink-0" />
              <Button onClick={handleAddColore} size="icon" disabled={!nuovoColoreLabel.trim()}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {colori.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  {editingColore === c.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input value={editColoreLabel} onChange={e => setEditColoreLabel(e.target.value)} className="h-8 text-sm" onKeyDown={e => e.key === "Enter" && saveEditColore(c.id)} />
                      <input type="color" value={editColoreValore} onChange={e => setEditColoreValore(e.target.value)} className="w-8 h-8 rounded border border-input cursor-pointer shrink-0" />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => saveEditColore(c.id)}><Check className="h-4 w-4 text-success" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingColore(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.colore }} />
                        <span className="text-sm font-medium">{c.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditColore(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteColore(c.id, c.label)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categorie Spese */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Tag className="h-5 w-5 text-accent" /> Categorie Spese</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nuova categoria..." value={nuovaCategoria} onChange={e => setNuovaCategoria(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddCategoria()} />
              <Button onClick={handleAddCategoria} size="icon" disabled={!nuovaCategoria.trim()}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {categorieSpesa.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{c.label}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoria(c.id, c.label)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
