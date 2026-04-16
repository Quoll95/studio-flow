import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Euro, TrendingUp, TrendingDown, Wallet, Clock, ChevronDown, ChevronUp, Building2, BarChart3, AlertTriangle, ArrowLeft } from "lucide-react";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useStatiPratica } from "@/hooks/use-stati-pratica";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import type { Pratica } from "@/types/database";

type SpesaFissa = {
  id: string;
  titolo: string;
  importo: number;
  data: string;
  frequenza_mesi: number;
  n_rate: number;
};

type Movimento = {
  id: string;
  id_pratica: string;
  tipo: string;
  importo: number;
  data: string;
};

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const STATI_CHIUSI = ["chiusa", "archiviata", "completata"];

function getDataPreventivato(p: Pratica): Date | null {
  if (p.data_preventivata_fine) return new Date(p.data_preventivata_fine);
  const d = new Date(p.created_at);
  d.setMonth(d.getMonth() + 4);
  return d;
}

function calcolaSpeseFisseMensili(spese: SpesaFissa[], mese: number, anno: number): number {
  let totale = 0;
  for (const s of spese) {
    const dataInizio = new Date(s.data);
    const freq = s.frequenza_mesi;
    for (let rata = 0; rata < s.n_rate; rata++) {
      let dataRata: Date;
      if (freq < 1 && freq > 0) {
        const weeks = freq * 4;
        dataRata = new Date(dataInizio);
        dataRata.setDate(dataRata.getDate() + Math.round(rata * weeks * 7));
      } else if (freq >= 1) {
        dataRata = new Date(dataInizio);
        dataRata.setMonth(dataRata.getMonth() + rata * freq);
      } else {
        dataRata = dataInizio;
      }
      if (dataRata.getMonth() === mese && dataRata.getFullYear() === anno) {
        totale += s.importo;
      }
    }
  }
  return totale;
}

/** Build monthly data for chart */
function buildMonthlyData(
  pratiche: Pratica[],
  movimenti: Movimento[],
  speseFisse: SpesaFissa[],
  anno: number
) {
  const entrateAnno = movimenti.filter(m => m.tipo === "entrata" && getYear(new Date(m.data)) === anno);
  const usciteAnno = movimenti.filter(m => m.tipo === "uscita" && getYear(new Date(m.data)) === anno);

  return MESI.map((label, mese) => {
    const entrate = entrateAnno
      .filter(m => getMonth(new Date(m.data)) === mese)
      .reduce((s, m) => s + m.importo, 0);

    const costiPratiche = usciteAnno
      .filter(m => getMonth(new Date(m.data)) === mese)
      .reduce((s, m) => s + m.importo, 0);

    const speseFisseMese = calcolaSpeseFisseMensili(speseFisse, mese, anno);
    const uscite = costiPratiche + speseFisseMese;

    // Rimanente: per pratiche con data_preventivata_fine in questo mese
    const rimanente = pratiche
      .filter(p => {
        const d = getDataPreventivato(p);
        return d && getYear(d) === anno && getMonth(d) === mese && (p.guadagno_preventivato ?? 0) > 0;
      })
      .reduce((s, p) => Math.max(0, (p.guadagno_preventivato ?? 0) - (p.soldi_presi ?? 0)) + s, 0);

    return { label, entrate, uscite, rimanente, costiPratiche, speseFisse: speseFisseMese, type: "month" as const, mese };
  });
}

/** Build chart data: 12 months + 4 quarterly summary bars interleaved */
function buildChartData(
  pratiche: Pratica[],
  movimenti: Movimento[],
  speseFisse: SpesaFissa[],
  anno: number
) {
  const monthly = buildMonthlyData(pratiche, movimenti, speseFisse, anno);
  const result: Array<{
    label: string;
    entrate: number;
    uscite: number;
    rimanente: number;
    type: "month" | "quarter";
  }> = [];

  for (let q = 0; q < 4; q++) {
    const start = q * 3;
    for (let i = start; i < start + 3; i++) {
      result.push(monthly[i]);
    }
    // Add quarterly summary
    const qMonths = monthly.slice(start, start + 3);
    result.push({
      label: `Q${q + 1}`,
      entrate: qMonths.reduce((s, m) => s + m.entrate, 0),
      uscite: qMonths.reduce((s, m) => s + m.uscite, 0),
      rimanente: qMonths.reduce((s, m) => s + m.rimanente, 0),
      type: "quarter",
    });
  }

  return result;
}

/** Build annual comparison data */
function buildAnnualData(
  pratiche: Pratica[],
  movimenti: Movimento[],
  speseFisse: SpesaFissa[],
  annoCorrente: number
) {
  const anni = [annoCorrente - 2, annoCorrente - 1, annoCorrente];
  return anni.map(anno => {
    const entrateAnno = movimenti
      .filter(m => m.tipo === "entrata" && getYear(new Date(m.data)) === anno)
      .reduce((s, m) => s + m.importo, 0);

    const usciteMov = movimenti
      .filter(m => m.tipo === "uscita" && getYear(new Date(m.data)) === anno)
      .reduce((s, m) => s + m.importo, 0);

    const speseFisseAnno = Array.from({ length: 12 }, (_, i) => calcolaSpeseFisseMensili(speseFisse, i, anno))
      .reduce((a, b) => a + b, 0);

    const rimanente = pratiche
      .filter(p => {
        const d = getDataPreventivato(p);
        return d && getYear(d) === anno && (p.guadagno_preventivato ?? 0) > 0;
      })
      .reduce((s, p) => Math.max(0, (p.guadagno_preventivato ?? 0) - (p.soldi_presi ?? 0)) + s, 0);

    return {
      label: String(anno),
      entrate: entrateAnno,
      uscite: usciteMov + speseFisseAnno,
      rimanente,
      type: "year" as const,
    };
  });
}

export default function Guadagni() {
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [speseFisse, setSpeseFisse] = useState<SpesaFissa[]>([]);
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [vistaAnnuale, setVistaAnnuale] = useState(false);
  const [dettaglioAperto, setDettaglioAperto] = useState(false);
  const [trimestreAperto, setTrimestreAperto] = useState(false);
  const navigate = useNavigate();
  const { getLabel, getColore } = useStatiPratica();

  useEffect(() => {
    async function load() {
      const [{ data: pr }, { data: sf }, { data: mv }] = await Promise.all([
        supabase.from("pratiche").select("*, clienti(*), tipi_pratica(*)").order("created_at", { ascending: false }),
        supabase.from("spese_fisse").select("*"),
        supabase.from("movimenti_pratica").select("*"),
      ]);
      setPratiche((pr as Pratica[]) || []);
      setSpeseFisse((sf as SpesaFissa[]) || []);
      setMovimenti((mv as Movimento[]) || []);
    }
    load();
  }, []);

  const anniDisponibili = useMemo(() => {
    const years = new Set<number>();
    movimenti.forEach(m => years.add(getYear(new Date(m.data))));
    pratiche.forEach(p => {
      const d = getDataPreventivato(p);
      if (d) years.add(getYear(d));
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [pratiche, movimenti]);

  // Chart data
  const chartData = useMemo(() => buildChartData(pratiche, movimenti, speseFisse, anno), [pratiche, movimenti, speseFisse, anno]);
  const annualData = useMemo(() => buildAnnualData(pratiche, movimenti, speseFisse, anno), [pratiche, movimenti, speseFisse, anno]);

  // Totali anno
  const entrateAnno = movimenti.filter(m => m.tipo === "entrata" && getYear(new Date(m.data)) === anno);
  const usciteAnno = movimenti.filter(m => m.tipo === "uscita" && getYear(new Date(m.data)) === anno);
  const totaleIncassato = entrateAnno.reduce((s, m) => s + m.importo, 0);
  const totaleCostiPratiche = usciteAnno.reduce((s, m) => s + m.importo, 0);

  const praticheAnnoPreventivato = pratiche.filter(p => {
    const d = getDataPreventivato(p);
    return d && getYear(d) === anno && (p.guadagno_preventivato ?? 0) > 0;
  });
  const totalePreventivato = praticheAnnoPreventivato.reduce((s, p) => s + (p.guadagno_preventivato ?? 0), 0);

  const totaleSpeseFisse = Array.from({ length: 12 }, (_, i) => calcolaSpeseFisseMensili(speseFisse, i, anno)).reduce((a, b) => a + b, 0);
  const totaleSpeseComplessive = totaleCostiPratiche + totaleSpeseFisse;
  const daIncassare = totalePreventivato - totaleIncassato;
  const nettoReale = totaleIncassato - totaleSpeseComplessive;
  const margineAnno = totaleIncassato > 0 ? ((totaleIncassato - totaleSpeseComplessive) / totaleIncassato * 100) : 0;
  const scartoAnno = totaleIncassato - totalePreventivato;

  const praticheAnno = praticheAnnoPreventivato;
  const praticheAperte = praticheAnno.filter(p => !STATI_CHIUSI.includes(p.stato));
  const praticheChiuse = praticheAnno.filter(p => STATI_CHIUSI.includes(p.stato));

  // Quarterly data for table
  const quarterlyData = useMemo(() => {
    const monthly = buildMonthlyData(pratiche, movimenti, speseFisse, anno);
    return [0, 1, 2, 3].map(q => {
      const start = q * 3;
      const qMonths = monthly.slice(start, start + 3);
      const entrate = qMonths.reduce((s, m) => s + m.entrate, 0);
      const uscite = qMonths.reduce((s, m) => s + m.uscite, 0);
      const costiPratiche = qMonths.reduce((s, m) => s + m.costiPratiche, 0);
      const speseFisseQ = qMonths.reduce((s, m) => s + m.speseFisse, 0);
      const rimanente = qMonths.reduce((s, m) => s + m.rimanente, 0);
      const netto = entrate - uscite;
      return {
        label: `Q${q + 1} (${MESI[start]}-${MESI[start + 2]})`,
        entrate,
        uscite,
        costiPratiche,
        speseFisse: speseFisseQ,
        rimanente,
        netto,
      };
    });
  }, [pratiche, movimenti, speseFisse, anno]);

  const chartConfig = {
    entrate: { label: "Entrate", color: "hsl(142 71% 45%)" },
    uscite: { label: "Uscite", color: "hsl(var(--destructive))" },
    rimanente: { label: "Rimanente da prendere", color: "hsl(200 80% 70%)" },
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Guadagni / Prospetto</h1>
        <p className="text-muted-foreground text-sm mt-1">Riepilogo economico {anno} — incassato per data movimento, preventivato per data fine prevista</p>
      </div>

      {/* Totali anno */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3 sm:pt-5 sm:px-4">
            <div className="p-1.5 rounded-lg bg-sky-500/10 w-fit mb-1"><TrendingUp className="h-4 w-4 text-sky-500" /></div>
            <p className="text-base sm:text-lg font-bold">€{totalePreventivato.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Preventivato</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-5 sm:px-4">
            <div className="p-1.5 rounded-lg bg-success/10 w-fit mb-1"><Wallet className="h-4 w-4 text-success" /></div>
            <p className="text-base sm:text-lg font-bold">€{totaleIncassato.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Incassato</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-5 sm:px-4">
            <div className="p-1.5 rounded-lg bg-destructive/10 w-fit mb-1"><TrendingDown className="h-4 w-4 text-destructive" /></div>
            <p className="text-base sm:text-lg font-bold">€{totaleCostiPratiche.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Costi pratiche</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-5 sm:px-4">
            <div className="p-1.5 rounded-lg bg-orange-500/10 w-fit mb-1"><Building2 className="h-4 w-4 text-orange-500" /></div>
            <p className="text-base sm:text-lg font-bold">€{totaleSpeseFisse.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Spese fisse</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-5 sm:px-4">
            <div className="p-1.5 rounded-lg bg-warning/10 w-fit mb-1"><Clock className="h-4 w-4 text-warning" /></div>
            <p className="text-base sm:text-lg font-bold">€{daIncassare.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Da incassare</p>
          </CardContent>
        </Card>
        <Card className={cn(nettoReale >= 0 ? "border-success/30" : "border-destructive/30")}>
          <CardContent className="p-3 sm:pt-5 sm:px-4">
            <div className="p-1.5 rounded-lg bg-primary/10 w-fit mb-1"><BarChart3 className="h-4 w-4 text-primary" /></div>
            <p className={cn("text-base sm:text-lg font-bold", nettoReale >= 0 ? "text-success" : "text-destructive")}>€{nettoReale.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Netto reale ({margineAnno.toFixed(0)}%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Riepilogo rapido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <p className="text-2xl font-bold">{praticheAnno.length}</p>
          <p className="text-[10px] text-muted-foreground">Pratiche totali</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <p className="text-2xl font-bold">{praticheAperte.length}</p>
          <p className="text-[10px] text-muted-foreground">Aperte</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <p className="text-2xl font-bold">{praticheChiuse.length}</p>
          <p className="text-[10px] text-muted-foreground">Chiuse</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <p className={cn("text-2xl font-bold", scartoAnno < 0 ? "text-destructive" : scartoAnno > 0 ? "text-success" : "")}>
            {scartoAnno >= 0 ? "+" : ""}€{scartoAnno.toFixed(0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Scarto (incassato vs previsto)</p>
        </div>
      </div>

      {/* Grafico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {vistaAnnuale && (
                <Button variant="ghost" size="icon" onClick={() => setVistaAnnuale(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-lg">
                {vistaAnnuale ? "Riepilogo annuale" : `Andamento ${anno}`}
              </CardTitle>
              {!vistaAnnuale && (
                <Button variant="outline" size="sm" onClick={() => setVistaAnnuale(true)}>
                  Riepilogo annuale
                </Button>
              )}
            </div>
            <Select value={String(anno)} onValueChange={v => { setAnno(Number(v)); setVistaAnnuale(false); }}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anniDisponibili.map(a => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "hsl(142 71% 45%)" }} />
              <span>Entrate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "hsl(0 84% 60%)" }} />
              <span>Uscite</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "hsl(200 80% 70%)" }} />
              <span>Rimanente da prendere</span>
            </div>
            {!vistaAnnuale && (
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm border-2 border-dashed" style={{ borderColor: "hsl(280 60% 60%)", backgroundColor: "transparent" }} />
                <span>Riepilogo trimestrale</span>
              </div>
            )}
          </div>

          {vistaAnnuale ? (
            /* Vista annuale: 3 anni affiancati */
            <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
              <BarChart data={annualData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${v}`} width={55} />
                <ChartTooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
                      <p className="font-semibold">{label}</p>
                      <p className="text-success">Entrate: €{data.entrate?.toFixed(2)}</p>
                      <p className="text-destructive">Uscite: €{data.uscite?.toFixed(2)}</p>
                      <p className="text-sky-500">Rimanente: €{data.rimanente?.toFixed(2)}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="entrate" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="uscite" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rimanente" fill="hsl(200 80% 70%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            /* Vista mensile con barre trimestrali */
            <ChartContainer config={chartConfig} className="h-[280px] sm:h-[350px] w-full">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${v}`} width={55} />
                <ChartTooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  const isQ = data.type === "quarter";
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
                      <p className="font-semibold">{isQ ? `${label} (Trimestre)` : label}</p>
                      <p className="text-success">Entrate: €{data.entrate?.toFixed(2)}</p>
                      <p className="text-destructive">Uscite: €{data.uscite?.toFixed(2)}</p>
                      <p className="text-sky-500">Rimanente: €{data.rimanente?.toFixed(2)}</p>
                      {isQ && (
                        <p className="font-medium pt-1 border-t">
                          Netto: <span className={data.entrate - data.uscite >= 0 ? "text-success" : "text-destructive"}>
                            €{(data.entrate - data.uscite).toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                }} />
                {/* For monthly items: grouped bars. For quarterly: stacked. We use conditional rendering via Cell colors */}
                <Bar dataKey="entrate" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === "quarter" ? "hsl(142 71% 45% / 0.7)" : "hsl(142 71% 45%)"} stroke={entry.type === "quarter" ? "hsl(280 60% 60%)" : undefined} strokeWidth={entry.type === "quarter" ? 2 : 0} strokeDasharray={entry.type === "quarter" ? "4 2" : undefined} />
                  ))}
                </Bar>
                <Bar dataKey="uscite" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === "quarter" ? "hsl(0 84% 60% / 0.7)" : "hsl(0 84% 60%)"} stroke={entry.type === "quarter" ? "hsl(280 60% 60%)" : undefined} strokeWidth={entry.type === "quarter" ? 2 : 0} strokeDasharray={entry.type === "quarter" ? "4 2" : undefined} />
                  ))}
                </Bar>
                <Bar dataKey="rimanente" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === "quarter" ? "hsl(200 80% 70% / 0.7)" : "hsl(200 80% 70%)"} stroke={entry.type === "quarter" ? "hsl(280 60% 60%)" : undefined} strokeWidth={entry.type === "quarter" ? 2 : 0} strokeDasharray={entry.type === "quarter" ? "4 2" : undefined} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Riepilogo per trimestre — collapsabile */}
      <Collapsible open={trimestreAperto} onOpenChange={setTrimestreAperto}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Riepilogo per trimestre</CardTitle>
                <Button variant="ghost" size="icon">
                  {trimestreAperto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Periodo</th>
                      <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">Entrate</th>
                      <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground hidden sm:table-cell">Costi pratiche</th>
                      <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground hidden md:table-cell">Spese fisse</th>
                      <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">Uscite tot.</th>
                      <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground hidden md:table-cell">Rimanente</th>
                      <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">Netto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarterlyData.map((d) => (
                      <tr key={d.label} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">{d.label}</td>
                        <td className="p-2 sm:p-3 text-right text-success">€{d.entrate.toFixed(0)}</td>
                        <td className="p-2 sm:p-3 text-right hidden sm:table-cell text-destructive">€{d.costiPratiche.toFixed(0)}</td>
                        <td className="p-2 sm:p-3 text-right hidden md:table-cell text-orange-500">€{d.speseFisse.toFixed(0)}</td>
                        <td className="p-2 sm:p-3 text-right text-destructive">€{d.uscite.toFixed(0)}</td>
                        <td className="p-2 sm:p-3 text-right hidden md:table-cell text-sky-500">€{d.rimanente.toFixed(0)}</td>
                        <td className={cn("p-2 sm:p-3 text-right font-medium", d.netto >= 0 ? "text-success" : "text-destructive")}>
                          €{d.netto.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold bg-muted/20">
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">Totale</td>
                      <td className="p-2 sm:p-3 text-right text-success">€{quarterlyData.reduce((s, d) => s + d.entrate, 0).toFixed(0)}</td>
                      <td className="p-2 sm:p-3 text-right hidden sm:table-cell text-destructive">€{quarterlyData.reduce((s, d) => s + d.costiPratiche, 0).toFixed(0)}</td>
                      <td className="p-2 sm:p-3 text-right hidden md:table-cell text-orange-500">€{quarterlyData.reduce((s, d) => s + d.speseFisse, 0).toFixed(0)}</td>
                      <td className="p-2 sm:p-3 text-right text-destructive">€{quarterlyData.reduce((s, d) => s + d.uscite, 0).toFixed(0)}</td>
                      <td className="p-2 sm:p-3 text-right hidden md:table-cell text-sky-500">€{quarterlyData.reduce((s, d) => s + d.rimanente, 0).toFixed(0)}</td>
                      <td className={cn("p-2 sm:p-3 text-right font-medium", nettoReale >= 0 ? "text-success" : "text-destructive")}>€{nettoReale.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Dettaglio pratiche collassabile */}
      <Collapsible open={dettaglioAperto} onOpenChange={setDettaglioAperto}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Dettaglio per pratica ({praticheAnno.length})</CardTitle>
                <Button variant="ghost" size="icon">
                  {dettaglioAperto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Pratica</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Cliente</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Stato</th>
                      <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Fine prev.</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Preventivato</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Incassato</th>
                      <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">Costi</th>
                      <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">Scarto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {praticheAnno.map(p => {
                      const soldiPresi = p.soldi_presi ?? 0;
                      const preventivato = p.guadagno_preventivato ?? 0;
                      const scartoPratica = soldiPresi - preventivato;
                      const dataFine = getDataPreventivato(p);
                      return (
                        <tr
                          key={p.id}
                          className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/pratiche/${p.id}`)}
                        >
                          <td className="p-3 font-medium">{p.titolo}</td>
                          <td className="p-3 text-muted-foreground hidden sm:table-cell">{p.clienti?.nome_completo || p.cliente_nome || "—"}</td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge variant="outline" className="text-xs" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>
                              {getLabel(p.stato)}
                            </Badge>
                          </td>
                          <td className="p-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                            {dataFine ? format(dataFine, "dd/MM/yy") : "—"}
                          </td>
                          <td className="p-3 text-right text-sky-500">€{preventivato.toFixed(0)}</td>
                          <td className="p-3 text-right">€{soldiPresi.toFixed(0)}</td>
                          <td className="p-3 text-right hidden sm:table-cell text-destructive">€{(p.spese ?? 0).toFixed(0)}</td>
                          <td className={cn("p-3 text-right font-medium hidden sm:table-cell",
                            scartoPratica < 0 ? "text-destructive" : scartoPratica > 0 ? "text-success" : "text-muted-foreground"
                          )}>
                            {preventivato > 0 || soldiPresi > 0 ? (
                              <span className="inline-flex items-center gap-1">
                                {scartoPratica < 0 && <AlertTriangle className="h-3 w-3" />}
                                {scartoPratica >= 0 ? "+" : ""}€{scartoPratica.toFixed(0)}
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {praticheAnno.length === 0 && (
                      <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nessuna pratica per {anno}.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
