import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Euro, TrendingUp, TrendingDown, Wallet, Clock, ChevronDown, ChevronUp, Building2, BarChart3, AlertTriangle } from "lucide-react";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useStatiPratica } from "@/hooks/use-stati-pratica";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import type { Pratica } from "@/types/database";

type Periodo = "mensile" | "trimestrale" | "quadrimestrale" | "annuale";

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

/** Returns the reference date for preventivato (data_preventivata_fine or fallback) */
function getDataPreventivato(p: Pratica): Date | null {
  if (p.data_preventivata_fine) return new Date(p.data_preventivata_fine);
  // Fallback: created_at + 4 months
  const d = new Date(p.created_at);
  d.setMonth(d.getMonth() + 4);
  return d;
}

/** Calculate spese fisse that fall within a given month/year */
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

function getBuckets(periodo: Periodo, anno: number) {
  if (periodo === "mensile") {
    return MESI.map((label, i) => ({ label, mesi: [i] }));
  } else if (periodo === "trimestrale") {
    return ["Q1 (Gen-Mar)", "Q2 (Apr-Giu)", "Q3 (Lug-Set)", "Q4 (Ott-Dic)"].map((label, qi) => ({
      label, mesi: [qi * 3, qi * 3 + 1, qi * 3 + 2],
    }));
  } else if (periodo === "quadrimestrale") {
    return ["1° Quadr. (Gen-Apr)", "2° Quadr. (Mag-Ago)", "3° Quadr. (Set-Dic)"].map((label, qi) => ({
      label, mesi: Array.from({ length: 4 }, (_, i) => qi * 4 + i),
    }));
  } else {
    return [{ label: `${anno}`, mesi: Array.from({ length: 12 }, (_, i) => i) }];
  }
}

function meseInBucket(mese: number, bucket: { mesi: number[] }) {
  return bucket.mesi.includes(mese);
}

function raggruppaDati(
  pratiche: Pratica[],
  movimenti: Movimento[],
  speseFisse: SpesaFissa[],
  periodo: Periodo,
  anno: number
) {
  const buckets = getBuckets(periodo, anno);

  // Group entrate (incassato) by their actual date from movimenti
  const entrateAnno = movimenti.filter(m => {
    const d = new Date(m.data);
    return m.tipo === "entrata" && getYear(d) === anno;
  });

  // Group uscite (costi pratiche) by their actual date from movimenti
  const usciteAnno = movimenti.filter(m => {
    const d = new Date(m.data);
    return m.tipo === "uscita" && getYear(d) === anno;
  });

  // Group preventivato by data_preventivata_fine
  const praticheConPreventivato = pratiche.filter(p => {
    const d = getDataPreventivato(p);
    return d && getYear(d) === anno && (p.guadagno_preventivato ?? 0) > 0;
  });

  return buckets.map(b => {
    const incassato = entrateAnno
      .filter(m => meseInBucket(getMonth(new Date(m.data)), b))
      .reduce((s, m) => s + m.importo, 0);

    const costiPratiche = usciteAnno
      .filter(m => meseInBucket(getMonth(new Date(m.data)), b))
      .reduce((s, m) => s + m.importo, 0);

    const praticheBucket = praticheConPreventivato.filter(p => {
      const d = getDataPreventivato(p)!;
      return meseInBucket(getMonth(d), b);
    });

    const preventivato = praticheBucket.reduce((s, p) => s + (p.guadagno_preventivato ?? 0), 0);

    // Split preventivato into two stacked parts:
    // giaPreso = portion already collected (bottom, yellow transparent)
    // daPrendere = remainder still to collect (top, yellow with red dashed border)
    const giaPreso = praticheBucket.reduce((s, p) => {
      const prev = p.guadagno_preventivato ?? 0;
      const preso = p.soldi_presi ?? 0;
      return s + Math.min(preso, prev); // cap at preventivato
    }, 0);
    const daPrendere = Math.max(0, preventivato - giaPreso);

    const speseFissePeriodo = b.mesi.reduce((s, m) => s + calcolaSpeseFisseMensili(speseFisse, m, anno), 0);
    const totaleSpese = costiPratiche + speseFissePeriodo;
    const netto = incassato - totaleSpese;
    const margine = incassato > 0 ? ((incassato - totaleSpese) / incassato * 100) : 0;
    const scarto = incassato - preventivato;
    const count = praticheBucket.length;

    return {
      label: b.label, preventivato, giaPreso, daPrendere, incassato, costiPratiche, speseFisse: speseFissePeriodo,
      totaleSpese, netto, margine, scarto, count,
    };
  });
}

export default function Guadagni() {
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [speseFisse, setSpeseFisse] = useState<SpesaFissa[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("mensile");
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [dettaglioAperto, setDettaglioAperto] = useState(false);
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

  const dati = useMemo(() => raggruppaDati(pratiche, movimenti, speseFisse, periodo, anno), [pratiche, movimenti, speseFisse, periodo, anno]);

  // Totali anno — incassato from movimenti, preventivato from pratiche
  const entrateAnno = movimenti.filter(m => m.tipo === "entrata" && getYear(new Date(m.data)) === anno);
  const usciteAnno = movimenti.filter(m => m.tipo === "uscita" && getYear(new Date(m.data)) === anno);
  const totaleIncassato = entrateAnno.reduce((s, m) => s + m.importo, 0);
  const totaleCostiPratiche = usciteAnno.reduce((s, m) => s + m.importo, 0);

  const praticheAnnoPreventivato = pratiche.filter(p => {
    const d = getDataPreventivato(p);
    return d && getYear(d) === anno;
  });
  const totalePreventivato = praticheAnnoPreventivato.reduce((s, p) => s + (p.guadagno_preventivato ?? 0), 0);

  const totaleSpeseFisse = Array.from({ length: 12 }, (_, i) => calcolaSpeseFisseMensili(speseFisse, i, anno)).reduce((a, b) => a + b, 0);
  const totaleSpeseComplessive = totaleCostiPratiche + totaleSpeseFisse;
  const daIncassare = totalePreventivato - totaleIncassato;
  const nettoReale = totaleIncassato - totaleSpeseComplessive;
  const margineAnno = totaleIncassato > 0 ? ((totaleIncassato - totaleSpeseComplessive) / totaleIncassato * 100) : 0;
  const scartoAnno = totaleIncassato - totalePreventivato;

  // For detail table, still group pratiche by preventivato date
  const praticheAnno = praticheAnnoPreventivato;
  const praticheAperte = praticheAnno.filter(p => !STATI_CHIUSI.includes(p.stato));
  const praticheChiuse = praticheAnno.filter(p => STATI_CHIUSI.includes(p.stato));

  // Medie periodo
  const periodiConDati = dati.filter(d => d.count > 0 || d.incassato > 0 || d.speseFisse > 0);
  const mediaIncassato = periodiConDati.length > 0
    ? periodiConDati.reduce((s, d) => s + d.incassato, 0) / periodiConDati.length : 0;
  const mediaNetto = periodiConDati.length > 0
    ? periodiConDati.reduce((s, d) => s + d.netto, 0) / periodiConDati.length : 0;
  const mediaSpese = periodiConDati.length > 0
    ? periodiConDati.reduce((s, d) => s + d.totaleSpese, 0) / periodiConDati.length : 0;

  const periodoLabel = periodo === "mensile" ? "mese" : periodo === "trimestrale" ? "trimestre" : periodo === "quadrimestrale" ? "quadrimestre" : "anno";

  const chartConfig = {
    giaPreso: { label: "Già preso", color: "hsl(200 80% 70%)" },
    daPrendere: { label: "Da prendere", color: "hsl(200 70% 80%)" },
    // incassato rimosso dal grafico: il dato è già rappresentato da "giaPreso" nella barra impilata
    totaleSpese: { label: "Spese totali", color: "hsl(var(--destructive))" },
    netto: { label: "Netto", color: "hsl(142 71% 45%)" },
  };

  // Check which past periods have a scarto
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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

      {/* Controlli periodo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Visualizza per</p>
              <ToggleGroup type="single" value={periodo} onValueChange={v => v && setPeriodo(v as Periodo)} className="justify-start flex-wrap">
                <ToggleGroupItem value="mensile" className="text-xs px-2 sm:px-3">Mensile</ToggleGroupItem>
                <ToggleGroupItem value="trimestrale" className="text-xs px-2 sm:px-3">Trim.</ToggleGroupItem>
                <ToggleGroupItem value="quadrimestrale" className="text-xs px-2 sm:px-3">Quadrim.</ToggleGroupItem>
                <ToggleGroupItem value="annuale" className="text-xs px-2 sm:px-3">Annuale</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Anno</p>
              <Select value={String(anno)} onValueChange={v => setAnno(Number(v))}>
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
          </div>
        </CardContent>
      </Card>

      {/* Medie */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Media incassato / {periodoLabel}</p>
            <p className="text-2xl font-bold">€{mediaIncassato.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Media spese / {periodoLabel}</p>
            <p className="text-2xl font-bold text-destructive">€{mediaSpese.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Media netto / {periodoLabel}</p>
            <p className={cn("text-2xl font-bold", mediaNetto >= 0 ? "text-success" : "text-destructive")}>
              €{mediaNetto.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Andamento {anno}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <BarChart data={dati} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval={0} angle={periodo === "mensile" ? -45 : 0} textAnchor={periodo === "mensile" ? "end" : "middle"} height={periodo === "mensile" ? 50 : 30} />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={v => `€${v}`} width={55} />
              <ChartTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload;
                if (!data) return null;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
                    <p className="font-semibold">{label}</p>
                    <p className="text-sky-500">Preventivato: €{data.preventivato?.toFixed(2)}</p>
                    <p className="text-success">Guadagni totali: €{data.incassato?.toFixed(2)}</p>
                    <p className="text-destructive">Spese totali: €{data.totaleSpese?.toFixed(2)}</p>
                  </div>
                );
              }} />
              <Bar dataKey="giaPreso" stackId="preventivato" fill="hsl(200 80% 70%)" fillOpacity={0.3} radius={[0, 0, 0, 0]} />
              <Bar dataKey="daPrendere" stackId="preventivato" fill="hsl(200 70% 80%)" fillOpacity={0.5} stroke="hsl(var(--destructive))" strokeDasharray="4 2" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
              {/* <Bar dataKey="incassato" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} /> — rimosso: dato già in giaPreso */}
              <Bar dataKey="totaleSpese" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netto" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Tabella riepilogo periodi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riepilogo per {periodoLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Periodo</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground hidden md:table-cell">Preventivato</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">Incassato</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground hidden sm:table-cell">Costi</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground hidden md:table-cell">Spese fisse</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">Netto</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">Scarto</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground hidden lg:table-cell">Margine</th>
                </tr>
              </thead>
              <tbody>
                {dati.map((d, idx) => {
                  // Determine if this period is in the past (for scarto highlighting)
                  let isPast = false;
                  if (anno < currentYear) {
                    isPast = true;
                  } else if (anno === currentYear) {
                    const buckets = getBuckets(periodo, anno);
                    const bucket = buckets[idx];
                    if (bucket) {
                      const maxMonth = Math.max(...bucket.mesi);
                      isPast = maxMonth < currentMonth;
                    }
                  }
                  const hasScarto = isPast && d.scarto !== 0 && (d.preventivato > 0 || d.incassato > 0);

                  return (
                    <tr key={d.label} className={cn("border-b hover:bg-muted/20 transition-colors", hasScarto && d.scarto < 0 && "bg-destructive/5")}>
                      <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">{d.label}</td>
                      <td className="p-2 sm:p-3 text-right hidden md:table-cell text-sky-500">€{d.preventivato.toFixed(0)}</td>
                      <td className="p-2 sm:p-3 text-right">€{d.incassato.toFixed(0)}</td>
                      <td className="p-2 sm:p-3 text-right hidden sm:table-cell text-destructive">€{d.costiPratiche.toFixed(0)}</td>
                      <td className="p-2 sm:p-3 text-right hidden md:table-cell text-orange-500">€{d.speseFisse.toFixed(0)}</td>
                      <td className={cn("p-2 sm:p-3 text-right font-medium", d.netto >= 0 ? "text-success" : "text-destructive")}>
                        €{d.netto.toFixed(0)}
                      </td>
                      <td className="p-2 sm:p-3 text-right">
                        {(d.preventivato > 0 || d.incassato > 0) ? (
                          <span className={cn("font-medium inline-flex items-center gap-1",
                            d.scarto < 0 ? "text-destructive" : d.scarto > 0 ? "text-success" : "text-muted-foreground"
                          )}>
                            {hasScarto && d.scarto < 0 && <AlertTriangle className="h-3 w-3" />}
                            {d.scarto >= 0 ? "+" : ""}€{d.scarto.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className={cn("p-2 sm:p-3 text-right hidden lg:table-cell", d.margine >= 0 ? "text-success" : "text-destructive")}>
                        {d.margine.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
                {/* Totale row */}
                <tr className="border-t-2 font-bold bg-muted/20">
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">Totale</td>
                  <td className="p-2 sm:p-3 text-right hidden md:table-cell text-sky-500">€{dati.reduce((s, d) => s + d.preventivato, 0).toFixed(0)}</td>
                  <td className="p-2 sm:p-3 text-right">€{dati.reduce((s, d) => s + d.incassato, 0).toFixed(0)}</td>
                  <td className="p-2 sm:p-3 text-right hidden sm:table-cell text-destructive">€{dati.reduce((s, d) => s + d.costiPratiche, 0).toFixed(0)}</td>
                  <td className="p-2 sm:p-3 text-right hidden md:table-cell text-orange-500">€{dati.reduce((s, d) => s + d.speseFisse, 0).toFixed(0)}</td>
                  <td className={cn("p-2 sm:p-3 text-right", nettoReale >= 0 ? "text-success" : "text-destructive")}>€{nettoReale.toFixed(0)}</td>
                  <td className={cn("p-2 sm:p-3 text-right font-medium", scartoAnno < 0 ? "text-destructive" : scartoAnno > 0 ? "text-success" : "")}>
                    {scartoAnno >= 0 ? "+" : ""}€{scartoAnno.toFixed(0)}
                  </td>
                  <td className={cn("p-2 sm:p-3 text-right hidden lg:table-cell", margineAnno >= 0 ? "text-success" : "text-destructive")}>{margineAnno.toFixed(0)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
