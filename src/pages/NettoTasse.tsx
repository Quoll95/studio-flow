/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Calculator, Settings2, CheckCircle2, AlertCircle,
  Euro, Printer, Trash2, Users, Pencil
} from "lucide-react";
import logoNero from "@/assets/logo-scritta-grande.png";

const DEFAULT_CATS: Record<string, { nome: string; minSogg: number; minInt: number; percSogg: number; percInt: number; percTasse: number; coefficiente: number }> = {
  paolo: { nome: "Paolo (geometra)", minSogg: 4240, minInt: 1955, percSogg: 20, percInt: 5, percTasse: 15, coefficiente: 78 },
  sergio: { nome: "Sergio (architetti)", minSogg: 2750, minInt: 835, percSogg: 14.5, percInt: 4, percTasse: 15, coefficiente: 78 },
  roberto: { nome: "Roberto (arch agevolato)", minSogg: 917.66, minInt: 278.33, percSogg: 7.25, percInt: 4, percTasse: 5, coefficiente: 78 },
};

interface CatConfig {
  nome: string;
  fatturato: number;
  minSogg: number;
  minInt: number;
  percSogg: number;
  percInt: number;
  percTasse: number;
  coefficiente: number;
}

interface StoricoRow {
  id: string;
  anno: string;
  paolo_lordo: number; paolo_netto: number; paolo_tasse: number;
  sergio_lordo: number; sergio_netto: number; sergio_tasse: number;
  roberto_lordo: number; roberto_netto: number; roberto_tasse: number;
  totale_famiglia: number;
  paolo_rim_sogg: number; paolo_rim_int: number;
  sergio_rim_sogg: number; sergio_rim_int: number;
  roberto_rim_sogg: number; roberto_rim_int: number;
}

const calcola = (cat: CatConfig) => {
  const F = cat.fatturato;
  if (F <= 0) return null;
  const soggTeorico = F * (cat.percSogg / 100);
  const soggDovuto = Math.max(soggTeorico, cat.minSogg);
  const intTeorico = F * (cat.percInt / 100);
  const intDovuto = Math.max(0, cat.minInt - intTeorico);
  const basePostSogg = F - soggDovuto - intDovuto;
  const imponibile = basePostSogg * (cat.coefficiente / 100);
  const tasse = imponibile * (cat.percTasse / 100);
  const netto = basePostSogg - tasse;
  return {
    F, soggDovuto, intDovuto, tasse, netto, imponibile,
    progSogg: Math.min((soggTeorico / cat.minSogg) * 100, 100),
    progInt: Math.min((intTeorico / cat.minInt) * 100, 100),
  };
};

export default function NettoTasse() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, CatConfig>>({});
  const [history, setHistory] = useState<StoricoRow[]>([]);
  const [newHist, setNewHist] = useState({ anno: String(new Date().getFullYear()), paoloLordo: "", sergioLordo: "", robertoLordo: "", paoloRimSogg: "", paoloRimInt: "", sergioRimSogg: "", sergioRimInt: "", robertoRimSogg: "", robertoRimInt: "" });
  const [loaded, setLoaded] = useState(false);
  const [editRow, setEditRow] = useState<StoricoRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: d }) => setUserId(d.user?.id || null));
  }, []);

  const load = async () => {
    if (!userId) return;
    const [{ data: configs }, { data: storico }] = await Promise.all([
      (supabase as any).from("netto_tasse_config").select("*"),
      (supabase as any).from("netto_tasse_storico").select("*").order("anno", { ascending: false }),
    ]);

    const catData: Record<string, CatConfig> = {};
    for (const key of Object.keys(DEFAULT_CATS)) {
      const existing = (configs || []).find((c: any) => c.categoria_key === key);
      if (existing) {
        catData[key] = {
          nome: existing.nome, fatturato: Number(existing.fatturato),
          minSogg: Number(existing.min_sogg), minInt: Number(existing.min_int),
          percSogg: Number(existing.perc_sogg), percInt: Number(existing.perc_int),
          percTasse: Number(existing.perc_tasse), coefficiente: Number(existing.coefficiente),
        };
      } else {
        catData[key] = { ...DEFAULT_CATS[key], fatturato: 0 };
        await (supabase as any).from("netto_tasse_config").insert({
          user_id: userId, categoria_key: key, nome: DEFAULT_CATS[key].nome,
          fatturato: 0, min_sogg: DEFAULT_CATS[key].minSogg, min_int: DEFAULT_CATS[key].minInt,
          perc_sogg: DEFAULT_CATS[key].percSogg, perc_int: DEFAULT_CATS[key].percInt,
          perc_tasse: DEFAULT_CATS[key].percTasse, coefficiente: DEFAULT_CATS[key].coefficiente,
        });
      }
    }
    setData(catData);
    setHistory((storico || []) as StoricoRow[]);
    setLoaded(true);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const saveField = async (key: string, field: string, value: number) => {
    if (!userId) return;
    const dbField = field === "fatturato" ? "fatturato" : field === "minSogg" ? "min_sogg" : field === "minInt" ? "min_int" : field === "percSogg" ? "perc_sogg" : field === "percInt" ? "perc_int" : field === "percTasse" ? "perc_tasse" : "coefficiente";
    await (supabase as any).from("netto_tasse_config").update({ [dbField]: value }).eq("user_id", userId).eq("categoria_key", key);
  };

  const saveNome = async (key: string, nome: string) => {
    if (!userId) return;
    await (supabase as any).from("netto_tasse_config").update({ nome }).eq("user_id", userId).eq("categoria_key", key);
  };

  const handleUpdate = (key: string, field: string, value: string) => {
    const num = parseFloat(value) || 0;
    setData(prev => ({ ...prev, [key]: { ...prev[key], [field]: num } }));
    saveField(key, field, num);
  };

  const handleNomeUpdate = (key: string, nome: string) => {
    setData(prev => ({ ...prev, [key]: { ...prev[key], nome } }));
    saveNome(key, nome);
  };

  const salvaStorico = async () => {
    if (!userId || !newHist.anno) return;
    const cP = calcola({ ...data.paolo, fatturato: parseFloat(newHist.paoloLordo) || 0 });
    const cS = calcola({ ...data.sergio, fatturato: parseFloat(newHist.sergioLordo) || 0 });
    const cR = calcola({ ...data.roberto, fatturato: parseFloat(newHist.robertoLordo) || 0 });
    const { error } = await (supabase as any).from("netto_tasse_storico").upsert({
      user_id: userId, anno: newHist.anno,
      paolo_lordo: parseFloat(newHist.paoloLordo) || 0, paolo_netto: cP?.netto || 0, paolo_tasse: cP?.tasse || 0,
      sergio_lordo: parseFloat(newHist.sergioLordo) || 0, sergio_netto: cS?.netto || 0, sergio_tasse: cS?.tasse || 0,
      roberto_lordo: parseFloat(newHist.robertoLordo) || 0, roberto_netto: cR?.netto || 0, roberto_tasse: cR?.tasse || 0,
      totale_famiglia: (cP?.netto || 0) + (cS?.netto || 0) + (cR?.netto || 0),
      paolo_rim_sogg: parseFloat(newHist.paoloRimSogg) || 0, paolo_rim_int: parseFloat(newHist.paoloRimInt) || 0,
      sergio_rim_sogg: parseFloat(newHist.sergioRimSogg) || 0, sergio_rim_int: parseFloat(newHist.sergioRimInt) || 0,
      roberto_rim_sogg: parseFloat(newHist.robertoRimSogg) || 0, roberto_rim_int: parseFloat(newHist.robertoRimInt) || 0,
    }, { onConflict: "user_id,anno" });
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Anno salvato" });
    setNewHist(h => ({ ...h, paoloLordo: "", sergioLordo: "", robertoLordo: "", paoloRimSogg: "", paoloRimInt: "", sergioRimSogg: "", sergioRimInt: "", robertoRimSogg: "", robertoRimInt: "", anno: String(parseInt(h.anno) + 1) }));
    load();
  };

  const eliminaStorico = async (id: string) => {
    await (supabase as any).from("netto_tasse_storico").delete().eq("id", id);
    load();
  };

  const openEdit = (h: StoricoRow) => {
    setEditRow({ ...h });
    setEditOpen(true);
  };

  const salvaEdit = async () => {
    if (!editRow || !userId) return;
    const cP = calcola({ ...data.paolo, fatturato: Number(editRow.paolo_lordo) });
    const cS = calcola({ ...data.sergio, fatturato: Number(editRow.sergio_lordo) });
    const cR = calcola({ ...data.roberto, fatturato: Number(editRow.roberto_lordo) });
    const { error } = await (supabase as any).from("netto_tasse_storico").update({
      paolo_lordo: Number(editRow.paolo_lordo), paolo_netto: cP?.netto || 0, paolo_tasse: cP?.tasse || 0,
      sergio_lordo: Number(editRow.sergio_lordo), sergio_netto: cS?.netto || 0, sergio_tasse: cS?.tasse || 0,
      roberto_lordo: Number(editRow.roberto_lordo), roberto_netto: cR?.netto || 0, roberto_tasse: cR?.tasse || 0,
      totale_famiglia: (cP?.netto || 0) + (cS?.netto || 0) + (cR?.netto || 0),
      paolo_rim_sogg: Number(editRow.paolo_rim_sogg), paolo_rim_int: Number(editRow.paolo_rim_int),
      sergio_rim_sogg: Number(editRow.sergio_rim_sogg), sergio_rim_int: Number(editRow.sergio_rim_int),
      roberto_rim_sogg: Number(editRow.roberto_rim_sogg), roberto_rim_int: Number(editRow.roberto_rim_int),
    }).eq("id", editRow.id);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Anno aggiornato" });
    setEditOpen(false);
    load();
  };

  if (!loaded) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Caricamento...</p></div>;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print, nav, aside { display: none !important; }
          main, #root, .flex-1, div[class*="pl-"] { margin-left: 0 !important; padding-left: 0 !important; width: 100% !important; max-width: 100% !important; }
          .shadow-lg, .shadow-2xl, .shadow-md { box-shadow: none !important; }
          th, td { padding: 4px 6px !important; font-size: 10px !important; }
          .print-hide-input input { display: none !important; }
          .print-hide-input .relative { display: none !important; }
          .print-netto-header { display: flex !important; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
          .print-netto-header img { height: 40px; width: auto; }
          .print-netto-header .print-date { font-size: 16px; font-weight: 700; }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" /> Netto Tasse
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Dashboard fiscale — dati salvati automaticamente</p>
        </div>
        <Button size="sm" onClick={() => window.print()} className="no-print">
          <Printer className="h-4 w-4 mr-2" /> Stampa
        </Button>
      </div>

      <div className="hidden print:flex print-netto-header">
        <img src={logoNero} alt="Studio Tecnico Ferrante" />
        <div className="print-date">{new Date().toLocaleDateString("it-IT")}</div>
      </div>

      {/* Cards per categoria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(data).map(([key, cat]) => {
          const d = calcola(cat);
          const soggOk = d ? d.progSogg >= 100 : false;
          const intOk = d ? d.progInt >= 100 : false;
          return (
            <Card key={key} className={`border-2 transition-all ${soggOk && intOk ? "border-green-500/50" : "border-orange-300/50"}`}>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 text-xs font-bold uppercase text-muted-foreground">
                  {cat.nome}
                  {soggOk && intOk ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-400" />}
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Fatturato Lordo (€)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input type="number" value={cat.fatturato || ""} onChange={e => handleUpdate(key, "fatturato", e.target.value)}
                      className="pl-10 text-xl font-bold h-12" placeholder="0" />
                  </div>
                </div>
                {/* Progress soggettiva */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase">
                    <span>Soggettivo ({cat.percSogg}%) <span className="text-gray-400"> min: {cat.minSogg}</span> </span>
                    <span className={soggOk ? "text-green-600" : "text-orange-600"}>
                      {d ? ((d.soggDovuto / d.F) * 100).toFixed(1) : 0}% reale
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${soggOk ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${d?.progSogg || 0}%` }} />
                  </div>
                </div>
                {/* Progress integrativa */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase">
                    <span>Integrativo ({cat.percInt}%) <span className="text-gray-400"> min: {cat.minInt}</span></span>
                    <span className={intOk ? "text-green-600" : "text-orange-600"}>{d ? Math.max(((cat.minInt) / d.F) * 100, cat.percInt).toFixed(1) : 0}% reale</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${intOk ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${d?.progInt || 0}%` }} />
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Netto mensile</p>
                    <p className="text-xl font-bold text-primary leading-none">€{d ? (d.netto / 12).toFixed(0) : 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Netto anno</p>
                    <p className="text-sm font-bold leading-none">€{d?.netto.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabella riepilogo - responsive */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 py-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Riepilogo Anno Corrente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b bg-muted/30 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="p-3 text-left">Soggetto</th>
                  <th className="p-3">Lordo</th>
                  <th className="p-3">Soggettivo</th>
                  <th className="p-3">Integrativo</th>
                  <th className="p-3 text-destructive">Tasse</th>
                  <th className="p-3 bg-primary/10 text-primary font-bold text-center">Netto Reale</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(data).map(([key, cat]) => {
                  const d = calcola(cat);
                  if (!d) return (
                    <tr key={key}><td className="p-3 text-left font-bold text-muted-foreground" colSpan={6}>{cat.nome} — nessun fatturato</td></tr>
                  );
                  const soggOk = d.progSogg >= 100;
                  const intOk = d.progInt >= 100;
                  return (
                    <tr key={key} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-left font-bold">{cat.nome}</td>
                      <td className="p-3 font-bold">€{d.F.toLocaleString()}</td>
                      <td className={`p-3 font-bold ${soggOk ? "text-green-600" : "text-orange-500"}`}>€{d.soggDovuto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className={`p-3 font-bold ${intOk ? "text-green-600" : "text-orange-500"}`}>€{d.intDovuto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="p-3 text-destructive font-medium">€{d.tasse.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="p-3 bg-primary/5 text-center font-bold text-primary text-lg">
                        €{d.netto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y">
            {Object.entries(data).map(([key, cat]) => {
              const d = calcola(cat);
              if (!d) return (
                <div key={key} className="p-4 text-sm text-muted-foreground">{cat.nome} — nessun fatturato</div>
              );
              const soggOk = d.progSogg >= 100;
              const intOk = d.progInt >= 100;
              return (
                <div key={key} className="p-4 space-y-2">
                  <p className="font-bold text-sm">{cat.nome}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Lordo:</span> <span className="font-bold">€{d.F.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Sogg:</span> <span className={`font-bold ${soggOk ? "text-green-600" : "text-orange-500"}`}>€{d.soggDovuto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                    <div><span className="text-muted-foreground">Int:</span> <span className={`font-bold ${intOk ? "text-green-600" : "text-orange-500"}`}>€{d.intDovuto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                    <div><span className="text-muted-foreground">Tasse:</span> <span className="font-bold text-destructive">€{d.tasse.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                  </div>
                  <div className="text-center pt-1 border-t">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Netto </span>
                    <span className="text-lg font-bold text-primary">€{d.netto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Storico */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 no-print">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Aggiungi Anno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label className="text-[10px] font-bold uppercase">Anno</Label>
              <Input type="number" value={newHist.anno} onChange={e => setNewHist(h => ({ ...h, anno: e.target.value }))} className="h-9 font-bold" /></div>
            <div className="border-t pt-2 space-y-2">
              <div><Label className="text-[10px] font-bold uppercase">Lordo {data.paolo?.nome}</Label>
                <Input type="number" value={newHist.paoloLordo} onChange={e => setNewHist(h => ({ ...h, paoloLordo: e.target.value }))} className="h-8 text-xs" /></div>
              <div><Label className="text-[10px] font-bold uppercase">Lordo {data.sergio?.nome}</Label>
                <Input type="number" value={newHist.sergioLordo} onChange={e => setNewHist(h => ({ ...h, sergioLordo: e.target.value }))} className="h-8 text-xs" /></div>
              <div><Label className="text-[10px] font-bold uppercase">Lordo {data.roberto?.nome}</Label>
                <Input type="number" value={newHist.robertoLordo} onChange={e => setNewHist(h => ({ ...h, robertoLordo: e.target.value }))} className="h-8 text-xs" /></div>
            </div>
            <div className="border-t pt-2 space-y-2">
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Rimanente da pagare</p>
              <div className="grid grid-cols-2 gap-1">
                <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Sogg. Paolo</Label>
                  <Input type="number" value={newHist.paoloRimSogg} onChange={e => setNewHist(h => ({ ...h, paoloRimSogg: e.target.value }))} className="h-7 text-xs" placeholder="0" /></div>
                <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Int. Paolo</Label>
                  <Input type="number" value={newHist.paoloRimInt} onChange={e => setNewHist(h => ({ ...h, paoloRimInt: e.target.value }))} className="h-7 text-xs" placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Sogg. Sergio</Label>
                  <Input type="number" value={newHist.sergioRimSogg} onChange={e => setNewHist(h => ({ ...h, sergioRimSogg: e.target.value }))} className="h-7 text-xs" placeholder="0" /></div>
                <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Int. Sergio</Label>
                  <Input type="number" value={newHist.sergioRimInt} onChange={e => setNewHist(h => ({ ...h, sergioRimInt: e.target.value }))} className="h-7 text-xs" placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Sogg. Roberto</Label>
                  <Input type="number" value={newHist.robertoRimSogg} onChange={e => setNewHist(h => ({ ...h, robertoRimSogg: e.target.value }))} className="h-7 text-xs" placeholder="0" /></div>
                <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Int. Roberto</Label>
                  <Input type="number" value={newHist.robertoRimInt} onChange={e => setNewHist(h => ({ ...h, robertoRimInt: e.target.value }))} className="h-7 text-xs" placeholder="0" /></div>
              </div>
            </div>
            <Button onClick={salvaStorico} className="w-full">Salva Anno</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Archivio Netti Famiglia</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm italic">Nessun anno salvato.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-[9px] font-bold uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="p-3 text-center">Anno</th>
                        <th className="p-3 text-right">{data.paolo?.nome}</th>
                        <th className="p-3 text-right">{data.sergio?.nome}</th>
                        <th className="p-3 text-right">{data.roberto?.nome}</th>
                        <th className="p-3 text-right text-green-600">Totale</th>
                        <th className="p-3 text-center w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map(h => (
                        <tr key={h.id} className="hover:bg-muted/20">
                          <td className="p-3 text-center font-bold text-lg">{h.anno}</td>
                          <td className="p-3 text-right">
                            <div className="font-bold">€{Number(h.paolo_netto).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-[9px] text-muted-foreground">Lordo: €{Number(h.paolo_lordo).toLocaleString()}</div>
                            {(Number(h.paolo_rim_sogg) > 0 || Number(h.paolo_rim_int) > 0) && (
                              <div className="text-[8px] mt-1 space-y-0.5">
                                {Number(h.paolo_rim_sogg) > 0 && <div className="text-orange-500">Rim. Sogg: €{Number(h.paolo_rim_sogg).toLocaleString()}</div>}
                                {Number(h.paolo_rim_int) > 0 && <div className="text-orange-500">Rim. Int: €{Number(h.paolo_rim_int).toLocaleString()}</div>}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="font-bold">€{Number(h.sergio_netto).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-[9px] text-muted-foreground">Lordo: €{Number(h.sergio_lordo).toLocaleString()}</div>
                            {(Number(h.sergio_rim_sogg) > 0 || Number(h.sergio_rim_int) > 0) && (
                              <div className="text-[8px] mt-1 space-y-0.5">
                                {Number(h.sergio_rim_sogg) > 0 && <div className="text-orange-500">Rim. Sogg: €{Number(h.sergio_rim_sogg).toLocaleString()}</div>}
                                {Number(h.sergio_rim_int) > 0 && <div className="text-orange-500">Rim. Int: €{Number(h.sergio_rim_int).toLocaleString()}</div>}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="font-bold">€{Number(h.roberto_netto).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="text-[9px] text-muted-foreground">Lordo: €{Number(h.roberto_lordo).toLocaleString()}</div>
                            {(Number(h.roberto_rim_sogg) > 0 || Number(h.roberto_rim_int) > 0) && (
                              <div className="text-[8px] mt-1 space-y-0.5">
                                {Number(h.roberto_rim_sogg) > 0 && <div className="text-orange-500">Rim. Sogg: €{Number(h.roberto_rim_sogg).toLocaleString()}</div>}
                                {Number(h.roberto_rim_int) > 0 && <div className="text-orange-500">Rim. Int: €{Number(h.roberto_rim_int).toLocaleString()}</div>}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right bg-green-50/50"><div className="font-bold text-green-700 text-lg">€{Number(h.totale_famiglia).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></td>
                          <td className="p-3 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(h)}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => eliminaStorico(h.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="sm:hidden divide-y">
                  {history.map(h => (
                    <div key={h.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{h.anno}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(h)}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => eliminaStorico(h.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                      {[
                        { label: data.paolo?.nome, netto: h.paolo_netto, lordo: h.paolo_lordo, rs: h.paolo_rim_sogg, ri: h.paolo_rim_int },
                        { label: data.sergio?.nome, netto: h.sergio_netto, lordo: h.sergio_lordo, rs: h.sergio_rim_sogg, ri: h.sergio_rim_int },
                        { label: data.roberto?.nome, netto: h.roberto_netto, lordo: h.roberto_lordo, rs: h.roberto_rim_sogg, ri: h.roberto_rim_int },
                      ].map((p, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{p.label}</span>
                          <div className="text-right">
                            <span className="font-bold">€{Number(p.netto).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <span className="text-muted-foreground ml-1 text-[10px]">(L: €{Number(p.lordo).toLocaleString()})</span>
                            {(Number(p.rs) > 0 || Number(p.ri) > 0) && (
                              <div className="text-[9px] text-orange-500">
                                {Number(p.rs) > 0 && <span>S: €{Number(p.rs).toLocaleString()} </span>}
                                {Number(p.ri) > 0 && <span>I: €{Number(p.ri).toLocaleString()}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="text-center pt-1 border-t">
                        <span className="font-bold text-green-700">Totale: €{Number(h.totale_famiglia).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Impostazioni parametri */}
      <details className="rounded-lg border overflow-hidden no-print">
        <summary className="p-4 cursor-pointer text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2 hover:bg-muted/30">
          <Settings2 className="h-4 w-4" /> Configurazione Parametri (Soglie Minime e Aliquote)
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t bg-muted/10">
          {Object.entries(data).map(([key, cat]) => (
            <div key={`cfg-${key}`} className="space-y-3 p-3 rounded-lg border bg-card">
              <div className="space-y-1 border-b pb-2">
                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Nome soggetto</Label>
                <Input value={cat.nome} onChange={e => handleNomeUpdate(key, e.target.value)} className="h-8 text-xs font-bold text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[9px] uppercase font-bold text-muted-foreground">Min. Soggettivo</Label>
                  <Input type="number" value={cat.minSogg} onChange={e => handleUpdate(key, "minSogg", e.target.value)} className="h-8 text-xs font-bold" /></div>
                <div><Label className="text-[9px] uppercase font-bold text-muted-foreground">Min. Integrativo</Label>
                  <Input type="number" value={cat.minInt} onChange={e => handleUpdate(key, "minInt", e.target.value)} className="h-8 text-xs font-bold" /></div>
                <div><Label className="text-[9px] uppercase font-bold text-muted-foreground">% Soggettiva</Label>
                  <Input type="number" step="0.1" value={cat.percSogg} onChange={e => handleUpdate(key, "percSogg", e.target.value)} className="h-8 text-xs font-bold" /></div>
                <div><Label className="text-[9px] uppercase font-bold text-muted-foreground">% Integrativa</Label>
                  <Input type="number" step="0.1" value={cat.percInt} onChange={e => handleUpdate(key, "percInt", e.target.value)} className="h-8 text-xs font-bold" /></div>
                <div><Label className="text-[9px] uppercase font-bold text-muted-foreground">Tassazione %</Label>
                  <Input type="number" value={cat.percTasse} onChange={e => handleUpdate(key, "percTasse", e.target.value)} className="h-8 text-xs font-bold" /></div>
                <div><Label className="text-[9px] uppercase font-bold text-muted-foreground">Coeff. %</Label>
                  <Input type="number" value={cat.coefficiente} onChange={e => handleUpdate(key, "coefficiente", e.target.value)} className="h-8 text-xs font-bold" /></div>
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Dialog modifica storico */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Modifica Anno {editRow?.anno}</DialogTitle></DialogHeader>
          {editRow && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div><Label className="text-[10px] font-bold uppercase">Lordo {data.paolo?.nome}</Label>
                  <Input type="number" value={editRow.paolo_lordo} onChange={e => setEditRow({ ...editRow, paolo_lordo: parseFloat(e.target.value) || 0 })} className="h-9" /></div>
                <div><Label className="text-[10px] font-bold uppercase">Lordo {data.sergio?.nome}</Label>
                  <Input type="number" value={editRow.sergio_lordo} onChange={e => setEditRow({ ...editRow, sergio_lordo: parseFloat(e.target.value) || 0 })} className="h-9" /></div>
                <div><Label className="text-[10px] font-bold uppercase">Lordo {data.roberto?.nome}</Label>
                  <Input type="number" value={editRow.roberto_lordo} onChange={e => setEditRow({ ...editRow, roberto_lordo: parseFloat(e.target.value) || 0 })} className="h-9" /></div>
              </div>
              <div className="border-t pt-3 space-y-2">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Rimanente da pagare</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Sogg. Paolo</Label>
                    <Input type="number" value={editRow.paolo_rim_sogg} onChange={e => setEditRow({ ...editRow, paolo_rim_sogg: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                  <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Int. Paolo</Label>
                    <Input type="number" value={editRow.paolo_rim_int} onChange={e => setEditRow({ ...editRow, paolo_rim_int: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Sogg. Sergio</Label>
                    <Input type="number" value={editRow.sergio_rim_sogg} onChange={e => setEditRow({ ...editRow, sergio_rim_sogg: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                  <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Int. Sergio</Label>
                    <Input type="number" value={editRow.sergio_rim_int} onChange={e => setEditRow({ ...editRow, sergio_rim_int: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Sogg. Roberto</Label>
                    <Input type="number" value={editRow.roberto_rim_sogg} onChange={e => setEditRow({ ...editRow, roberto_rim_sogg: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                  <div><Label className="text-[8px] uppercase font-bold text-muted-foreground">Int. Roberto</Label>
                    <Input type="number" value={editRow.roberto_rim_int} onChange={e => setEditRow({ ...editRow, roberto_rim_int: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                </div>
              </div>
              <Button className="w-full h-12" onClick={salvaEdit}>Salva Modifiche</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
