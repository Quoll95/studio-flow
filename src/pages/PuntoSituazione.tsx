// // // /* eslint-disable @typescript-eslint/no-explicit-any */
// // // import { useEffect, useState } from "react";
// // // import { supabase } from "@/integrations/supabase/client";
// // // import { Button } from "@/components/ui/button";
// // // import { Input } from "@/components/ui/input";
// // // import { Textarea } from "@/components/ui/textarea";
// // // import { Checkbox } from "@/components/ui/checkbox";
// // // import { Switch } from "@/components/ui/switch";
// // // import { Label } from "@/components/ui/label";
// // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // // import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// // // import { useToast } from "@/hooks/use-toast";
// // // import { Plus, Search, Printer, GripVertical, Clock, CalendarIcon } from "lucide-react";
// // // import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
// // // import { it } from "date-fns/locale";
// // // import { useNavigate } from "react-router-dom";
// // // import { cn } from "@/lib/utils";
// // // import { useColoriPratica } from "@/hooks/use-colori-pratica";
// // // import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
// // // import type { PuntoDellaSituazione, Scadenza } from "@/types/database";
// // // import logoNero from "@/assets/logo-scritta-grande.png";

// // // type PraticaWithPunti = {
// // //   id: string;
// // //   titolo: string;
// // //   colore: string | null;
// // //   privata: boolean;
// // //   proprietario_id: string;
// // //   ordine_situazione: number;
// // //   punti_attivi: PuntoDellaSituazione[];
// // //   deadline_prossima: Scadenza | null;
// // // };

// // // export default function PuntoSituazione() {
// // //   const [pratiche, setPratiche] = useState<PraticaWithPunti[]>([]);
// // //   const [ricerca, setRicerca] = useState("");
// // //   const [filtroColore, setFiltroColore] = useState("tutti");
// // //   const [addDialogOpen, setAddDialogOpen] = useState(false);
// // //   const [addPraticaId, setAddPraticaId] = useState<string | null>(null);
// // //   const [addPraticaTitolo, setAddPraticaTitolo] = useState("");
// // //   const [npTitolo, setNpTitolo] = useState("");
// // //   const [npDescrizione, setNpDescrizione] = useState("");
// // //   const [npCompletata, setNpCompletata] = useState(false);
// // //   const [npData, setNpData] = useState("");
// // //   const [userId, setUserId] = useState<string | null>(null);
// // //   const { toast } = useToast();
// // //   const navigate = useNavigate();
// // //   const { colori } = useColoriPratica();

// // //   useEffect(() => {
// // //     supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
// // //   }, []);

// // //   const load = async () => {
// // //     const { data: pr } = await supabase
// // //       .from("pratiche")
// // //       .select("id, titolo, colore, privata, proprietario_id, ordine_situazione")
// // //       .neq("stato", "chiusa")
// // //       .order("ordine_situazione", { ascending: true });

// // //     if (!pr) return;

// // //     const results: PraticaWithPunti[] = [];
// // //     for (const p of pr as any[]) {
// // //       if (p.privata && p.proprietario_id !== userId) continue;
// // //       const [{ data: punti }, { data: scadenze }] = await Promise.all([
// // //         supabase.from("punti_situazione").select("*").eq("id_pratica", p.id).eq("completata", false).order("ordine", { ascending: true }),
// // //         supabase.from("scadenze").select("*").eq("id_pratica", p.id).eq("completata", false).order("data_scadenza", { ascending: true }).limit(1),
// // //       ]);
// // //       results.push({
// // //         id: p.id, titolo: p.titolo, colore: p.colore, privata: p.privata,
// // //         proprietario_id: p.proprietario_id, ordine_situazione: p.ordine_situazione ?? 0,
// // //         punti_attivi: (punti || []) as PuntoDellaSituazione[],
// // //         deadline_prossima: (scadenze && scadenze.length > 0 ? scadenze[0] : null) as Scadenza | null,
// // //       });
// // //     }
// // //     setPratiche(results);
// // //   };

// // //   useEffect(() => { if (userId !== null) load(); }, [userId]);

// // //   const filtered = pratiche.filter(p => {
// // //     if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase())) return false;
// // //     if (filtroColore !== "tutti") {
// // //       if (filtroColore === "nessuno") return !p.colore;
// // //       return p.colore === filtroColore;
// // //     }
// // //     return true;
// // //   });

// // //   const handleToggle = async (punto: PuntoDellaSituazione) => {
// // //     await supabase.from("punti_situazione").update({ completata: !punto.completata }).eq("id", punto.id);
// // //     load();
// // //   };

// // //   const handleAdd = async () => {
// // //     if (!addPraticaId || !npTitolo.trim()) return;
// // //     const pratica = pratiche.find(p => p.id === addPraticaId);
// // //     const minOrdine = pratica?.punti_attivi.length ? Math.min(...pratica.punti_attivi.map(p => p.ordine)) - 1 : 0;
// // //     const { error } = await supabase.from("punti_situazione").insert({
// // //       id_pratica: addPraticaId, testo: npTitolo.trim(),
// // //       descrizione: npDescrizione.trim() || null,
// // //       completata: npCompletata, ordine: minOrdine,
// // //       data: npData || null,
// // //     } as any);
// // //     if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// // //     // If date is set, create calendar event with pratica color
// // //     if (npData) {
// // //       const { data: { user } } = await supabase.auth.getUser();
// // //       if (user) {
// // //         await supabase.from("eventi_calendario").insert({
// // //           user_id: user.id,
// // //           titolo: npTitolo.trim(),
// // //           colore: pratica?.colore || "#3b82f6",
// // //           data: npData,
// // //           id_pratica: addPraticaId,
// // //         } as any);
// // //       }
// // //     }
// // //     toast({ title: "Nota pratica aggiunta" });
// // //     setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setAddDialogOpen(false); load();
// // //   };

// // //   const handlePrint = () => { window.print(); };

// // //   const handleDragEnd = async (result: DropResult) => {
// // //     if (!result.destination) return;
// // //     const items = Array.from(filtered);
// // //     const [reordered] = items.splice(result.source.index, 1);
// // //     items.splice(result.destination.index, 0, reordered);
// // //     // Update ordine_situazione and reorder the full array
// // //     const updatedAll = [...pratiche];
// // //     for (let i = 0; i < items.length; i++) {
// // //       const idx = updatedAll.findIndex(p => p.id === items[i].id);
// // //       if (idx !== -1) updatedAll[idx] = { ...updatedAll[idx], ordine_situazione: i };
// // //     }
// // //     // Sort by new ordine_situazione for instant visual update
// // //     updatedAll.sort((a, b) => a.ordine_situazione - b.ordine_situazione);
// // //     setPratiche(updatedAll);
// // //     // Persist to DB in background
// // //     const updates = items.map((item, i) =>
// // //       supabase.from("pratiche").update({ ordine_situazione: i } as any).eq("id", item.id)
// // //     );
// // //     await Promise.all(updates);
// // //   };

// // //   return (
// // //     <div className="space-y-6">
// // //       <style>{`
// // //         @media print {
// // //           @page { margin: 15mm 12mm; size: A4; }
// // //           body * { visibility: hidden; }
// // //           .print-situazione, .print-situazione * { visibility: visible; }
// // //           .print-situazione { position: absolute; left: 0; top: 0; width: 100%; padding: 0 16px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000 !important; }
// // //           .no-print { display: none !important; }
// // //           .print-situazione .print-header { display: flex !important; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
// // //           .print-situazione .print-header-logo img { height: 40px; width: auto; }
// // //           .print-situazione .print-header-date { font-size: 26px; font-weight: 800; }
// // //           .print-situazione .print-pratica-title { font-size: 13px !important; font-weight: 700 !important; text-align: left !important; }
// // //           .print-situazione .print-deadline { padding-left: 24px; }
// // //           .print-situazione .print-punto-data { font-size: 9px; color: #555; }
// // //           .print-situazione .print-card { break-inside: avoid; page-break-inside: avoid; }
// // //         }
// // //       `}</style>

// // //       <div className="flex items-center justify-between no-print">
// // //         <div>
// // //           <h1 className="text-2xl font-bold tracking-tight">Punto della Situazione</h1>
// // //           <p className="text-muted-foreground text-sm mt-1">Stato di avanzamento delle pratiche aperte</p>
// // //         </div>
// // //         <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Stampa</Button>
// // //       </div>

// // //       <div className="flex gap-2 no-print">
// // //         <div className="relative flex-1">
// // //           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// // //           <Input placeholder="Cerca pratica..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
// // //         </div>
// // //         <Select value={filtroColore} onValueChange={setFiltroColore}>
// // //           <SelectTrigger className="w-36 sm:w-44">
// // //             <SelectValue placeholder="Tutti i colori" />
// // //           </SelectTrigger>
// // //           <SelectContent>
// // //             <SelectItem value="tutti">Tutti i colori</SelectItem>
// // //             <SelectItem value="nessuno">Senza colore</SelectItem>
// // //             {colori.map(c => (
// // //               <SelectItem key={c.id} value={c.colore}>
// // //                 <div className="flex items-center gap-2">
// // //                   <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.colore }} />
// // //                   {c.label}
// // //                 </div>
// // //               </SelectItem>
// // //             ))}
// // //           </SelectContent>
// // //         </Select>
// // //       </div>

// // //       <div className="print-situazione">
// // //         <div className="hidden print:flex print-header">
// // //           <div className="print-header-logo"><img src={logoNero} alt="Studio Tecnico Ferrante" /></div>
// // //           <div className="print-header-date">{format(new Date(), "dd/MM/yyyy")}</div>
// // //         </div>

// // //         <DragDropContext onDragEnd={handleDragEnd}>
// // //           <Droppable droppableId="pratiche-situazione">
// // //             {(provided) => (
// // //               <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
// // //                 {filtered.map((p, idx) => (
// // //                   <Draggable key={p.id} draggableId={p.id} index={idx}>
// // //                     {(provided, snapshot) => (
// // //                       <div
// // //                         ref={provided.innerRef}
// // //                         {...provided.draggableProps}
// // //                         className={cn(
// // //                           "rounded-lg border bg-card p-4 transition-shadow print-card",
// // //                           snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
// // //                         )}
// // //                       >
// // //                         {/* Header: titolo + deadline */}
// // //                         <div className="flex items-center gap-3 mb-1">
// // //                           <div {...provided.dragHandleProps} className="cursor-grab shrink-0 text-muted-foreground no-print">
// // //                             <GripVertical className="h-5 w-5" />
// // //                           </div>
// // //                           {p.colore && <span className="w-3 h-3 rounded-full shrink-0 no-print" style={{ backgroundColor: p.colore }} />}
// // //                           <span
// // //                             className="font-semibold text-sm cursor-pointer hover:underline flex-1 truncate print-pratica-title"
// // //                             onClick={() => navigate(`/pratiche/${p.id}`)}
// // //                           >
// // //                             {p.titolo}
// // //                           </span>
// // //                           <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 no-print"
// // //                             onClick={() => { setAddPraticaId(p.id); setAddPraticaTitolo(p.titolo); setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setAddDialogOpen(true); }}>
// // //                             <Plus className="h-4 w-4" />
// // //                           </Button>
// // //                         </div>

// // //                         {/* Deadline prossima */}
// // //                         {p.deadline_prossima && (
// // //                           <div className="flex items-center gap-2 ml-8 mb-2 print-deadline">
// // //                             <Clock className="h-3.5 w-3.5 text-destructive shrink-0" />
// // //                             <span className={cn(
// // //                               "text-xs font-medium",
// // //                               isPast(parseISO(p.deadline_prossima.data_scadenza)) && !isToday(parseISO(p.deadline_prossima.data_scadenza))
// // //                                 ? "text-destructive"
// // //                                 : "text-muted-foreground"
// // //                             )}>
// // //                               Deadline: {p.deadline_prossima.titolo} — {format(parseISO(p.deadline_prossima.data_scadenza), "dd MMM yyyy", { locale: it })}
// // //                             </span>
// // //                           </div>
// // //                         )}

// // //                         {/* Punti attivi - centrati */}
// // //                         {p.punti_attivi.length === 0 ? (
// // //                           <p className="text-muted-foreground italic text-xs text-center py-1">Nessun punto attivo</p>
// // //                         ) : (
// // //                           <div className={cn(
// // //                             "gap-x-6 gap-y-1 mx-auto max-w-2xl",
// // //                             p.punti_attivi.length > 3 ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-1"
// // //                           )}>
// // //                             {p.punti_attivi.map(punto => (
// // //                               <div key={punto.id} className="flex items-start gap-2 py-1">
// // //                                 <Checkbox
// // //                                   checked={false}
// // //                                   onCheckedChange={() => handleToggle(punto)}
// // //                                   className="mt-0.5 shrink-0"
// // //                                 />
// // //                                 <div className="min-w-0 flex-1">
// // //                                   <p className="text-sm">{punto.testo}</p>
// // //                                   {punto.descrizione && <p className="text-xs text-muted-foreground">{punto.descrizione}</p>}
// // //                                 </div>
// // //                                 {punto.data && (
// // //                                   <span className="text-[11px] font-medium text-primary whitespace-nowrap shrink-0 print-punto-data">
// // //                                     <CalendarIcon className="h-3 w-3 inline mr-0.5" />
// // //                                     {format(parseISO(punto.data), "dd/MM/yy")}
// // //                                   </span>
// // //                                 )}
// // //                               </div>
// // //                             ))}
// // //                           </div>
// // //                         )}
// // //                       </div>
// // //                     )}
// // //                   </Draggable>
// // //                 ))}
// // //                 {provided.placeholder}
// // //                 {filtered.length === 0 && (
// // //                   <p className="text-center text-muted-foreground py-8">Nessuna pratica aperta trovata.</p>
// // //                 )}
// // //               </div>
// // //             )}
// // //           </Droppable>
// // //         </DragDropContext>
// // //       </div>

// // //       <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
// // //         <DialogContent className="w-[95vw] sm:max-w-md">
// // //           <DialogHeader><DialogTitle>Nuova nota pratica — {addPraticaTitolo}</DialogTitle></DialogHeader>
// // //           <div className="space-y-4">
// // //             <div className="space-y-2">
// // //               <Label>Titolo</Label>
// // //               <Input placeholder="Titolo della nota..." value={npTitolo} onChange={e => setNpTitolo(e.target.value)} />
// // //             </div>
// // //             <div className="space-y-2">
// // //               <Label>Descrizione <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
// // //               <Textarea placeholder="Descrizione..." value={npDescrizione} onChange={e => setNpDescrizione(e.target.value)} rows={3} />
// // //             </div>
// // //             <div className="flex items-center gap-3">
// // //               <Switch checked={npCompletata} onCheckedChange={setNpCompletata} />
// // //               <Label>{npCompletata ? "Fatto" : "Da fare"}</Label>
// // //             </div>
// // //             <div className="space-y-2">
// // //               <Label>Data <span className="text-muted-foreground text-xs">(opzionale — apparirà nel calendario)</span></Label>
// // //               <Input type="date" value={npData} onChange={e => setNpData(e.target.value)} />
// // //             </div>
// // //             <Button className="w-full h-12" onClick={handleAdd} disabled={!npTitolo.trim()}>Aggiungi</Button>
// // //           </div>
// // //         </DialogContent>
// // //       </Dialog>
// // //     </div>
// // //   );
// // // }

// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { useEffect, useState } from "react";
// // import { supabase } from "@/integrations/supabase/client";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import { Switch } from "@/components/ui/switch";
// // import { Label } from "@/components/ui/label";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// // import { useToast } from "@/hooks/use-toast";
// // import { Plus, Search, Printer, GripVertical, Clock, CalendarIcon } from "lucide-react";
// // import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
// // import { it } from "date-fns/locale";
// // import { useNavigate } from "react-router-dom";
// // import { cn } from "@/lib/utils";
// // import { useColoriPratica } from "@/hooks/use-colori-pratica";
// // import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
// // import type { PuntoDellaSituazione, Scadenza } from "@/types/database";
// // import logoNero from "@/assets/logo-scritta-grande.png";

// // type PraticaWithPunti = {
// //   id: string;
// //   titolo: string;
// //   colore: string | null;
// //   privata: boolean;
// //   proprietario_id: string;
// //   ordine_situazione: number;
// //   punti_attivi: PuntoDellaSituazione[];
// //   deadline_prossima: Scadenza | null;
// // };

// // export default function PuntoSituazione() {
// //   const [pratiche, setPratiche] = useState<PraticaWithPunti[]>([]);
// //   const [ricerca, setRicerca] = useState("");
// //   const [filtroColore, setFiltroColore] = useState("tutti");
// //   const [addDialogOpen, setAddDialogOpen] = useState(false);
// //   const [addPraticaId, setAddPraticaId] = useState<string | null>(null);
// //   const [addPraticaTitolo, setAddPraticaTitolo] = useState("");
// //   const [npTitolo, setNpTitolo] = useState("");
// //   const [npDescrizione, setNpDescrizione] = useState("");
// //   const [npCompletata, setNpCompletata] = useState(false);
// //   const [npData, setNpData] = useState("");
// //   const [userId, setUserId] = useState<string | null>(null);
// //   const { toast } = useToast();
// //   const navigate = useNavigate();
// //   const { colori } = useColoriPratica();

// //   useEffect(() => {
// //     supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
// //   }, []);

// //   const load = async () => {
// //     const { data: pr } = await supabase
// //       .from("pratiche")
// //       .select("id, titolo, colore, privata, proprietario_id, ordine_situazione")
// //       .neq("stato", "chiusa")
// //       .order("ordine_situazione", { ascending: true });

// //     if (!pr) return;

// //     const results: PraticaWithPunti[] = [];
// //     for (const p of pr as any[]) {
// //       if (p.privata && p.proprietario_id !== userId) continue;
// //       const [{ data: punti }, { data: scadenze }] = await Promise.all([
// //         supabase.from("punti_situazione").select("*").eq("id_pratica", p.id).eq("completata", false).order("ordine", { ascending: true }),
// //         supabase.from("scadenze").select("*").eq("id_pratica", p.id).eq("completata", false).order("data_scadenza", { ascending: true }).limit(1),
// //       ]);
// //       results.push({
// //         id: p.id, titolo: p.titolo, colore: p.colore, privata: p.privata,
// //         proprietario_id: p.proprietario_id, ordine_situazione: p.ordine_situazione ?? 0,
// //         punti_attivi: (punti || []) as PuntoDellaSituazione[],
// //         deadline_prossima: (scadenze && scadenze.length > 0 ? scadenze[0] : null) as Scadenza | null,
// //       });
// //     }
// //     setPratiche(results);
// //   };

// //   useEffect(() => { if (userId !== null) load(); }, [userId]);

// //   const filtered = pratiche.filter(p => {
// //     if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase())) return false;
// //     if (filtroColore !== "tutti") {
// //       if (filtroColore === "nessuno") return !p.colore;
// //       return p.colore === filtroColore;
// //     }
// //     return true;
// //   });

// //   const handleToggle = async (punto: PuntoDellaSituazione) => {
// //     await supabase.from("punti_situazione").update({ completata: !punto.completata }).eq("id", punto.id);
// //     load();
// //   };

// //   const handleAdd = async () => {
// //     if (!addPraticaId || !npTitolo.trim()) return;
// //     const pratica = pratiche.find(p => p.id === addPraticaId);
// //     const minOrdine = pratica?.punti_attivi.length ? Math.min(...pratica.punti_attivi.map(p => p.ordine)) - 1 : 0;
// //     const { error } = await supabase.from("punti_situazione").insert({
// //       id_pratica: addPraticaId, testo: npTitolo.trim(),
// //       descrizione: npDescrizione.trim() || null,
// //       completata: npCompletata, ordine: minOrdine,
// //       data: npData || null,
// //     } as any);
// //     if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// //     // If date is set, create calendar event with pratica color
// //     if (npData) {
// //       const { data: { user } } = await supabase.auth.getUser();
// //       if (user) {
// //         await supabase.from("eventi_calendario").insert({
// //           user_id: user.id,
// //           titolo: npTitolo.trim(),
// //           colore: pratica?.colore || "#3b82f6",
// //           data: npData,
// //           id_pratica: addPraticaId,
// //         } as any);
// //       }
// //     }
// //     toast({ title: "Nota pratica aggiunta" });
// //     setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setAddDialogOpen(false); load();
// //   };

// //   const handlePrint = () => { window.print(); };

// //   const handleDragEnd = async (result: DropResult) => {
// //     if (!result.destination) return;
// //     const items = Array.from(filtered);
// //     const [reordered] = items.splice(result.source.index, 1);
// //     items.splice(result.destination.index, 0, reordered);
// //     // Update ordine_situazione and reorder the full array
// //     const updatedAll = [...pratiche];
// //     for (let i = 0; i < items.length; i++) {
// //       const idx = updatedAll.findIndex(p => p.id === items[i].id);
// //       if (idx !== -1) updatedAll[idx] = { ...updatedAll[idx], ordine_situazione: i };
// //     }
// //     // Sort by new ordine_situazione for instant visual update
// //     updatedAll.sort((a, b) => a.ordine_situazione - b.ordine_situazione);
// //     setPratiche(updatedAll);
// //     // Persist to DB in background
// //     const updates = items.map((item, i) =>
// //       supabase.from("pratiche").update({ ordine_situazione: i } as any).eq("id", item.id)
// //     );
// //     await Promise.all(updates);
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <style>{`
// //         @media print {
// //           @page { margin: 15mm 12mm; size: A4; }
// //           body * { visibility: hidden; }
// //           .print-situazione, .print-situazione * { visibility: visible; }
// //           .print-situazione { position: absolute; left: 0; top: 0; width: 100%; padding: 0 16px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000 !important; }
// //           .no-print { display: none !important; }
// //           .print-situazione .print-header { display: flex !important; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
// //           .print-situazione .print-header-logo img { height: 40px; width: auto; }
// //           .print-situazione .print-header-date { font-size: 26px; font-weight: 800; }
// //           .print-situazione .print-pratica-title { font-size: 13px !important; font-weight: 700 !important; text-align: left !important; }
// //           .print-situazione .print-deadline { padding-left: 24px; }
// //           .print-situazione .print-punto-data { font-size: 9px; color: #555; }
// //           .print-situazione .print-card { break-inside: avoid; page-break-inside: avoid; }
// //         }
// //       `}</style>

// //       <div className="flex items-center justify-between no-print">
// //         <div>
// //           <h1 className="text-2xl font-bold tracking-tight">Punto della Situazione</h1>
// //           <p className="text-muted-foreground text-sm mt-1">Stato di avanzamento delle pratiche aperte</p>
// //         </div>
// //         <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Stampa</Button>
// //       </div>

// //       <div className="flex gap-2 no-print">
// //         <div className="relative flex-1">
// //           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //           <Input placeholder="Cerca pratica..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
// //         </div>
// //         <Select value={filtroColore} onValueChange={setFiltroColore}>
// //           <SelectTrigger className="w-36 sm:w-44">
// //             <SelectValue placeholder="Tutti i colori" />
// //           </SelectTrigger>
// //           <SelectContent>
// //             <SelectItem value="tutti">Tutti i colori</SelectItem>
// //             <SelectItem value="nessuno">Senza colore</SelectItem>
// //             {colori.map(c => (
// //               <SelectItem key={c.id} value={c.colore}>
// //                 <div className="flex items-center gap-2">
// //                   <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.colore }} />
// //                   {c.label}
// //                 </div>
// //               </SelectItem>
// //             ))}
// //           </SelectContent>
// //         </Select>
// //       </div>

// //       <div className="print-situazione">
// //         <div className="hidden print:flex print-header">
// //           <div className="print-header-logo"><img src={logoNero} alt="Studio Tecnico Ferrante" /></div>
// //           <div className="print-header-date">{format(new Date(), "dd/MM/yyyy")}</div>
// //         </div>

// //         <DragDropContext onDragEnd={handleDragEnd}>
// //           <Droppable droppableId="pratiche-situazione">
// //             {(provided) => (
// //               <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
// //                 {filtered.map((p, idx) => (
// //                   <Draggable key={p.id} draggableId={p.id} index={idx}>
// //                     {(provided, snapshot) => (
// //                       <div
// //                         ref={provided.innerRef}
// //                         {...provided.draggableProps}
// //                         className={cn(
// //                           "rounded-lg border bg-card p-4 transition-shadow print-card",
// //                           snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
// //                         )}
// //                       >
// //                         {/* Header: titolo + deadline */}
// //                         <div className="flex items-center gap-3 mb-1">
// //                           <div {...provided.dragHandleProps} className="cursor-grab shrink-0 text-muted-foreground no-print">
// //                             <GripVertical className="h-5 w-5" />
// //                           </div>
// //                           {p.colore && <span className="w-3 h-3 rounded-full shrink-0 no-print" style={{ backgroundColor: p.colore }} />}
// //                           <span
// //                             className="font-semibold text-sm cursor-pointer hover:underline flex-1 truncate print-pratica-title"
// //                             onClick={() => navigate(`/pratiche/${p.id}`)}
// //                           >
// //                             {p.titolo}
// //                           </span>
// //                           <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 no-print"
// //                             onClick={() => { setAddPraticaId(p.id); setAddPraticaTitolo(p.titolo); setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setAddDialogOpen(true); }}>
// //                             <Plus className="h-4 w-4" />
// //                           </Button>
// //                         </div>

// //                         {/* Deadline prossima */}
// //                         {p.deadline_prossima && (
// //                           <div className="flex items-center gap-2 ml-8 mb-2 print-deadline">
// //                             <Clock className="h-3.5 w-3.5 text-destructive shrink-0" />
// //                             <span className={cn(
// //                               "text-xs font-medium",
// //                               isPast(parseISO(p.deadline_prossima.data_scadenza)) && !isToday(parseISO(p.deadline_prossima.data_scadenza))
// //                                 ? "text-destructive"
// //                                 : "text-muted-foreground"
// //                             )}>
// //                               Deadline: {p.deadline_prossima.titolo} — {format(parseISO(p.deadline_prossima.data_scadenza), "dd MMM yyyy", { locale: it })}
// //                             </span>
// //                           </div>
// //                         )}

// //                         {/* Punti attivi - centrati */}
// //                         {p.punti_attivi.length === 0 ? (
// //                           <p className="text-muted-foreground italic text-xs text-center py-1">Nessun punto attivo</p>
// //                         ) : (
// //                           <div className={cn(
// //                             "gap-x-6 gap-y-1 mx-auto max-w-2xl",
// //                             p.punti_attivi.length > 3 ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-1"
// //                           )}>
// //                             {p.punti_attivi.map(punto => (
// //                               <div key={punto.id} className="flex items-start gap-2 py-1">
// //                                 <Checkbox
// //                                   checked={false}
// //                                   onCheckedChange={() => handleToggle(punto)}
// //                                   className="mt-0.5 shrink-0"
// //                                 />
// //                                 <div className="min-w-0 flex-1">
// //                                   <div className="flex items-center flex-wrap gap-x-2">
// //                                     <p className="text-sm">{punto.testo}</p>
// //                                     {punto.data && (
// //                                       <span className="text-[11px] font-medium text-primary whitespace-nowrap shrink-0 print-punto-data">
// //                                         <CalendarIcon className="h-3 w-3 inline mr-0.5" />
// //                                         {format(parseISO(punto.data), "dd/MM/yy")}
// //                                       </span>
// //                                     )}
// //                                   </div>
// //                                   {punto.descrizione && <p className="text-xs text-muted-foreground">{punto.descrizione}</p>}
// //                                 </div>
// //                               </div>
// //                             ))}
// //                           </div>
// //                         )}
// //                       </div>
// //                     )}
// //                   </Draggable>
// //                 ))}
// //                 {provided.placeholder}
// //                 {filtered.length === 0 && (
// //                   <p className="text-center text-muted-foreground py-8">Nessuna pratica aperta trovata.</p>
// //                 )}
// //               </div>
// //             )}
// //           </Droppable>
// //         </DragDropContext>
// //       </div>

// //       <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
// //         <DialogContent className="w-[95vw] sm:max-w-md">
// //           <DialogHeader><DialogTitle>Nuova nota pratica — {addPraticaTitolo}</DialogTitle></DialogHeader>
// //           <div className="space-y-4">
// //             <div className="space-y-2">
// //               <Label>Titolo</Label>
// //               <Input placeholder="Titolo della nota..." value={npTitolo} onChange={e => setNpTitolo(e.target.value)} />
// //             </div>
// //             <div className="space-y-2">
// //               <Label>Descrizione <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
// //               <Textarea placeholder="Descrizione..." value={npDescrizione} onChange={e => setNpDescrizione(e.target.value)} rows={3} />
// //             </div>
// //             <div className="flex items-center gap-3">
// //               <Switch checked={npCompletata} onCheckedChange={setNpCompletata} />
// //               <Label>{npCompletata ? "Fatto" : "Da fare"}</Label>
// //             </div>
// //             <div className="space-y-2">
// //               <Label>Data <span className="text-muted-foreground text-xs">(opzionale — apparirà nel calendario)</span></Label>
// //               <Input type="date" value={npData} onChange={e => setNpData(e.target.value)} />
// //             </div>
// //             <Button className="w-full h-12" onClick={handleAdd} disabled={!npTitolo.trim()}>Aggiungi</Button>
// //           </div>
// //         </DialogContent>
// //       </Dialog>
// //     </div>
// //   );
// // }

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast";
// import { Plus, Search, Printer, GripVertical, Clock, CalendarIcon } from "lucide-react";
// import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
// import { it } from "date-fns/locale";
// import { useNavigate } from "react-router-dom";
// import { cn } from "@/lib/utils";
// import { useColoriPratica } from "@/hooks/use-colori-pratica";
// import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
// import type { PuntoDellaSituazione, Scadenza } from "@/types/database";
// import logoNero from "@/assets/logo-scritta-grande.png";

// type PraticaWithPunti = {
//   id: string;
//   titolo: string;
//   colore: string | null;
//   privata: boolean;
//   proprietario_id: string;
//   ordine_situazione: number;
//   stato?: string;
//   punti_attivi: PuntoDellaSituazione[];
//   deadline_prossima: Scadenza | null;
// };

// export default function PuntoSituazione() {
//   const [pratiche, setPratiche] = useState<PraticaWithPunti[]>([]);
//   const [ricerca, setRicerca] = useState("");
//   const [filtroColore, setFiltroColore] = useState("tutti");
//   const [addDialogOpen, setAddDialogOpen] = useState(false);
//   const [addPraticaId, setAddPraticaId] = useState<string | null>(null);
//   const [addPraticaTitolo, setAddPraticaTitolo] = useState("");
//   const [npTitolo, setNpTitolo] = useState("");
//   const [npDescrizione, setNpDescrizione] = useState("");
//   const [npCompletata, setNpCompletata] = useState(false);
//   const [npData, setNpData] = useState("");
//   const [userId, setUserId] = useState<string | null>(null);
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const { colori } = useColoriPratica();

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
//   }, []);

//   const load = async () => {
//     const { data: pr } = await supabase
//       .from("pratiche")
//       .select("id, titolo, colore, privata, proprietario_id, ordine_situazione, stato")
//       .neq("stato", "chiusa")
//       .order("ordine_situazione", { ascending: true });

//     if (!pr) return;

//     const results: PraticaWithPunti[] = [];
//     for (const p of pr as any[]) {
//       if (p.privata && p.proprietario_id !== userId) continue;
//       const [{ data: punti }, { data: scadenze }] = await Promise.all([
//         supabase.from("punti_situazione").select("*").eq("id_pratica", p.id).eq("completata", false).order("ordine", { ascending: true }),
//         supabase.from("scadenze").select("*").eq("id_pratica", p.id).eq("completata", false).order("data_scadenza", { ascending: true }).limit(1),
//       ]);
//       results.push({
//         id: p.id, titolo: p.titolo, colore: p.colore, privata: p.privata,
//         proprietario_id: p.proprietario_id, ordine_situazione: p.ordine_situazione ?? 0,
//         stato: p.stato,
//         punti_attivi: (punti || []) as PuntoDellaSituazione[],
//         deadline_prossima: (scadenze && scadenze.length > 0 ? scadenze[0] : null) as Scadenza | null,
//       });
//     }
//     setPratiche(results);
//   };

//   useEffect(() => { if (userId !== null) load(); }, [userId]);

//   const filtered = pratiche.filter(p => {
//     if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase())) return false;
//     if (filtroColore !== "tutti") {
//       if (filtroColore === "nessuno") return !p.colore;
//       return p.colore === filtroColore;
//     }
//     return true;
//   });

//   const handleToggle = async (punto: PuntoDellaSituazione) => {
//     await supabase.from("punti_situazione").update({ completata: !punto.completata }).eq("id", punto.id);
//     load();
//   };

//   const handleAdd = async () => {
//     if (!addPraticaId || !npTitolo.trim()) return;
//     const pratica = pratiche.find(p => p.id === addPraticaId);
//     const minOrdine = pratica?.punti_attivi.length ? Math.min(...pratica.punti_attivi.map(p => p.ordine)) - 1 : 0;
//     const { error } = await supabase.from("punti_situazione").insert({
//       id_pratica: addPraticaId, testo: npTitolo.trim(),
//       descrizione: npDescrizione.trim() || null,
//       completata: npCompletata, ordine: minOrdine,
//       data: npData || null,
//     } as any);
//     if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
//     // If date is set, create calendar event with pratica color
//     if (npData) {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (user) {
//         await supabase.from("eventi_calendario").insert({
//           user_id: user.id,
//           titolo: npTitolo.trim(),
//           colore: pratica?.colore || "#3b82f6",
//           data: npData,
//           id_pratica: addPraticaId,
//         } as any);
//       }
//     }
//     toast({ title: "Nota pratica aggiunta" });
//     setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setAddDialogOpen(false); load();
//   };

//   const handlePrint = () => { window.print(); };

//   const handleDragEnd = async (result: DropResult) => {
//     if (!result.destination) return;
//     const items = Array.from(filtered);
//     const [reordered] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, reordered);
//     // Update ordine_situazione and reorder the full array
//     const updatedAll = [...pratiche];
//     for (let i = 0; i < items.length; i++) {
//       const idx = updatedAll.findIndex(p => p.id === items[i].id);
//       if (idx !== -1) updatedAll[idx] = { ...updatedAll[idx], ordine_situazione: i };
//     }
//     // Sort by new ordine_situazione for instant visual update
//     updatedAll.sort((a, b) => a.ordine_situazione - b.ordine_situazione);
//     setPratiche(updatedAll);
//     // Persist to DB in background
//     const updates = items.map((item, i) =>
//       supabase.from("pratiche").update({ ordine_situazione: i } as any).eq("id", item.id)
//     );
//     await Promise.all(updates);
//   };

//   return (
//     <div className="space-y-6">
//       <style>{`
//         @media print {
//           @page { margin: 15mm 12mm; size: A4; }
//           body * { visibility: hidden; }
//           .print-situazione, .print-situazione * { visibility: visible; }
//           .print-situazione { position: absolute; left: 0; top: 0; width: 100%; padding: 0 16px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000 !important; }
//           .no-print { display: none !important; }
//           .print-situazione .print-header { display: flex !important; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
//           .print-situazione .print-header-logo img { height: 40px; width: auto; }
//           .print-situazione .print-header-date { font-size: 26px; font-weight: 800; }
//           .print-situazione .print-pratica-title { font-size: 13px !important; font-weight: 700 !important; text-align: left !important; }
//           .print-situazione .print-deadline { padding-left: 24px; }
//           .print-situazione .print-punto-data { font-size: 9px; color: #555; }
//           .print-situazione .print-card { break-inside: avoid; page-break-inside: avoid; }
//         }
//       `}</style>

//       <div className="flex items-center justify-between no-print">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Punto della Situazione</h1>
//           <p className="text-muted-foreground text-sm mt-1">Stato di avanzamento delle pratiche aperte</p>
//         </div>
//         <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Stampa</Button>
//       </div>

//       <div className="flex gap-2 no-print">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input placeholder="Cerca pratica..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
//         </div>
//         <Select value={filtroColore} onValueChange={setFiltroColore}>
//           <SelectTrigger className="w-36 sm:w-44">
//             <SelectValue placeholder="Tutti i colori" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="tutti">Tutti i colori</SelectItem>
//             <SelectItem value="nessuno">Senza colore</SelectItem>
//             {colori.map(c => (
//               <SelectItem key={c.id} value={c.colore}>
//                 <div className="flex items-center gap-2">
//                   <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.colore }} />
//                   {c.label}
//                 </div>
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="print-situazione">
//         <div className="hidden print:flex print-header">
//           <div className="print-header-logo"><img src={logoNero} alt="Studio Tecnico Ferrante" /></div>
//           <div className="print-header-date">{format(new Date(), "dd/MM/yyyy")}</div>
//         </div>

//         <DragDropContext onDragEnd={handleDragEnd}>
//           <Droppable droppableId="pratiche-situazione">
//             {(provided) => (
//               <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
//                 {filtered.map((p, idx) => (
//                   <Draggable key={p.id} draggableId={p.id} index={idx}>
//                     {(provided, snapshot) => (
//                       <div
//                         ref={provided.innerRef}
//                         {...provided.draggableProps}
//                         className={cn(
//                           "rounded-lg border bg-card p-4 transition-shadow print-card",
//                           snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
//                         )}
//                       >
//                         {/* Header: titolo + deadline */}
//                         <div className="flex items-center gap-3 mb-1">
//                           <div {...provided.dragHandleProps} className="cursor-grab shrink-0 text-muted-foreground no-print">
//                             <GripVertical className="h-5 w-5" />
//                           </div>
//                           {p.colore && <span className="w-3 h-3 rounded-full shrink-0 no-print" style={{ backgroundColor: p.colore }} />}
                          
//                           <div className="flex-1 flex items-center gap-2 min-w-0">
//                             <span
//                               className="font-semibold text-sm cursor-pointer hover:underline truncate print-pratica-title"
//                               onClick={() => navigate(`/pratiche/${p.id}`)}
//                             >
//                               {p.titolo}
//                             </span>
//                             {(p.stato === 'In pausa' || p.stato === 'in_pausa' || p.stato === 'in pausa') && (
//                               <span 
//                                 className="text-[9px] uppercase font-bold border rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 no-print"
//                                 style={{ 
//                                   borderColor: p.colore || 'currentColor', 
//                                   color: p.colore || 'currentColor', 
//                                   backgroundColor: p.colore ? `${p.colore}15` : 'transparent' 
//                                 }}
//                               >
//                                 IN PAUSA
//                               </span>
//                             )}
//                           </div>
                          
//                           <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 no-print"
//                             onClick={() => { setAddPraticaId(p.id); setAddPraticaTitolo(p.titolo); setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setAddDialogOpen(true); }}>
//                             <Plus className="h-4 w-4" />
//                           </Button>
//                         </div>

//                         {/* Deadline prossima */}
//                         {p.deadline_prossima && (
//                           <div className="flex items-center gap-2 ml-8 mb-2 print-deadline">
//                             <Clock className="h-3.5 w-3.5 text-destructive shrink-0" />
//                             <span className={cn(
//                               "text-xs font-medium",
//                               isPast(parseISO(p.deadline_prossima.data_scadenza)) && !isToday(parseISO(p.deadline_prossima.data_scadenza))
//                                 ? "text-destructive"
//                                 : "text-muted-foreground"
//                             )}>
//                               Deadline: {p.deadline_prossima.titolo} — {format(parseISO(p.deadline_prossima.data_scadenza), "dd MMM yyyy", { locale: it })}
//                             </span>
//                           </div>
//                         )}

//                         {/* Punti attivi - centrati */}
//                         {p.punti_attivi.length === 0 ? (
//                           <p className="text-muted-foreground italic text-xs text-center py-1">Nessun punto attivo</p>
//                         ) : (
//                           <div className={cn(
//                             "gap-x-6 gap-y-1 mx-auto max-w-2xl",
//                             p.punti_attivi.length > 3 ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-1"
//                           )}>
//                             {p.punti_attivi.map(punto => (
//                               <div key={punto.id} className="flex items-start gap-2 py-1">
//                                 <Checkbox
//                                   checked={false}
//                                   onCheckedChange={() => handleToggle(punto)}
//                                   className="mt-0.5 shrink-0"
//                                 />
//                                 <div className="min-w-0 flex-1">
//                                   <div className="flex items-center flex-wrap gap-x-2">
//                                     <p className="text-sm">{punto.testo}</p>
//                                     {punto.data && (
//                                       <span className="text-[11px] font-medium text-primary whitespace-nowrap shrink-0 print-punto-data">
//                                         <CalendarIcon className="h-3 w-3 inline mr-0.5" />
//                                         {punto.data.includes("T")
//                                           ? format(parseISO(punto.data), "dd/MM/yy HH:mm")
//                                           : format(parseISO(punto.data), "dd/MM/yy")}
//                                       </span>
//                                     )}
//                                   </div>
//                                   {punto.descrizione && <p className="text-xs text-muted-foreground">{punto.descrizione}</p>}
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//                 {filtered.length === 0 && (
//                   <p className="text-center text-muted-foreground py-8">Nessuna pratica aperta trovata.</p>
//                 )}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//       </div>

//       <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
//         <DialogContent className="w-[95vw] sm:max-w-md">
//           <DialogHeader><DialogTitle>Nuova nota pratica — {addPraticaTitolo}</DialogTitle></DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label>Titolo</Label>
//               <Input placeholder="Titolo della nota..." value={npTitolo} onChange={e => setNpTitolo(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Descrizione <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
//               <Textarea placeholder="Descrizione..." value={npDescrizione} onChange={e => setNpDescrizione(e.target.value)} rows={3} />
//             </div>
//             <div className="flex items-center gap-3">
//               <Switch checked={npCompletata} onCheckedChange={setNpCompletata} />
//               <Label>{npCompletata ? "Fatto" : "Da fare"}</Label>
//             </div>
//             <div className="space-y-2">
//               <Label>Data e Orario <span className="text-muted-foreground text-xs">(opzionale — apparirà nel calendario)</span></Label>
//               <Input type="datetime-local" value={npData} onChange={e => setNpData(e.target.value)} />
//             </div>
//             <Button className="w-full h-12" onClick={handleAdd} disabled={!npTitolo.trim()}>Aggiungi</Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TimePicker from "@/components/TimePicker";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Printer, GripVertical, Clock, CalendarIcon } from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useColoriPratica } from "@/hooks/use-colori-pratica";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import type { PuntoDellaSituazione, Scadenza } from "@/types/database";
import logoNero from "@/assets/logo-scritta-grande.png";

type PraticaWithPunti = {
  id: string;
  titolo: string;
  colore: string | null;
  privata: boolean;
  proprietario_id: string;
  ordine_situazione: number;
  stato?: string;
  punti_attivi: PuntoDellaSituazione[];
  deadline_prossima: Scadenza | null;
};

export default function PuntoSituazione() {
  const [pratiche, setPratiche] = useState<PraticaWithPunti[]>([]);
  const [ricerca, setRicerca] = useState("");
  const [filtroColore, setFiltroColore] = useState("tutti");
  
  // States Modale
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addPraticaId, setAddPraticaId] = useState<string | null>(null);
  const [addPraticaTitolo, setAddPraticaTitolo] = useState("");
  const [npTitolo, setNpTitolo] = useState("");
  const [npDescrizione, setNpDescrizione] = useState("");
  const [npCompletata, setNpCompletata] = useState(false);
  const [npData, setNpData] = useState("");
  const [npOra, setNpOra] = useState("");
  const [npMinuti, setNpMinuti] = useState("");
  const [npOraFineH, setNpOraFineH] = useState("");
  const [npOraFineM, setNpOraFineM] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { colori } = useColoriPratica();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const load = async () => {
    const { data: pr } = await supabase
      .from("pratiche")
      .select("id, titolo, colore, privata, proprietario_id, ordine_situazione, stato")
      .neq("stato", "chiusa")
      .order("ordine_situazione", { ascending: true });

    if (!pr) return;

    const results: PraticaWithPunti[] = [];
    for (const p of pr as any[]) {
      if (p.privata && p.proprietario_id !== userId) continue;
      const [{ data: punti }, { data: scadenze }] = await Promise.all([
        supabase.from("punti_situazione").select("*").eq("id_pratica", p.id).eq("completata", false).order("ordine", { ascending: true }),
        supabase.from("scadenze").select("*").eq("id_pratica", p.id).eq("completata", false).order("data_scadenza", { ascending: true }).limit(1),
      ]);
      results.push({
        id: p.id, titolo: p.titolo, colore: p.colore, privata: p.privata,
        proprietario_id: p.proprietario_id, ordine_situazione: p.ordine_situazione ?? 0,
        stato: p.stato,
        punti_attivi: (punti || []) as PuntoDellaSituazione[],
        deadline_prossima: (scadenze && scadenze.length > 0 ? scadenze[0] : null) as Scadenza | null,
      });
    }
    setPratiche(results);
  };

  useEffect(() => { if (userId !== null) load(); }, [userId]);

  const filtered = pratiche.filter(p => {
    if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase())) return false;
    if (filtroColore !== "tutti") {
      if (filtroColore === "nessuno") return !p.colore;
      return p.colore === filtroColore;
    }
    return true;
  });

  const handleToggle = async (punto: PuntoDellaSituazione) => {
    await supabase.from("punti_situazione").update({ completata: !punto.completata }).eq("id", punto.id);
    load();
  };

  const getOraInizio = () => {
    if (npOra && npMinuti) return `${npOra}:${npMinuti}`;
    return null;
  };

  const getOraFine = () => {
    if (npOraFineH && npOraFineM) return `${npOraFineH}:${npOraFineM}`;
    return null;
  };

  const handleAdd = async () => {
    if (!addPraticaId || !npTitolo.trim()) return;
    const pratica = pratiche.find(p => p.id === addPraticaId);
    const minOrdine = pratica?.punti_attivi.length ? Math.min(...pratica.punti_attivi.map(p => p.ordine)) - 1 : 0;
    
    const oraInizio = getOraInizio();
    const oraFine = getOraFine();

    const { error } = await supabase.from("punti_situazione").insert({
      id_pratica: addPraticaId, testo: npTitolo.trim(),
      descrizione: npDescrizione.trim() || null,
      completata: npCompletata, ordine: minOrdine,
      data: npData || null,
      ora_inizio: npData && oraInizio ? oraInizio : null,
      ora_fine: npData && oraFine ? oraFine : null,
    } as any);
    
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    
    if (npData) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("eventi_calendario").insert({
          user_id: user.id,
          titolo: npTitolo.trim(),
          colore: pratica?.colore || "#3b82f6",
          data: npData,
          ora_inizio: oraInizio || null,
          id_pratica: addPraticaId,
        } as any);
      }
    }
    
    toast({ title: "Nota pratica aggiunta" });
    setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setNpOra(""); setNpMinuti(""); setNpOraFineH(""); setNpOraFineM(""); setAddDialogOpen(false); load();
  };

  const handlePrint = () => { window.print(); };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(filtered);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    const updatedAll = [...pratiche];
    for (let i = 0; i < items.length; i++) {
      const idx = updatedAll.findIndex(p => p.id === items[i].id);
      if (idx !== -1) updatedAll[idx] = { ...updatedAll[idx], ordine_situazione: i };
    }
    updatedAll.sort((a, b) => a.ordine_situazione - b.ordine_situazione);
    setPratiche(updatedAll);
    const updates = items.map((item, i) =>
      supabase.from("pratiche").update({ ordine_situazione: i } as any).eq("id", item.id)
    );
    await Promise.all(updates);
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { margin: 15mm 12mm; size: A4; }
          body * { visibility: hidden; }
          .print-situazione, .print-situazione * { visibility: visible; }
          .print-situazione { position: absolute; left: 0; top: 0; width: 100%; padding: 0 16px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000 !important; }
          .no-print { display: none !important; }
          .print-situazione .print-header { display: flex !important; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
          .print-situazione .print-header-logo img { height: 40px; width: auto; }
          .print-situazione .print-header-date { font-size: 26px; font-weight: 800; }
          .print-situazione .print-pratica-title { font-size: 13px !important; font-weight: 700 !important; text-align: left !important; }
          .print-situazione .print-deadline { padding-left: 24px; }
          .print-situazione .print-punto-data { font-size: 9px; color: #555; }
          .print-situazione .print-card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Punto della Situazione</h1>
          <p className="text-muted-foreground text-sm mt-1">Stato di avanzamento delle pratiche aperte</p>
        </div>
        <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" /> Stampa</Button>
      </div>

      <div className="flex gap-2 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca pratica..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
        </div>
        <Select value={filtroColore} onValueChange={setFiltroColore}>
          <SelectTrigger className="w-36 sm:w-44">
            <SelectValue placeholder="Tutti i colori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti i colori</SelectItem>
            <SelectItem value="nessuno">Senza colore</SelectItem>
            {colori.map(c => (
              <SelectItem key={c.id} value={c.colore}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.colore }} />
                  {c.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="print-situazione">
        <div className="hidden print:flex print-header">
          <div className="print-header-logo"><img src={logoNero} alt="Studio Tecnico Ferrante" /></div>
          <div className="print-header-date">{format(new Date(), "dd/MM/yyyy")}</div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="pratiche-situazione">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {filtered.map((p, idx) => (
                  <Draggable key={p.id} draggableId={p.id} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "rounded-lg border bg-card p-4 transition-shadow print-card",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div {...provided.dragHandleProps} className="cursor-grab shrink-0 text-muted-foreground no-print">
                            <GripVertical className="h-5 w-5" />
                          </div>
                          {p.colore && <span className="w-3 h-3 rounded-full shrink-0 no-print" style={{ backgroundColor: p.colore }} />}
                          
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span
                              className="font-semibold text-sm cursor-pointer hover:underline truncate print-pratica-title"
                              onClick={() => navigate(`/pratiche/${p.id}`)}
                            >
                              {p.titolo}
                            </span>
                            {(p.stato === 'In pausa' || p.stato === 'in_pausa' || p.stato === 'in pausa') && (
                              <span 
                                className="text-[9px] uppercase font-bold border rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 "
                                style={{ 
                                  borderColor: p.colore || 'currentColor', 
                                  color: p.colore || 'currentColor', 
                                  backgroundColor: p.colore ? `${p.colore}15` : 'transparent' 
                                }}
                              >
                                IN PAUSA
                              </span>
                            )}
                          </div>
                          
                          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 no-print"
                            onClick={() => { setAddPraticaId(p.id); setAddPraticaTitolo(p.titolo); setNpTitolo(""); setNpDescrizione(""); setNpCompletata(false); setNpData(""); setNpOra(""); setNpMinuti(""); setAddDialogOpen(true); }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {p.deadline_prossima && (
                          <div className="flex items-center gap-2 ml-8 mb-2 print-deadline">
                            <Clock className="h-3.5 w-3.5 text-destructive shrink-0" />
                            <span className={cn(
                              "text-xs font-medium",
                              isPast(parseISO(p.deadline_prossima.data_scadenza)) && !isToday(parseISO(p.deadline_prossima.data_scadenza))
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}>
                              Deadline: {p.deadline_prossima.titolo} — {format(parseISO(p.deadline_prossima.data_scadenza), "dd MMM yyyy", { locale: it })}
                            </span>
                          </div>
                        )}

                        {p.punti_attivi.length === 0 ? (
                          <p className="text-muted-foreground italic text-xs text-center py-1">Nessun punto attivo</p>
                        ) : (
                          <div className={cn(
                            "gap-x-6 gap-y-1 mx-auto max-w-2xl",
                            p.punti_attivi.length > 3 ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-1"
                          )}>
                            {p.punti_attivi.map(punto => (
                              <div key={punto.id} className="flex items-start gap-2 py-1">
                                <Checkbox
                                  checked={false}
                                  onCheckedChange={() => handleToggle(punto)}
                                  className="mt-0.5 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center flex-wrap gap-x-2">
                                    <p className="text-sm">{punto.testo}</p>
                                    {punto.data && (
                                      <span className="text-[11px] font-medium text-primary whitespace-nowrap shrink-0 print-punto-data">
                                        <CalendarIcon className="h-3 w-3 inline mr-0.5" />
                                        {
                                          punto.ora_inizio 
                                          ? format(parseISO(punto.data), "dd/MM/yy") + ` ${punto.ora_inizio.slice(0, 5)}`
                                          : format(parseISO(punto.data), "dd/MM/yy")
                                        }
                                        {/* {punto.data.includes("T")
                                          ? format(parseISO(punto.data), "dd/MM/yy HH:mm")
                                          : format(parseISO(punto.data), "dd/MM/yy")} */}
                                        
                                      </span>
                                    )}
                                  </div>
                                  {punto.descrizione && <p className="text-xs text-muted-foreground">{punto.descrizione}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {filtered.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nessuna pratica aperta trovata.</p>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md top-[7%] translate-y-0 sm:top-[50%] sm:-translate-y-[50%] mb-10 max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuova nota pratica — {addPraticaTitolo}</DialogTitle></DialogHeader>
          <Button className="w-full h-12 sm:hidden" onClick={handleAdd} disabled={!npTitolo.trim()}>Aggiungi</Button>
          <div className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input placeholder="Titolo della nota..." value={npTitolo} onChange={e => setNpTitolo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrizione <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
              <Textarea placeholder="Descrizione..." value={npDescrizione} onChange={e => setNpDescrizione(e.target.value)} rows={3} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={npCompletata} onCheckedChange={setNpCompletata} />
              <Label>{npCompletata ? "Fatto" : "Da fare"}</Label>
            </div>
            <div className="space-y-2">
              <Label>Data <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
              <Input type="date" value={npData} onChange={e => {
                setNpData(e.target.value);
                if (!e.target.value) { setNpOra(""); setNpMinuti(""); setNpOraFineH(""); setNpOraFineM(""); }
              }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ora inizio <span className="text-muted-foreground">(opz.)</span></Label>
                <TimePicker ora={npOra} minuti={npMinuti} onOraChange={setNpOra} onMinutiChange={setNpMinuti} disabled={!npData} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ora fine <span className="text-muted-foreground">(opz.)</span></Label>
                <TimePicker ora={npOraFineH} minuti={npOraFineM} onOraChange={setNpOraFineH} onMinutiChange={setNpOraFineM} disabled={!npData} />
              </div>
            </div>
            <Button className="w-full h-12 mt-2 hidden sm:flex" onClick={handleAdd} disabled={!npTitolo.trim()}>Aggiungi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}