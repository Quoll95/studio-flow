// // // // /* eslint-disable @typescript-eslint/no-explicit-any */
// // // // import { useEffect, useState } from "react";
// // // // import { useSearchParams, useNavigate } from "react-router-dom";
// // // // import { supabase } from "@/integrations/supabase/client";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Input } from "@/components/ui/input";
// // // // import { Label } from "@/components/ui/label";
// // // // import { Badge } from "@/components/ui/badge";
// // // // import { Card, CardContent } from "@/components/ui/card";
// // // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // // // import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// // // // import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// // // // import { Textarea } from "@/components/ui/textarea";
// // // // import { Switch } from "@/components/ui/switch";
// // // // import { Calendar } from "@/components/ui/calendar";
// // // // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// // // // import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// // // // import { useToast } from "@/hooks/use-toast";
// // // // import { Plus, Search, Lock, CalendarIcon, Euro, Trash2, MoreVertical, Edit, ArrowUp, ArrowDown } from "lucide-react";
// // // // import { logAudit } from "@/lib/audit";
// // // // import { format, parseISO } from "date-fns";
// // // // import { it } from "date-fns/locale";
// // // // import { cn } from "@/lib/utils";
// // // // import { useStatiPratica } from "@/hooks/use-stati-pratica";
// // // // import { useColoriPratica } from "@/hooks/use-colori-pratica";
// // // // import type { Pratica, Cliente, TipoPratica, StatoPratica } from "@/types/database";

// // // // type PraticaForm = {
// // // //   titolo: string;
// // // //   descrizione: string;
// // // //   id_cliente: string;
// // // //   id_tipo: string;
// // // //   cliente_nome: string;
// // // //   privata: boolean;
// // // //   stato: StatoPratica;
// // // //   colore: string;
// // // //   guadagno_preventivato: string;
// // // //   data_preventivata_fine: string;
// // // // };

// // // // type ScadenzaEntry = { titolo: string; data: Date | undefined };

// // // // const emptyForm: PraticaForm = { titolo: "", descrizione: "", id_cliente: "", id_tipo: "", cliente_nome: "", privata: false, stato: "aperta", colore: "", guadagno_preventivato: "0", data_preventivata_fine: "" };

// // // // export default function Pratiche() {
// // // //   const [searchParams, setSearchParams] = useSearchParams();
// // // //   const navigate = useNavigate();
// // // //   const [pratiche, setPratiche] = useState<Pratica[]>([]);
// // // //   const [clienti, setClienti] = useState<Cliente[]>([]);
// // // //   const [tipi, setTipi] = useState<TipoPratica[]>([]);
// // // //   const [filtroStato, setFiltroStato] = useState<string>(searchParams.get("stato") || "tutti");
// // // //   const [ricerca, setRicerca] = useState("");
// // // //   const [dialogOpen, setDialogOpen] = useState(false);
// // // //   const [editId, setEditId] = useState<string | null>(null);
// // // //   const [form, setForm] = useState<PraticaForm>(emptyForm);
// // // //   const [clienteMode, setClienteMode] = useState<"registrato" | "libero">("registrato");
// // // //   const [scadenze, setScadenze] = useState<ScadenzaEntry[]>([]);
// // // //   const [ordinaData, setOrdinaData] = useState<"asc" | "desc">("desc");
// // // //   const [deleteId, setDeleteId] = useState<string | null>(null);
// // // //   const [deleteTitolo, setDeleteTitolo] = useState("");
// // // //   const { toast } = useToast();
// // // //   const { stati, getLabel, getColore } = useStatiPratica();
// // // //   const { colori } = useColoriPratica();

// // // //   const load = async () => {
// // // //     const { data } = await supabase.from("pratiche").select("*, clienti(*), tipi_pratica(*)").order("ordine_situazione", { ascending: true });
// // // //     setPratiche((data as Pratica[]) || []);
// // // //     const { data: c } = await supabase.from("clienti").select("*").order("nome_completo");
// // // //     setClienti((c as Cliente[]) || []);
// // // //     const { data: t } = await supabase.from("tipi_pratica").select("*").order("label");
// // // //     setTipi((t as TipoPratica[]) || []);
// // // //   };

// // // //   useEffect(() => { load(); }, [ordinaData]);
// // // //   useEffect(() => { const stato = searchParams.get("stato"); if (stato) setFiltroStato(stato); }, [searchParams]);
// // // //   useEffect(() => {
// // // //     const modificaId = searchParams.get("modifica");
// // // //     if (modificaId && pratiche.length > 0) {
// // // //       const p = pratiche.find(pr => pr.id === modificaId);
// // // //       if (p) { openEdit(p); searchParams.delete("modifica"); setSearchParams(searchParams, { replace: true }); }
// // // //     }
// // // //   }, [searchParams, pratiche]);

// // // //   const filtered = pratiche.filter((p) => {
// // // //     if (filtroStato !== "tutti" && p.stato !== filtroStato) return false;
// // // //     const clientName = p.clienti?.nome_completo || p.cliente_nome || "";
// // // //     if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase()) && !clientName.toLowerCase().includes(ricerca.toLowerCase())) return false;
// // // //     return true;
// // // //   }).sort((a, b) => {
// // // //     // Without filters, use punto della situazione order; closed ones last
// // // //     if (filtroStato === "tutti" && !ricerca) {
// // // //       const aChiusa = a.stato === "chiusa" ? 1 : 0;
// // // //       const bChiusa = b.stato === "chiusa" ? 1 : 0;
// // // //       if (aChiusa !== bChiusa) return aChiusa - bChiusa;
// // // //       return (a.ordine_situazione ?? 0) - (b.ordine_situazione ?? 0);
// // // //     }
// // // //     return 0;
// // // //   });

// // // //   const openEdit = (p: Pratica) => {
// // // //     setEditId(p.id);
// // // //     setClienteMode(p.id_cliente ? "registrato" : "libero");
// // // //     setForm({
// // // //       titolo: p.titolo, descrizione: p.descrizione || "", id_cliente: p.id_cliente || "",
// // // //       id_tipo: p.id_tipo || "", cliente_nome: p.cliente_nome || "", privata: p.privata,
// // // //       stato: p.stato, colore: p.colore || "",
// // // //       guadagno_preventivato: String(p.guadagno_preventivato ?? 0),
// // // //       data_preventivata_fine: p.data_preventivata_fine || "",
// // // //     });
// // // //     setScadenze([]);
// // // //     setDialogOpen(true);
// // // //   };

// // // //   const openCreate = () => { setEditId(null); setForm(emptyForm); setClienteMode("registrato"); setScadenze([]); setDialogOpen(true); };

// // // //   const handleSubmit = async (e: React.FormEvent) => {
// // // //     e.preventDefault();
// // // //     const { data: { user } } = await supabase.auth.getUser();
// // // //     if (!user) return;

// // // //     let finalIdCliente = clienteMode === "registrato" && form.id_cliente ? form.id_cliente : null;
// // // //     let finalClienteNome = clienteMode === "libero" && form.cliente_nome ? form.cliente_nome : null;

// // // //     if (clienteMode === "libero" && form.cliente_nome.trim()) {
// // // //       const nomeNormalized = form.cliente_nome.trim().toLowerCase().replace(/\s+/g, " ");
// // // //       const existing = clienti.find(c => c.nome_completo.trim().toLowerCase().replace(/\s+/g, " ") === nomeNormalized);
// // // //       if (existing) { finalIdCliente = existing.id; finalClienteNome = null; }
// // // //       else {
// // // //         const { data: newCliente } = await supabase.from("clienti").insert({ nome_completo: form.cliente_nome.trim() }).select().single();
// // // //         if (newCliente) { finalIdCliente = newCliente.id; finalClienteNome = null; }
// // // //       }
// // // //     }

// // // //     const payload: any = {
// // // //       titolo: form.titolo, descrizione: form.descrizione || null,
// // // //       id_cliente: finalIdCliente, cliente_nome: finalClienteNome,
// // // //       id_tipo: form.id_tipo || null, privata: form.privata, stato: form.stato,
// // // //       colore: form.colore || null,
// // // //       guadagno_preventivato: parseFloat(form.guadagno_preventivato) || 0,
// // // //       data_preventivata_fine: form.data_preventivata_fine || null,
// // // //     };

// // // //     let praticaId = editId;

// // // //     if (editId) {
// // // //       const { error } = await supabase.from("pratiche").update(payload).eq("id", editId);
// // // //       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// // // //       await logAudit("Modifica pratica", `Pratica "${form.titolo}" modificata`);
// // // //       toast({ title: "Pratica aggiornata" });
// // // //     } else {
// // // //       const { error, data: newPratica } = await supabase.from("pratiche").insert({ ...payload, proprietario_id: user.id }).select().single();
// // // //       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// // // //       praticaId = newPratica.id;
// // // //       await logAudit("Creazione pratica", `Pratica "${form.titolo}" creata`);
// // // //       toast({ title: "Pratica creata" });
// // // //     }

// // // //     const validScadenze = scadenze.filter(s => s.data);
// // // //     if (validScadenze.length > 0 && praticaId) {
// // // //       await supabase.from("scadenze").insert(validScadenze.map(s => ({ titolo: s.titolo || form.titolo, data_scadenza: format(s.data!, "yyyy-MM-dd"), id_pratica: praticaId })));
// // // //       // Also create calendar events for each deadline
// // // //       const { data: { user: currentUser } } = await supabase.auth.getUser();
// // // //       if (currentUser) {
// // // //         await (supabase as any).from("eventi_calendario").insert(validScadenze.map(s => ({
// // // //           user_id: currentUser.id,
// // // //           titolo: `📌 ${s.titolo || form.titolo}`,
// // // //           colore: "#ef4444",
// // // //           data: format(s.data!, "yyyy-MM-dd"),
// // // //           id_pratica: praticaId,
// // // //         })));
// // // //       }
// // // //       await logAudit("Nuove scadenze", `${validScadenze.length} scadenze aggiunte alla pratica "${form.titolo}"`);
// // // //     }

// // // //     setDialogOpen(false); setEditId(null); setForm(emptyForm); load();
// // // //   };

// // // //   const handleDelete = async () => {
// // // //     if (!deleteId) return;
// // // //     await supabase.from("scadenze").delete().eq("id_pratica", deleteId);
// // // //     const { error } = await supabase.from("pratiche").delete().eq("id", deleteId);
// // // //     if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// // // //     await logAudit("Eliminazione pratica", `Pratica "${deleteTitolo}" eliminata`);
// // // //     toast({ title: "Pratica eliminata" }); setDeleteId(null); load();
// // // //   };

// // // //   const handleFiltroChange = (val: string) => {
// // // //     setFiltroStato(val);
// // // //     if (val === "tutti") { searchParams.delete("stato"); } else { searchParams.set("stato", val); }
// // // //     setSearchParams(searchParams, { replace: true });
// // // //   };

// // // //   const toggleSort = () => setOrdinaData(prev => prev === "desc" ? "asc" : "desc");
// // // //   const getClientName = (p: Pratica) => p.clienti?.nome_completo || p.cliente_nome || "—";
// // // //   const SortIcon = ordinaData === "desc" ? ArrowDown : ArrowUp;

// // // //   return (
// // // //     <div className="space-y-6">
// // // //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
// // // //         <div>
// // // //           <h1 className="text-2xl font-bold tracking-tight">Pratiche</h1>
// // // //           <p className="text-muted-foreground text-sm mt-1">{pratiche.length} pratiche totali</p>
// // // //         </div>
// // // //         <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuova Pratica</Button>
// // // //       </div>

// // // //       {/* Dialog create/edit */}
// // // //       <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
// // // //         <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
// // // //           <DialogHeader><DialogTitle>{editId ? "Modifica Pratica" : "Nuova Pratica"}</DialogTitle></DialogHeader>
// // // //           <form onSubmit={handleSubmit} className="space-y-4">
// // // //             <div className="space-y-2"><Label>Titolo</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} required /></div>
// // // //             <div className="space-y-2"><Label>Descrizione</Label><Textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} /></div>
// // // //             <div className="space-y-2">
// // // //               <Label>Cliente</Label>
// // // //               <div className="flex gap-2 mb-2">
// // // //                 <Button type="button" size="sm" variant={clienteMode === "registrato" ? "default" : "outline"} onClick={() => setClienteMode("registrato")}>Registrato</Button>
// // // //                 <Button type="button" size="sm" variant={clienteMode === "libero" ? "default" : "outline"} onClick={() => setClienteMode("libero")}>Non registrato</Button>
// // // //               </div>
// // // //               {clienteMode === "registrato" ? (
// // // //                 <Select value={form.id_cliente} onValueChange={v => setForm(f => ({ ...f, id_cliente: v }))}><SelectTrigger><SelectValue placeholder="Seleziona cliente" /></SelectTrigger><SelectContent>{clienti.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent></Select>
// // // //               ) : (
// // // //                 <Input placeholder="Nome cliente" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} />
// // // //               )}
// // // //             </div>
// // // //             <div className="space-y-2">
// // // //               <Label>Tipo</Label>
// // // //               <Select value={form.id_tipo} onValueChange={v => setForm(f => ({ ...f, id_tipo: v }))}><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger><SelectContent>{tipi.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
// // // //             </div>
// // // //             <div className="space-y-2">
// // // //               <Label>Stato</Label>
// // // //               <Select value={form.stato} onValueChange={v => setForm(f => ({ ...f, stato: v as StatoPratica }))}>
// // // //                 <SelectTrigger><SelectValue /></SelectTrigger>
// // // //                 <SelectContent>{stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}</SelectContent>
// // // //               </Select>
// // // //             </div>
// // // //             {/* Colore pratica */}
// // // //             <div className="space-y-2">
// // // //               <Label>Colore pratica</Label>
// // // //               <div className="flex gap-2 flex-wrap">
// // // //                 <button type="button" className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center text-xs ${!form.colore ? "border-foreground scale-110" : "border-muted"}`}
// // // //                   style={{ backgroundColor: "transparent" }} onClick={() => setForm(f => ({ ...f, colore: "" }))}>—</button>
// // // //                 {colori.map(c => (
// // // //                   <button key={c.id} type="button"
// // // //                     className={`w-8 h-8 rounded-full border-2 transition-transform ${form.colore === c.colore ? "border-foreground scale-110" : "border-transparent"}`}
// // // //                     style={{ backgroundColor: c.colore }} onClick={() => setForm(f => ({ ...f, colore: c.colore }))}
// // // //                     title={c.label} />
// // // //                 ))}
// // // //               </div>
// // // //             </div>
// // // //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
// // // //               <div className="space-y-2">
// // // //                 <Label className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" /> Preventivato (€)</Label>
// // // //                 <Input type="number" step="0.01" min="0" value={form.guadagno_preventivato} onChange={e => setForm(f => ({ ...f, guadagno_preventivato: e.target.value }))} />
// // // //               </div>
// // // //               <div className="space-y-2">
// // // //                 <Label>Data fine stimata</Label>
// // // //                 <Input type="date" value={form.data_preventivata_fine} onChange={e => setForm(f => ({ ...f, data_preventivata_fine: e.target.value }))} />
// // // //               </div>
// // // //             </div>
// // // //             <div className="flex items-center gap-3"><Switch checked={form.privata} onCheckedChange={v => setForm(f => ({ ...f, privata: v }))} /><Label>Pratica privata</Label></div>

// // // //             <div className="border-t pt-4 space-y-3">
// // // //               <div className="flex items-center justify-between">
// // // //                 <Label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Scadenze</Label>
// // // //                 <Button type="button" variant="outline" size="sm" onClick={() => setScadenze(prev => [...prev, { titolo: "", data: undefined }])}><Plus className="h-3 w-3 mr-1" /> Aggiungi</Button>
// // // //               </div>
// // // //               {scadenze.map((s, idx) => (
// // // //                 <div key={idx} className="flex gap-2 items-start">
// // // //                   <div className="flex-1 space-y-2">
// // // //                     <Input placeholder={`Titolo (default: ${form.titolo || "titolo pratica"})`} value={s.titolo} onChange={e => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, titolo: e.target.value } : x))} />
// // // //                     <Popover>
// // // //                       <PopoverTrigger asChild>
// // // //                         <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !s.data && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{s.data ? format(s.data, "dd/MM/yyyy") : "Seleziona data"}</Button>
// // // //                       </PopoverTrigger>
// // // //                       <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={s.data} onSelect={d => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, data: d } : x))} locale={it} className="p-3 pointer-events-auto" /></PopoverContent>
// // // //                     </Popover>
// // // //                   </div>
// // // //                   <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => setScadenze(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
// // // //                 </div>
// // // //               ))}
// // // //               {scadenze.length === 0 && <p className="text-xs text-muted-foreground">Nessuna scadenza aggiunta.</p>}
// // // //             </div>

// // // //             <Button type="submit" className="w-full h-12">{editId ? "Salva Modifiche" : "Crea Pratica"}</Button>
// // // //           </form>
// // // //         </DialogContent>
// // // //       </Dialog>

// // // //       {/* Delete confirmation */}
// // // //       <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
// // // //         <AlertDialogContent>
// // // //           <AlertDialogHeader>
// // // //             <AlertDialogTitle>Eliminare la pratica?</AlertDialogTitle>
// // // //             <AlertDialogDescription>Questa azione è irreversibile. La pratica "{deleteTitolo}" e tutte le scadenze collegate verranno eliminate.</AlertDialogDescription>
// // // //           </AlertDialogHeader>
// // // //           <AlertDialogFooter>
// // // //             <AlertDialogCancel>Annulla</AlertDialogCancel>
// // // //             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
// // // //           </AlertDialogFooter>
// // // //         </AlertDialogContent>
// // // //       </AlertDialog>

// // // //       {/* Filters */}
// // // //       <div className="flex flex-col sm:flex-row gap-3">
// // // //         <div className="relative flex-1">
// // // //           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// // // //           <Input placeholder="Cerca per titolo o cliente..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
// // // //         </div>
// // // //         <div className="flex gap-2">
// // // //           <Button variant="outline" size="icon" onClick={toggleSort} title={ordinaData === "desc" ? "Più recenti prima" : "Più vecchie prima"}>
// // // //             <SortIcon className="h-4 w-4" />
// // // //           </Button>
// // // //           <Select value={filtroStato} onValueChange={handleFiltroChange}>
// // // //             <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
// // // //             <SelectContent>
// // // //               <SelectItem value="tutti">Tutti gli stati</SelectItem>
// // // //               {stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}
// // // //             </SelectContent>
// // // //           </Select>
// // // //         </div>
// // // //       </div>

// // // //       {/* Desktop table */}
// // // //       <div className="hidden md:block">
// // // //         <Card>
// // // //           <CardContent className="p-0">
// // // //             <div className="overflow-x-auto">
// // // //               <table className="w-full text-sm">
// // // //                 <thead>
// // // //                   <tr className="border-b bg-muted/30">
// // // //                     <th className="w-[20px] p-3"></th>
// // // //                     <th className="text-left p-3 font-medium text-muted-foreground">Titolo</th>
// // // //                     <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
// // // //                     <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
// // // //                     <th className="text-left p-3 font-medium text-muted-foreground">
// // // //                       <button onClick={toggleSort} className="flex items-center gap-1 hover:text-foreground transition-colors">Data <SortIcon className="h-3 w-3" /></button>
// // // //                     </th>
// // // //                     <th className="text-left p-3 font-medium text-muted-foreground">Stato</th>
// // // //                     <th className="text-left p-3 font-medium text-muted-foreground w-16"></th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {filtered.map(p => (
// // // //                     <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/pratiche/${p.id}`)}>
// // // //                       <td className="p-3">{p.colore && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.colore }} />}</td>
// // // //                       <td className="p-3 font-medium max-w-[200px] truncate">{p.titolo}</td>
// // // //                       <td className="p-3 text-muted-foreground max-w-[150px] truncate">{getClientName(p)}</td>
// // // //                       <td className="p-3 text-muted-foreground hidden lg:table-cell">{p.tipi_pratica?.label || "—"}</td>
// // // //                       <td className="p-3 text-muted-foreground whitespace-nowrap">{format(parseISO(p.created_at), "dd/MM/yyyy")}</td>
// // // //                       <td className="p-3">
// // // //                         <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
// // // //                       </td>
// // // //                       <td className="p-3">
// // // //                         <div className="flex items-center gap-1">
// // // //                           {p.privata && <Lock className="h-4 w-4 text-muted-foreground" />}
// // // //                           <DropdownMenu>
// // // //                             <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
// // // //                               <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
// // // //                             </DropdownMenuTrigger>
// // // //                             <DropdownMenuContent align="end">
// // // //                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
// // // //                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
// // // //                             </DropdownMenuContent>
// // // //                           </DropdownMenu>
// // // //                         </div>
// // // //                       </td>
// // // //                     </tr>
// // // //                   ))}
// // // //                 </tbody>
// // // //               </table>
// // // //             </div>
// // // //             {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Nessuna pratica trovata.</p>}
// // // //           </CardContent>
// // // //         </Card>
// // // //       </div>

// // // //       {/* Mobile cards */}
// // // //       <div className="md:hidden space-y-3">
// // // //         {filtered.map(p => (
// // // //           <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/pratiche/${p.id}`)}>
// // // //             <CardContent className="p-4">
// // // //               <div className="flex items-start justify-between gap-2">
// // // //                 <div className="min-w-0 flex-1">
// // // //                   <p className="font-medium flex items-center gap-2 truncate">
// // // //                     {p.colore && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
// // // //                     {p.titolo} {p.privata && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
// // // //                   </p>
// // // //                   <p className="text-xs text-muted-foreground mt-1 truncate">{getClientName(p)} · {p.tipi_pratica?.label || "—"}</p>
// // // //                   <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(p.created_at), "dd/MM/yyyy")}</p>
// // // //                 </div>
// // // //                 <div className="flex items-center gap-1 shrink-0">
// // // //                   <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
// // // //                   <DropdownMenu>
// // // //                     <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
// // // //                       <Button variant="ghost" size="icon" className="h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
// // // //                     </DropdownMenuTrigger>
// // // //                     <DropdownMenuContent align="end">
// // // //                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
// // // //                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
// // // //                     </DropdownMenuContent>
// // // //                   </DropdownMenu>
// // // //                 </div>
// // // //               </div>
// // // //             </CardContent>
// // // //           </Card>
// // // //         ))}
// // // //         {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nessuna pratica trovata.</p>}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }


// // // /* eslint-disable @typescript-eslint/no-explicit-any */
// // // import { useEffect, useState } from "react";
// // // import { useSearchParams, useNavigate } from "react-router-dom";
// // // import { supabase } from "@/integrations/supabase/client";
// // // import { Button } from "@/components/ui/button";
// // // import { Input } from "@/components/ui/input";
// // // import { Label } from "@/components/ui/label";
// // // import { Badge } from "@/components/ui/badge";
// // // import { Card, CardContent } from "@/components/ui/card";
// // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // // import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// // // import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// // // import { Textarea } from "@/components/ui/textarea";
// // // import { Switch } from "@/components/ui/switch";
// // // import { Calendar } from "@/components/ui/calendar";
// // // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// // // import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// // // import { useToast } from "@/hooks/use-toast";
// // // import { Plus, Search, Lock, CalendarIcon, Euro, Trash2, MoreVertical, Edit, ArrowUp, ArrowDown, ListOrdered } from "lucide-react";
// // // import { logAudit } from "@/lib/audit";
// // // import { format, parseISO } from "date-fns";
// // // import { it } from "date-fns/locale";
// // // import { cn } from "@/lib/utils";
// // // import { useStatiPratica } from "@/hooks/use-stati-pratica";
// // // import { useColoriPratica } from "@/hooks/use-colori-pratica";
// // // import type { Pratica, Cliente, TipoPratica, StatoPratica } from "@/types/database";

// // // type PraticaForm = {
// // //   titolo: string;
// // //   descrizione: string;
// // //   id_cliente: string;
// // //   id_tipo: string;
// // //   cliente_nome: string;
// // //   privata: boolean;
// // //   stato: StatoPratica;
// // //   colore: string;
// // //   guadagno_preventivato: string;
// // //   data_preventivata_fine: string;
// // // };

// // // type ScadenzaEntry = { titolo: string; data: Date | undefined };

// // // const emptyForm: PraticaForm = { titolo: "", descrizione: "", id_cliente: "", id_tipo: "", cliente_nome: "", privata: false, stato: "aperta", colore: "", guadagno_preventivato: "0", data_preventivata_fine: "" };

// // // export default function Pratiche() {
// // //   const [searchParams, setSearchParams] = useSearchParams();
// // //   const navigate = useNavigate();
// // //   const [pratiche, setPratiche] = useState<Pratica[]>([]);
// // //   const [clienti, setClienti] = useState<Cliente[]>([]);
// // //   const [tipi, setTipi] = useState<TipoPratica[]>([]);
// // //   const [filtroStato, setFiltroStato] = useState<string>(searchParams.get("stato") || "tutti");
// // //   const [filtroColore, setFiltroColore] = useState<string>("tutti");
// // //   const [ricerca, setRicerca] = useState("");
// // //   const [dialogOpen, setDialogOpen] = useState(false);
// // //   const [editId, setEditId] = useState<string | null>(null);
// // //   const [form, setForm] = useState<PraticaForm>(emptyForm);
// // //   const [clienteMode, setClienteMode] = useState<"registrato" | "libero">("registrato");
// // //   const [scadenze, setScadenze] = useState<ScadenzaEntry[]>([]);
// // //   const [tipoOrdinamento, setTipoOrdinamento] = useState<"custom" | "data_asc" | "data_desc">("custom");
// // //   const [deleteId, setDeleteId] = useState<string | null>(null);
// // //   const [deleteTitolo, setDeleteTitolo] = useState("");
// // //   const { toast } = useToast();
// // //   const { stati, getLabel, getColore } = useStatiPratica();
// // //   const { colori } = useColoriPratica();

// // //   const load = async () => {
// // //     const { data } = await supabase.from("pratiche").select("*, clienti(*), tipi_pratica(*)").order("ordine_situazione", { ascending: true });
// // //     setPratiche((data as Pratica[]) || []);
// // //     const { data: c } = await supabase.from("clienti").select("*").order("nome_completo");
// // //     setClienti((c as Cliente[]) || []);
// // //     const { data: t } = await supabase.from("tipi_pratica").select("*").order("label");
// // //     setTipi((t as TipoPratica[]) || []);
// // //   };

// // //   useEffect(() => { load(); }, []); // Rimosso l'ordinamento dalle dipendenze, gestiamo tutto lato client
// // //   useEffect(() => { const stato = searchParams.get("stato"); if (stato) setFiltroStato(stato); }, [searchParams]);
// // //   useEffect(() => {
// // //     const modificaId = searchParams.get("modifica");
// // //     if (modificaId && pratiche.length > 0) {
// // //       const p = pratiche.find(pr => pr.id === modificaId);
// // //       if (p) { openEdit(p); searchParams.delete("modifica"); setSearchParams(searchParams, { replace: true }); }
// // //     }
// // //   }, [searchParams, pratiche]);

// // //   const filtered = pratiche.filter((p) => {
// // //     if (filtroStato !== "tutti" && p.stato !== filtroStato) return false;
// // //     if (filtroColore !== "tutti" && p.colore !== filtroColore) return false;
// // //     const clientName = p.clienti?.nome_completo || p.cliente_nome || "";
// // //     if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase()) && !clientName.toLowerCase().includes(ricerca.toLowerCase())) return false;
// // //     return true;
// // //   }).sort((a, b) => {
// // //     // Se "custom", usiamo il posizionamento come deciso altrove
// // //     if (tipoOrdinamento === "custom") {
// // //       const aChiusa = a.stato === "chiusa" ? 1 : 0;
// // //       const bChiusa = b.stato === "chiusa" ? 1 : 0;
// // //       if (aChiusa !== bChiusa) return aChiusa - bChiusa;
// // //       return (a.ordine_situazione ?? 0) - (b.ordine_situazione ?? 0);
// // //     }
// // //     // Altrimenti ordiniamo per data di creazione
// // //     const dateA = new Date(a.created_at || 0).getTime();
// // //     const dateB = new Date(b.created_at || 0).getTime();
// // //     return tipoOrdinamento === "data_asc" ? dateA - dateB : dateB - dateA;
// // //   });

// // //   const openEdit = (p: Pratica) => {
// // //     setEditId(p.id);
// // //     setClienteMode(p.id_cliente ? "registrato" : "libero");
// // //     setForm({
// // //       titolo: p.titolo, descrizione: p.descrizione || "", id_cliente: p.id_cliente || "",
// // //       id_tipo: p.id_tipo || "", cliente_nome: p.cliente_nome || "", privata: p.privata,
// // //       stato: p.stato, colore: p.colore || "",
// // //       guadagno_preventivato: String(p.guadagno_preventivato ?? 0),
// // //       data_preventivata_fine: p.data_preventivata_fine || "",
// // //     });
// // //     setScadenze([]);
// // //     setDialogOpen(true);
// // //   };

// // //   const openCreate = () => { setEditId(null); setForm(emptyForm); setClienteMode("registrato"); setScadenze([]); setDialogOpen(true); };

// // //   const handleSubmit = async (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     const { data: { user } } = await supabase.auth.getUser();
// // //     if (!user) return;

// // //     let finalIdCliente = clienteMode === "registrato" && form.id_cliente ? form.id_cliente : null;
// // //     let finalClienteNome = clienteMode === "libero" && form.cliente_nome ? form.cliente_nome : null;

// // //     if (clienteMode === "libero" && form.cliente_nome.trim()) {
// // //       const nomeNormalized = form.cliente_nome.trim().toLowerCase().replace(/\s+/g, " ");
// // //       const existing = clienti.find(c => c.nome_completo.trim().toLowerCase().replace(/\s+/g, " ") === nomeNormalized);
// // //       if (existing) { finalIdCliente = existing.id; finalClienteNome = null; }
// // //       else {
// // //         const { data: newCliente } = await supabase.from("clienti").insert({ nome_completo: form.cliente_nome.trim() }).select().single();
// // //         if (newCliente) { finalIdCliente = newCliente.id; finalClienteNome = null; }
// // //       }
// // //     }

// // //     const payload: any = {
// // //       titolo: form.titolo, descrizione: form.descrizione || null,
// // //       id_cliente: finalIdCliente, cliente_nome: finalClienteNome,
// // //       id_tipo: form.id_tipo || null, privata: form.privata, stato: form.stato,
// // //       colore: form.colore || null,
// // //       guadagno_preventivato: parseFloat(form.guadagno_preventivato) || 0,
// // //       data_preventivata_fine: form.data_preventivata_fine || null,
// // //     };

// // //     let praticaId = editId;

// // //     if (editId) {
// // //       const { error } = await supabase.from("pratiche").update(payload).eq("id", editId);
// // //       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// // //       await logAudit("Modifica pratica", `Pratica "${form.titolo}" modificata`);
// // //       toast({ title: "Pratica aggiornata" });
// // //     } else {
// // //       const { error, data: newPratica } = await supabase.from("pratiche").insert({ ...payload, proprietario_id: user.id }).select().single();
// // //       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// // //       praticaId = newPratica.id;
// // //       await logAudit("Creazione pratica", `Pratica "${form.titolo}" creata`);
// // //       toast({ title: "Pratica creata" });
// // //     }

// // //     const validScadenze = scadenze.filter(s => s.data);
// // //     if (validScadenze.length > 0 && praticaId) {
// // //       await supabase.from("scadenze").insert(validScadenze.map(s => ({ titolo: s.titolo || form.titolo, data_scadenza: format(s.data!, "yyyy-MM-dd"), id_pratica: praticaId })));
// // //       // Also create calendar events for each deadline
// // //       const { data: { user: currentUser } } = await supabase.auth.getUser();
// // //       if (currentUser) {
// // //         await (supabase as any).from("eventi_calendario").insert(validScadenze.map(s => ({
// // //           user_id: currentUser.id,
// // //           titolo: `📌 ${s.titolo || form.titolo}`,
// // //           colore: "#ef4444",
// // //           data: format(s.data!, "yyyy-MM-dd"),
// // //           id_pratica: praticaId,
// // //         })));
// // //       }
// // //       await logAudit("Nuove scadenze", `${validScadenze.length} scadenze aggiunte alla pratica "${form.titolo}"`);
// // //     }

// // //     setDialogOpen(false); setEditId(null); setForm(emptyForm); load();
// // //   };

// // //   const handleDelete = async () => {
// // //     if (!deleteId) return;
// // //     await supabase.from("scadenze").delete().eq("id_pratica", deleteId);
// // //     const { error } = await supabase.from("pratiche").delete().eq("id", deleteId);
// // //     if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// // //     await logAudit("Eliminazione pratica", `Pratica "${deleteTitolo}" eliminata`);
// // //     toast({ title: "Pratica eliminata" }); setDeleteId(null); load();
// // //   };

// // //   const handleFiltroChange = (val: string) => {
// // //     setFiltroStato(val);
// // //     if (val === "tutti") { searchParams.delete("stato"); } else { searchParams.set("stato", val); }
// // //     setSearchParams(searchParams, { replace: true });
// // //   };

// // //   const getClientName = (p: Pratica) => p.clienti?.nome_completo || p.cliente_nome || "—";

// // //   return (
// // //     <div className="space-y-6">
// // //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
// // //         <div>
// // //           <h1 className="text-2xl font-bold tracking-tight">Pratiche</h1>
// // //           <p className="text-muted-foreground text-sm mt-1">{pratiche.length} pratiche totali</p>
// // //         </div>
// // //         <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuova Pratica</Button>
// // //       </div>

// // //       {/* Dialog create/edit */}
// // //       <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
// // //         <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
// // //           <DialogHeader><DialogTitle>{editId ? "Modifica Pratica" : "Nuova Pratica"}</DialogTitle></DialogHeader>
// // //           <form onSubmit={handleSubmit} className="space-y-4">
// // //             <div className="space-y-2"><Label>Titolo</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} required /></div>
// // //             <div className="space-y-2"><Label>Descrizione</Label><Textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} /></div>
// // //             <div className="space-y-2">
// // //               <Label>Cliente</Label>
// // //               <div className="flex gap-2 mb-2">
// // //                 <Button type="button" size="sm" variant={clienteMode === "registrato" ? "default" : "outline"} onClick={() => setClienteMode("registrato")}>Registrato</Button>
// // //                 <Button type="button" size="sm" variant={clienteMode === "libero" ? "default" : "outline"} onClick={() => setClienteMode("libero")}>Non registrato</Button>
// // //               </div>
// // //               {clienteMode === "registrato" ? (
// // //                 <Select value={form.id_cliente} onValueChange={v => setForm(f => ({ ...f, id_cliente: v }))}><SelectTrigger><SelectValue placeholder="Seleziona cliente" /></SelectTrigger><SelectContent>{clienti.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent></Select>
// // //               ) : (
// // //                 <Input placeholder="Nome cliente" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} />
// // //               )}
// // //             </div>
// // //             <div className="space-y-2">
// // //               <Label>Tipo</Label>
// // //               <Select value={form.id_tipo} onValueChange={v => setForm(f => ({ ...f, id_tipo: v }))}><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger><SelectContent>{tipi.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
// // //             </div>
// // //             <div className="space-y-2">
// // //               <Label>Stato</Label>
// // //               <Select value={form.stato} onValueChange={v => setForm(f => ({ ...f, stato: v as StatoPratica }))}>
// // //                 <SelectTrigger><SelectValue /></SelectTrigger>
// // //                 <SelectContent>{stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}</SelectContent>
// // //               </Select>
// // //             </div>
// // //             {/* Colore pratica */}
// // //             <div className="space-y-2">
// // //               <Label>Colore pratica</Label>
// // //               <div className="flex gap-2 flex-wrap">
// // //                 <button type="button" className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center text-xs ${!form.colore ? "border-foreground scale-110" : "border-muted"}`}
// // //                   style={{ backgroundColor: "transparent" }} onClick={() => setForm(f => ({ ...f, colore: "" }))}>—</button>
// // //                 {colori.map(c => (
// // //                   <button key={c.id} type="button"
// // //                     className={`w-8 h-8 rounded-full border-2 transition-transform ${form.colore === c.colore ? "border-foreground scale-110" : "border-transparent"}`}
// // //                     style={{ backgroundColor: c.colore }} onClick={() => setForm(f => ({ ...f, colore: c.colore }))}
// // //                     title={c.label} />
// // //                 ))}
// // //               </div>
// // //             </div>
// // //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
// // //               <div className="space-y-2">
// // //                 <Label className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" /> Preventivato (€)</Label>
// // //                 <Input type="number" step="0.01" min="0" value={form.guadagno_preventivato} onChange={e => setForm(f => ({ ...f, guadagno_preventivato: e.target.value }))} />
// // //               </div>
// // //               <div className="space-y-2">
// // //                 <Label>Data fine stimata</Label>
// // //                 <Input type="date" value={form.data_preventivata_fine} onChange={e => setForm(f => ({ ...f, data_preventivata_fine: e.target.value }))} />
// // //               </div>
// // //             </div>
// // //             <div className="flex items-center gap-3"><Switch checked={form.privata} onCheckedChange={v => setForm(f => ({ ...f, privata: v }))} /><Label>Pratica privata</Label></div>

// // //             <div className="border-t pt-4 space-y-3">
// // //               <div className="flex items-center justify-between">
// // //                 <Label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Scadenze</Label>
// // //                 <Button type="button" variant="outline" size="sm" onClick={() => setScadenze(prev => [...prev, { titolo: "", data: undefined }])}><Plus className="h-3 w-3 mr-1" /> Aggiungi</Button>
// // //               </div>
// // //               {scadenze.map((s, idx) => (
// // //                 <div key={idx} className="flex gap-2 items-start">
// // //                   <div className="flex-1 space-y-2">
// // //                     <Input placeholder={`Titolo (default: ${form.titolo || "titolo pratica"})`} value={s.titolo} onChange={e => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, titolo: e.target.value } : x))} />
// // //                     <Popover>
// // //                       <PopoverTrigger asChild>
// // //                         <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !s.data && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{s.data ? format(s.data, "dd/MM/yyyy") : "Seleziona data"}</Button>
// // //                       </PopoverTrigger>
// // //                       <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={s.data} onSelect={d => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, data: d } : x))} locale={it} className="p-3 pointer-events-auto" /></PopoverContent>
// // //                     </Popover>
// // //                   </div>
// // //                   <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => setScadenze(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
// // //                 </div>
// // //               ))}
// // //               {scadenze.length === 0 && <p className="text-xs text-muted-foreground">Nessuna scadenza aggiunta.</p>}
// // //             </div>

// // //             <Button type="submit" className="w-full h-12">{editId ? "Salva Modifiche" : "Crea Pratica"}</Button>
// // //           </form>
// // //         </DialogContent>
// // //       </Dialog>

// // //       {/* Delete confirmation */}
// // //       <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
// // //         <AlertDialogContent>
// // //           <AlertDialogHeader>
// // //             <AlertDialogTitle>Eliminare la pratica?</AlertDialogTitle>
// // //             <AlertDialogDescription>Questa azione è irreversibile. La pratica "{deleteTitolo}" e tutte le scadenze collegate verranno eliminate.</AlertDialogDescription>
// // //           </AlertDialogHeader>
// // //           <AlertDialogFooter>
// // //             <AlertDialogCancel>Annulla</AlertDialogCancel>
// // //             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
// // //           </AlertDialogFooter>
// // //         </AlertDialogContent>
// // //       </AlertDialog>

// // //       {/* Filters */}
// // //       <div className="flex flex-col sm:flex-row gap-3">
// // //         <div className="relative flex-1">
// // //           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// // //           <Input placeholder="Cerca per titolo o cliente..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
// // //         </div>
// // //         <div className="flex gap-2">
// // //           {/* Tasto in alto per ripristinare il Custom Sorting */}
// // //           <Button variant="outline" size="icon" onClick={() => setTipoOrdinamento("custom")} title="Ripristina ordinamento predefinito">
// // //             <ListOrdered className="h-4 w-4" />
// // //           </Button>

// // //           {/* Nuovo filtro Colore */}
// // //           <Select value={filtroColore} onValueChange={setFiltroColore}>
// // //             <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Colore" /></SelectTrigger>
// // //             <SelectContent>
// // //               <SelectItem value="tutti">Tutti i colori</SelectItem>
// // //               {colori.map(c => (
// // //                 <SelectItem key={c.id} value={c.colore}>
// // //                   <div className="flex items-center gap-2">
// // //                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.colore }} />
// // //                     {c.label || "Colore"}
// // //                   </div>
// // //                 </SelectItem>
// // //               ))}
// // //             </SelectContent>
// // //           </Select>

// // //           <Select value={filtroStato} onValueChange={handleFiltroChange}>
// // //             <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
// // //             <SelectContent>
// // //               <SelectItem value="tutti">Tutti gli stati</SelectItem>
// // //               {stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}
// // //             </SelectContent>
// // //           </Select>
// // //         </div>
// // //       </div>

// // //       {/* Desktop table */}
// // //       <div className="hidden md:block">
// // //         <Card>
// // //           <CardContent className="p-0">
// // //             <div className="overflow-x-auto">
// // //               <table className="w-full text-sm">
// // //                 <thead>
// // //                   <tr className="border-b bg-muted/30">
// // //                     <th className="w-[20px] p-3"></th>
// // //                     <th className="text-left p-3 font-medium text-muted-foreground">Titolo</th>
// // //                     <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
// // //                     <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
// // //                     <th className="text-left p-3 font-medium text-muted-foreground">
// // //                       {/* Cliccando "Data" inverte l'ordinamento decrescente/crescente */}
// // //                       <button 
// // //                         onClick={() => setTipoOrdinamento(prev => prev === "data_desc" ? "data_asc" : "data_desc")} 
// // //                         className="flex items-center gap-1 hover:text-foreground transition-colors"
// // //                       >
// // //                         Data 
// // //                         {tipoOrdinamento === "data_asc" ? <ArrowUp className="h-3 w-3" /> : (tipoOrdinamento === "data_desc" ? <ArrowDown className="h-3 w-3" /> : null)}
// // //                       </button>
// // //                     </th>
// // //                     <th className="text-left p-3 font-medium text-muted-foreground">Stato</th>
// // //                     <th className="text-left p-3 font-medium text-muted-foreground w-16"></th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {filtered.map(p => (
// // //                     <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/pratiche/${p.id}`)}>
// // //                       <td className="p-3">{p.colore && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.colore }} />}</td>
// // //                       <td className="p-3 font-medium max-w-[200px] truncate">{p.titolo}</td>
// // //                       <td className="p-3 text-muted-foreground max-w-[150px] truncate">{getClientName(p)}</td>
// // //                       <td className="p-3 text-muted-foreground hidden lg:table-cell">{p.tipi_pratica?.label || "—"}</td>
// // //                       <td className="p-3 text-muted-foreground whitespace-nowrap">{format(parseISO(p.created_at), "dd/MM/yyyy")}</td>
// // //                       <td className="p-3">
// // //                         <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
// // //                       </td>
// // //                       <td className="p-3">
// // //                         <div className="flex items-center gap-1">
// // //                           {p.privata && <Lock className="h-4 w-4 text-muted-foreground" />}
// // //                           <DropdownMenu>
// // //                             <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
// // //                               <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
// // //                             </DropdownMenuTrigger>
// // //                             <DropdownMenuContent align="end">
// // //                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
// // //                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
// // //                             </DropdownMenuContent>
// // //                           </DropdownMenu>
// // //                         </div>
// // //                       </td>
// // //                     </tr>
// // //                   ))}
// // //                 </tbody>
// // //               </table>
// // //             </div>
// // //             {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Nessuna pratica trovata.</p>}
// // //           </CardContent>
// // //         </Card>
// // //       </div>

// // //       {/* Mobile cards */}
// // //       <div className="md:hidden space-y-3">
// // //         {filtered.map(p => (
// // //           <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/pratiche/${p.id}`)}>
// // //             <CardContent className="p-4">
// // //               <div className="flex items-start justify-between gap-2">
// // //                 <div className="min-w-0 flex-1">
// // //                   <p className="font-medium flex items-center gap-2 truncate">
// // //                     {p.colore && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
// // //                     {p.titolo} {p.privata && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
// // //                   </p>
// // //                   <p className="text-xs text-muted-foreground mt-1 truncate">{getClientName(p)} · {p.tipi_pratica?.label || "—"}</p>
// // //                   <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(p.created_at), "dd/MM/yyyy")}</p>
// // //                 </div>
// // //                 <div className="flex items-center gap-1 shrink-0">
// // //                   <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
// // //                   <DropdownMenu>
// // //                     <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
// // //                       <Button variant="ghost" size="icon" className="h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
// // //                     </DropdownMenuTrigger>
// // //                     <DropdownMenuContent align="end">
// // //                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
// // //                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
// // //                     </DropdownMenuContent>
// // //                   </DropdownMenu>
// // //                 </div>
// // //               </div>
// // //             </CardContent>
// // //           </Card>
// // //         ))}
// // //         {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nessuna pratica trovata.</p>}
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { useEffect, useState } from "react";
// // import { useSearchParams, useNavigate } from "react-router-dom";
// // import { supabase } from "@/integrations/supabase/client";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Badge } from "@/components/ui/badge";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// // import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Switch } from "@/components/ui/switch";
// // import { Calendar } from "@/components/ui/calendar";
// // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// // import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// // import { useToast } from "@/hooks/use-toast";
// // import { Plus, Search, Lock, CalendarIcon, Euro, Trash2, MoreVertical, Edit, ArrowUp, ArrowDown, ListOrdered } from "lucide-react";
// // import { logAudit } from "@/lib/audit";
// // import { format, parseISO } from "date-fns";
// // import { it } from "date-fns/locale";
// // import { cn } from "@/lib/utils";
// // import { useStatiPratica } from "@/hooks/use-stati-pratica";
// // import { useColoriPratica } from "@/hooks/use-colori-pratica";
// // import type { Pratica, Cliente, TipoPratica, StatoPratica } from "@/types/database";

// // type PraticaForm = {
// //   titolo: string;
// //   descrizione: string;
// //   id_cliente: string;
// //   id_tipo: string;
// //   cliente_nome: string;
// //   privata: boolean;
// //   stato: StatoPratica;
// //   colore: string;
// //   guadagno_preventivato: string;
// //   data_preventivata_fine: string;
// // };

// // type ScadenzaEntry = { titolo: string; data: Date | undefined };

// // const emptyForm: PraticaForm = { titolo: "", descrizione: "", id_cliente: "", id_tipo: "", cliente_nome: "", privata: false, stato: "aperta", colore: "", guadagno_preventivato: "0", data_preventivata_fine: "" };

// // export default function Pratiche() {
// //   const [searchParams, setSearchParams] = useSearchParams();
// //   const navigate = useNavigate();
// //   const [pratiche, setPratiche] = useState<Pratica[]>([]);
// //   const [clienti, setClienti] = useState<Cliente[]>([]);
// //   const [tipi, setTipi] = useState<TipoPratica[]>([]);
// //   const [filtroStato, setFiltroStato] = useState<string>(searchParams.get("stato") || "tutti");
// //   const [filtroColore, setFiltroColore] = useState<string>("tutti");
// //   const [ricerca, setRicerca] = useState("");
// //   const [dialogOpen, setDialogOpen] = useState(false);
// //   const [editId, setEditId] = useState<string | null>(null);
// //   const [form, setForm] = useState<PraticaForm>(emptyForm);
// //   const [clienteMode, setClienteMode] = useState<"registrato" | "libero">("registrato");
// //   const [scadenze, setScadenze] = useState<ScadenzaEntry[]>([]);
// //   const [tipoOrdinamento, setTipoOrdinamento] = useState<"custom" | "data_asc" | "data_desc">("custom");
// //   const [deleteId, setDeleteId] = useState<string | null>(null);
// //   const [deleteTitolo, setDeleteTitolo] = useState("");
// //   const { toast } = useToast();
// //   const { stati, getLabel, getColore } = useStatiPratica();
// //   const { colori } = useColoriPratica();

// //   const load = async () => {
// //     const { data } = await supabase.from("pratiche").select("*, clienti(*), tipi_pratica(*)").order("ordine_situazione", { ascending: true });
// //     setPratiche((data as Pratica[]) || []);
// //     const { data: c } = await supabase.from("clienti").select("*").order("nome_completo");
// //     setClienti((c as Cliente[]) || []);
// //     const { data: t } = await supabase.from("tipi_pratica").select("*").order("label");
// //     setTipi((t as TipoPratica[]) || []);
// //   };

// //   useEffect(() => { load(); }, []);
// //   useEffect(() => { const stato = searchParams.get("stato"); if (stato) setFiltroStato(stato); }, [searchParams]);
// //   useEffect(() => {
// //     const modificaId = searchParams.get("modifica");
// //     if (modificaId && pratiche.length > 0) {
// //       const p = pratiche.find(pr => pr.id === modificaId);
// //       if (p) { openEdit(p); searchParams.delete("modifica"); setSearchParams(searchParams, { replace: true }); }
// //     }
// //   }, [searchParams, pratiche]);

// //   const filtered = pratiche.filter((p) => {
// //     if (filtroStato !== "tutti" && p.stato !== filtroStato) return false;
// //     if (filtroColore !== "tutti" && p.colore !== filtroColore) return false;
// //     const clientName = p.clienti?.nome_completo || p.cliente_nome || "";
// //     if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase()) && !clientName.toLowerCase().includes(ricerca.toLowerCase())) return false;
// //     return true;
// //   }).sort((a, b) => {
// //     if (tipoOrdinamento === "custom") {
// //       const aChiusa = a.stato === "chiusa" ? 1 : 0;
// //       const bChiusa = b.stato === "chiusa" ? 1 : 0;
// //       if (aChiusa !== bChiusa) return aChiusa - bChiusa;
// //       return (a.ordine_situazione ?? 0) - (b.ordine_situazione ?? 0);
// //     }
// //     const dateA = new Date(a.created_at || 0).getTime();
// //     const dateB = new Date(b.created_at || 0).getTime();
// //     return tipoOrdinamento === "data_asc" ? dateA - dateB : dateB - dateA;
// //   });

// //   const openEdit = (p: Pratica) => {
// //     setEditId(p.id);
// //     setClienteMode(p.id_cliente ? "registrato" : "libero");
// //     setForm({
// //       titolo: p.titolo, descrizione: p.descrizione || "", id_cliente: p.id_cliente || "",
// //       id_tipo: p.id_tipo || "", cliente_nome: p.cliente_nome || "", privata: p.privata,
// //       stato: p.stato, colore: p.colore || "",
// //       guadagno_preventivato: String(p.guadagno_preventivato ?? 0),
// //       data_preventivata_fine: p.data_preventivata_fine || "",
// //     });
// //     setScadenze([]);
// //     setDialogOpen(true);
// //   };

// //   const openCreate = () => { setEditId(null); setForm(emptyForm); setClienteMode("registrato"); setScadenze([]); setDialogOpen(true); };

// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     const { data: { user } } = await supabase.auth.getUser();
// //     if (!user) return;

// //     let finalIdCliente = clienteMode === "registrato" && form.id_cliente ? form.id_cliente : null;
// //     let finalClienteNome = clienteMode === "libero" && form.cliente_nome ? form.cliente_nome : null;

// //     if (clienteMode === "libero" && form.cliente_nome.trim()) {
// //       const nomeNormalized = form.cliente_nome.trim().toLowerCase().replace(/\s+/g, " ");
// //       const existing = clienti.find(c => c.nome_completo.trim().toLowerCase().replace(/\s+/g, " ") === nomeNormalized);
// //       if (existing) { finalIdCliente = existing.id; finalClienteNome = null; }
// //       else {
// //         const { data: newCliente } = await supabase.from("clienti").insert({ nome_completo: form.cliente_nome.trim() }).select().single();
// //         if (newCliente) { finalIdCliente = newCliente.id; finalClienteNome = null; }
// //       }
// //     }

// //     const payload: any = {
// //       titolo: form.titolo, descrizione: form.descrizione || null,
// //       id_cliente: finalIdCliente, cliente_nome: finalClienteNome,
// //       id_tipo: form.id_tipo || null, privata: form.privata, stato: form.stato,
// //       colore: form.colore || null,
// //       guadagno_preventivato: parseFloat(form.guadagno_preventivato) || 0,
// //       data_preventivata_fine: form.data_preventivata_fine || null,
// //     };

// //     let praticaId = editId;

// //     if (editId) {
// //       const { error } = await supabase.from("pratiche").update(payload).eq("id", editId);
// //       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// //       await logAudit("Modifica pratica", `Pratica "${form.titolo}" modificata`);
// //       toast({ title: "Pratica aggiornata" });
// //     } else {
// //       const { error, data: newPratica } = await supabase.from("pratiche").insert({ ...payload, proprietario_id: user.id }).select().single();
// //       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// //       praticaId = newPratica.id;
// //       await logAudit("Creazione pratica", `Pratica "${form.titolo}" creata`);
// //       toast({ title: "Pratica creata" });
// //     }

// //     const validScadenze = scadenze.filter(s => s.data);
// //     if (validScadenze.length > 0 && praticaId) {
// //       await supabase.from("scadenze").insert(validScadenze.map(s => ({ titolo: s.titolo || form.titolo, data_scadenza: format(s.data!, "yyyy-MM-dd"), id_pratica: praticaId })));
// //       const { data: { user: currentUser } } = await supabase.auth.getUser();
// //       if (currentUser) {
// //         await (supabase as any).from("eventi_calendario").insert(validScadenze.map(s => ({
// //           user_id: currentUser.id,
// //           titolo: `📌 ${s.titolo || form.titolo}`,
// //           colore: "#ef4444",
// //           data: format(s.data!, "yyyy-MM-dd"),
// //           id_pratica: praticaId,
// //         })));
// //       }
// //       await logAudit("Nuove scadenze", `${validScadenze.length} scadenze aggiunte alla pratica "${form.titolo}"`);
// //     }

// //     setDialogOpen(false); setEditId(null); setForm(emptyForm); load();
// //   };

// //   const handleDelete = async () => {
// //     if (!deleteId) return;
// //     await supabase.from("scadenze").delete().eq("id_pratica", deleteId);
// //     const { error } = await supabase.from("pratiche").delete().eq("id", deleteId);
// //     if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
// //     await logAudit("Eliminazione pratica", `Pratica "${deleteTitolo}" eliminata`);
// //     toast({ title: "Pratica eliminata" }); setDeleteId(null); load();
// //   };

// //   const handleFiltroChange = (val: string) => {
// //     setFiltroStato(val);
// //     if (val === "tutti") { searchParams.delete("stato"); } else { searchParams.set("stato", val); }
// //     setSearchParams(searchParams, { replace: true });
// //   };

// //   const getClientName = (p: Pratica) => p.clienti?.nome_completo || p.cliente_nome || "—";

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
// //         <div>
// //           <h1 className="text-2xl font-bold tracking-tight">Pratiche</h1>
// //           <p className="text-muted-foreground text-sm mt-1">{pratiche.length} pratiche totali</p>
// //         </div>
// //         <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuova Pratica</Button>
// //       </div>

// //       <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
// //         <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
// //           <DialogHeader><DialogTitle>{editId ? "Modifica Pratica" : "Nuova Pratica"}</DialogTitle></DialogHeader>
// //           <form onSubmit={handleSubmit} className="space-y-4">
// //             <div className="space-y-2"><Label>Titolo</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} required /></div>
// //             <div className="space-y-2"><Label>Descrizione</Label><Textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} /></div>
// //             <div className="space-y-2">
// //               <Label>Cliente</Label>
// //               <div className="flex gap-2 mb-2">
// //                 <Button type="button" size="sm" variant={clienteMode === "registrato" ? "default" : "outline"} onClick={() => setClienteMode("registrato")}>Registrato</Button>
// //                 <Button type="button" size="sm" variant={clienteMode === "libero" ? "default" : "outline"} onClick={() => setClienteMode("libero")}>Non registrato</Button>
// //               </div>
// //               {clienteMode === "registrato" ? (
// //                 <Select value={form.id_cliente} onValueChange={v => setForm(f => ({ ...f, id_cliente: v }))}><SelectTrigger><SelectValue placeholder="Seleziona cliente" /></SelectTrigger><SelectContent>{clienti.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent></Select>
// //               ) : (
// //                 <Input placeholder="Nome cliente" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} />
// //               )}
// //             </div>
// //             <div className="space-y-2">
// //               <Label>Tipo</Label>
// //               <Select value={form.id_tipo} onValueChange={v => setForm(f => ({ ...f, id_tipo: v }))}><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger><SelectContent>{tipi.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
// //             </div>
// //             <div className="space-y-2">
// //               <Label>Stato</Label>
// //               <Select value={form.stato} onValueChange={v => setForm(f => ({ ...f, stato: v as StatoPratica }))}>
// //                 <SelectTrigger><SelectValue /></SelectTrigger>
// //                 <SelectContent>{stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}</SelectContent>
// //               </Select>
// //             </div>
// //             <div className="space-y-2">
// //               <Label>Colore pratica</Label>
// //               <div className="flex gap-2 flex-wrap">
// //                 <button type="button" className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center text-xs ${!form.colore ? "border-foreground scale-110" : "border-muted"}`}
// //                   style={{ backgroundColor: "transparent" }} onClick={() => setForm(f => ({ ...f, colore: "" }))}>—</button>
// //                 {colori.map(c => (
// //                   <button key={c.id} type="button"
// //                     className={`w-8 h-8 rounded-full border-2 transition-transform ${form.colore === c.colore ? "border-foreground scale-110" : "border-transparent"}`}
// //                     style={{ backgroundColor: c.colore }} onClick={() => setForm(f => ({ ...f, colore: c.colore }))}
// //                     title={c.label} />
// //                 ))}
// //               </div>
// //             </div>
// //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
// //               <div className="space-y-2">
// //                 <Label className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" /> Preventivato (€)</Label>
// //                 <Input type="number" step="0.01" min="0" value={form.guadagno_preventivato} onChange={e => setForm(f => ({ ...f, guadagno_preventivato: e.target.value }))} />
// //               </div>
// //               <div className="space-y-2">
// //                 <Label>Data fine stimata</Label>
// //                 <Input type="date" value={form.data_preventivata_fine} onChange={e => setForm(f => ({ ...f, data_preventivata_fine: e.target.value }))} />
// //               </div>
// //             </div>
// //             <div className="flex items-center gap-3"><Switch checked={form.privata} onCheckedChange={v => setForm(f => ({ ...f, privata: v }))} /><Label>Pratica privata</Label></div>

// //             <div className="border-t pt-4 space-y-3">
// //               <div className="flex items-center justify-between">
// //                 <Label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Scadenze</Label>
// //                 <Button type="button" variant="outline" size="sm" onClick={() => setScadenze(prev => [...prev, { titolo: "", data: undefined }])}><Plus className="h-3 w-3 mr-1" /> Aggiungi</Button>
// //               </div>
// //               {scadenze.map((s, idx) => (
// //                 <div key={idx} className="flex gap-2 items-start">
// //                   <div className="flex-1 space-y-2">
// //                     <Input placeholder={`Titolo (default: ${form.titolo || "titolo pratica"})`} value={s.titolo} onChange={e => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, titolo: e.target.value } : x))} />
// //                     <Popover>
// //                       <PopoverTrigger asChild>
// //                         <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !s.data && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{s.data ? format(s.data, "dd/MM/yyyy") : "Seleziona data"}</Button>
// //                       </PopoverTrigger>
// //                       <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={s.data} onSelect={d => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, data: d } : x))} locale={it} className="p-3 pointer-events-auto" /></PopoverContent>
// //                     </Popover>
// //                   </div>
// //                   <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => setScadenze(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
// //                 </div>
// //               ))}
// //               {scadenze.length === 0 && <p className="text-xs text-muted-foreground">Nessuna scadenza aggiunta.</p>}
// //             </div>

// //             <Button type="submit" className="w-full h-12">{editId ? "Salva Modifiche" : "Crea Pratica"}</Button>
// //           </form>
// //         </DialogContent>
// //       </Dialog>

// //       <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
// //         <AlertDialogContent>
// //           <AlertDialogHeader>
// //             <AlertDialogTitle>Eliminare la pratica?</AlertDialogTitle>
// //             <AlertDialogDescription>Questa azione è irreversibile. La pratica "{deleteTitolo}" e tutte le scadenze collegate verranno eliminate.</AlertDialogDescription>
// //           </AlertDialogHeader>
// //           <AlertDialogFooter>
// //             <AlertDialogCancel>Annulla</AlertDialogCancel>
// //             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
// //           </AlertDialogFooter>
// //         </AlertDialogContent>
// //       </AlertDialog>

// //       <div className="flex flex-col lg:flex-row gap-3">
// //         <div className="relative flex-1">
// //           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //           <Input placeholder="Cerca per titolo o cliente..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
// //         </div>
        
// //         {/* Adesso i controlli si impilano a tutta larghezza su mobile (flex-col), ma restano allineati orizzontalmente su schermi più larghi (sm:flex-row) */}
// //         <div className="flex flex-col sm:flex-row gap-2">
          
// //           <DropdownMenu>
// //             <DropdownMenuTrigger asChild>
// //               <Button variant="outline" className="w-full sm:w-[220px] justify-start">
// //                 <ListOrdered className="h-4 w-4 mr-2 shrink-0" />
// //                 <span className="truncate">
// //                   {tipoOrdinamento === "custom" && "Visualizzazione punto situa"}
// //                   {tipoOrdinamento === "data_asc" && "Data crescente"}
// //                   {tipoOrdinamento === "data_desc" && "Data decrescente"}
// //                 </span>
// //               </Button>
// //             </DropdownMenuTrigger>
// //             <DropdownMenuContent align="start" className="w-[240px]">
// //               <DropdownMenuItem onClick={() => setTipoOrdinamento("custom")}>
// //                 Visualizzazione punto situa
// //               </DropdownMenuItem>
// //               <DropdownMenuItem onClick={() => setTipoOrdinamento("data_asc")}>
// //                 Data crescente
// //               </DropdownMenuItem>
// //               <DropdownMenuItem onClick={() => setTipoOrdinamento("data_desc")}>
// //                 Data decrescente
// //               </DropdownMenuItem>
// //             </DropdownMenuContent>
// //           </DropdownMenu>

// //           <Select value={filtroColore} onValueChange={setFiltroColore}>
// //             <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Colore" /></SelectTrigger>
// //             <SelectContent>
// //               <SelectItem value="tutti">Tutti i colori</SelectItem>
// //               {colori.map(c => (
// //                 <SelectItem key={c.id} value={c.colore}>
// //                   <div className="flex items-center gap-2">
// //                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.colore }} />
// //                     {c.label || "Colore"}
// //                   </div>
// //                 </SelectItem>
// //               ))}
// //             </SelectContent>
// //           </Select>

// //           <Select value={filtroStato} onValueChange={handleFiltroChange}>
// //             <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
// //             <SelectContent>
// //               <SelectItem value="tutti">Tutti gli stati</SelectItem>
// //               {stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}
// //             </SelectContent>
// //           </Select>
// //         </div>
// //       </div>

// //       <div className="hidden md:block">
// //         <Card>
// //           <CardContent className="p-0">
// //             <div className="overflow-x-auto">
// //               <table className="w-full text-sm">
// //                 <thead>
// //                   <tr className="border-b bg-muted/30">
// //                     <th className="w-[20px] p-3"></th>
// //                     <th className="text-left p-3 font-medium text-muted-foreground">Titolo</th>
// //                     <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
// //                     <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
// //                     <th className="text-left p-3 font-medium text-muted-foreground">
// //                       {/* Ora la scritta "Data" non è più cliccabile ma le freccette compaiono se ordinate per data */}
// //                       <div className="flex items-center gap-1">
// //                         Data 
// //                         {tipoOrdinamento === "data_asc" && <ArrowUp className="h-3 w-3" />}
// //                         {tipoOrdinamento === "data_desc" && <ArrowDown className="h-3 w-3" />}
// //                       </div>
// //                     </th>
// //                     <th className="text-left p-3 font-medium text-muted-foreground">Stato</th>
// //                     <th className="text-left p-3 font-medium text-muted-foreground w-16"></th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {filtered.map(p => (
// //                     <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/pratiche/${p.id}`)}>
// //                       <td className="p-3">{p.colore && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.colore }} />}</td>
// //                       <td className="p-3 font-medium max-w-[200px] truncate">{p.titolo}</td>
// //                       <td className="p-3 text-muted-foreground max-w-[150px] truncate">{getClientName(p)}</td>
// //                       <td className="p-3 text-muted-foreground hidden lg:table-cell">{p.tipi_pratica?.label || "—"}</td>
// //                       <td className="p-3 text-muted-foreground whitespace-nowrap">{format(parseISO(p.created_at), "dd/MM/yyyy")}</td>
// //                       <td className="p-3">
// //                         <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
// //                       </td>
// //                       <td className="p-3">
// //                         <div className="flex items-center gap-1">
// //                           {p.privata && <Lock className="h-4 w-4 text-muted-foreground" />}
// //                           <DropdownMenu>
// //                             <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
// //                               <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
// //                             </DropdownMenuTrigger>
// //                             <DropdownMenuContent align="end">
// //                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
// //                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
// //                             </DropdownMenuContent>
// //                           </DropdownMenu>
// //                         </div>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //             {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Nessuna pratica trovata.</p>}
// //           </CardContent>
// //         </Card>
// //       </div>

// //       <div className="md:hidden space-y-3">
// //         {filtered.map(p => (
// //           <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/pratiche/${p.id}`)}>
// //             <CardContent className="p-4">
// //               <div className="flex items-start justify-between gap-2">
// //                 <div className="min-w-0 flex-1">
// //                   <p className="font-medium flex items-center gap-2 truncate">
// //                     {p.colore && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
// //                     {p.titolo} {p.privata && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
// //                   </p>
// //                   <p className="text-xs text-muted-foreground mt-1 truncate">{getClientName(p)} · {p.tipi_pratica?.label || "—"}</p>
// //                   <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(p.created_at), "dd/MM/yyyy")}</p>
// //                 </div>
// //                 <div className="flex items-center gap-1 shrink-0">
// //                   <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
// //                   <DropdownMenu>
// //                     <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
// //                       <Button variant="ghost" size="icon" className="h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
// //                     </DropdownMenuTrigger>
// //                     <DropdownMenuContent align="end">
// //                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
// //                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
// //                     </DropdownMenuContent>
// //                   </DropdownMenu>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         ))}
// //         {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nessuna pratica trovata.</p>}
// //       </div>
// //     </div>
// //   );
// // }


// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { useToast } from "@/hooks/use-toast";
// import { Plus, Search, Lock, CalendarIcon, Euro, Trash2, MoreVertical, Edit, ArrowDown, ListOrdered } from "lucide-react";
// import { logAudit } from "@/lib/audit";
// import { format, parseISO } from "date-fns";
// import { it } from "date-fns/locale";
// import { cn } from "@/lib/utils";
// import { useStatiPratica } from "@/hooks/use-stati-pratica";
// import { useColoriPratica } from "@/hooks/use-colori-pratica";
// import type { Pratica, Cliente, TipoPratica, StatoPratica } from "@/types/database";

// type PraticaForm = {
//   titolo: string;
//   descrizione: string;
//   id_cliente: string;
//   id_tipo: string;
//   cliente_nome: string;
//   privata: boolean;
//   stato: StatoPratica;
//   colore: string;
//   guadagno_preventivato: string;
//   data_preventivata_fine: string;
// };

// type ScadenzaEntry = { titolo: string; data: Date | undefined };

// const emptyForm: PraticaForm = { titolo: "", descrizione: "", id_cliente: "", id_tipo: "", cliente_nome: "", privata: false, stato: "aperta", colore: "", guadagno_preventivato: "0", data_preventivata_fine: "" };

// export default function Pratiche() {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [pratiche, setPratiche] = useState<Pratica[]>([]);
//   const [clienti, setClienti] = useState<Cliente[]>([]);
//   const [tipi, setTipi] = useState<TipoPratica[]>([]);
//   const [filtroStato, setFiltroStato] = useState<string>(searchParams.get("stato") || "tutti");
//   const [filtroColore, setFiltroColore] = useState<string>("tutti");
//   const [ricerca, setRicerca] = useState("");
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editId, setEditId] = useState<string | null>(null);
//   const [form, setForm] = useState<PraticaForm>(emptyForm);
//   const [clienteMode, setClienteMode] = useState<"registrato" | "libero">("registrato");
//   const [scadenze, setScadenze] = useState<ScadenzaEntry[]>([]);
//   const [tipoOrdinamento, setTipoOrdinamento] = useState<"custom" | "data" | "alfabetico">("custom");
//   const [deleteId, setDeleteId] = useState<string | null>(null);
//   const [deleteTitolo, setDeleteTitolo] = useState("");
//   const { toast } = useToast();
//   const { stati, getLabel, getColore } = useStatiPratica();
//   const { colori } = useColoriPratica();

//   const load = async () => {
//     const { data } = await supabase.from("pratiche").select("*, clienti(*), tipi_pratica(*)").order("ordine_situazione", { ascending: true });
//     setPratiche((data as Pratica[]) || []);
//     const { data: c } = await supabase.from("clienti").select("*").order("nome_completo");
//     setClienti((c as Cliente[]) || []);
//     const { data: t } = await supabase.from("tipi_pratica").select("*").order("label");
//     setTipi((t as TipoPratica[]) || []);
//   };

//   useEffect(() => { load(); }, []);
//   useEffect(() => { const stato = searchParams.get("stato"); if (stato) setFiltroStato(stato); }, [searchParams]);
//   useEffect(() => {
//     const modificaId = searchParams.get("modifica");
//     if (modificaId && pratiche.length > 0) {
//       const p = pratiche.find(pr => pr.id === modificaId);
//       if (p) { openEdit(p); searchParams.delete("modifica"); setSearchParams(searchParams, { replace: true }); }
//     }
//   }, [searchParams, pratiche]);

//   const filtered = pratiche.filter((p) => {
//     if (filtroStato !== "tutti" && p.stato !== filtroStato) return false;
//     if (filtroColore !== "tutti" && p.colore !== filtroColore) return false;
//     const clientName = p.clienti?.nome_completo || p.cliente_nome || "";
//     if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase()) && !clientName.toLowerCase().includes(ricerca.toLowerCase())) return false;
//     return true;
//   }).sort((a, b) => {
//     if (tipoOrdinamento === "custom") {
//       const aChiusa = a.stato === "chiusa" ? 1 : 0;
//       const bChiusa = b.stato === "chiusa" ? 1 : 0;
//       if (aChiusa !== bChiusa) return aChiusa - bChiusa;
//       return (a.ordine_situazione ?? 0) - (b.ordine_situazione ?? 0);
//     }
//     if (tipoOrdinamento === "alfabetico") {
//       return a.titolo.localeCompare(b.titolo, 'it');
//     }
//     const dateA = new Date(a.created_at || 0).getTime();
//     const dateB = new Date(b.created_at || 0).getTime();
//     return dateB - dateA;
//   });

//   const openEdit = (p: Pratica) => {
//     setEditId(p.id);
//     setClienteMode(p.id_cliente ? "registrato" : "libero");
//     setForm({
//       titolo: p.titolo, descrizione: p.descrizione || "", id_cliente: p.id_cliente || "",
//       id_tipo: p.id_tipo || "", cliente_nome: p.cliente_nome || "", privata: p.privata,
//       stato: p.stato, colore: p.colore || "",
//       guadagno_preventivato: String(p.guadagno_preventivato ?? 0),
//       data_preventivata_fine: p.data_preventivata_fine || "",
//     });
//     setScadenze([]);
//     setDialogOpen(true);
//   };

//   const openCreate = () => { setEditId(null); setForm(emptyForm); setClienteMode("registrato"); setScadenze([]); setDialogOpen(true); };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) return;

//     let finalIdCliente = clienteMode === "registrato" && form.id_cliente ? form.id_cliente : null;
//     let finalClienteNome = clienteMode === "libero" && form.cliente_nome ? form.cliente_nome : null;

//     if (clienteMode === "libero" && form.cliente_nome.trim()) {
//       const nomeNormalized = form.cliente_nome.trim().toLowerCase().replace(/\s+/g, " ");
//       const existing = clienti.find(c => c.nome_completo.trim().toLowerCase().replace(/\s+/g, " ") === nomeNormalized);
//       if (existing) { finalIdCliente = existing.id; finalClienteNome = null; }
//       else {
//         const { data: newCliente } = await supabase.from("clienti").insert({ nome_completo: form.cliente_nome.trim() }).select().single();
//         if (newCliente) { finalIdCliente = newCliente.id; finalClienteNome = null; }
//       }
//     }

//     const payload: any = {
//       titolo: form.titolo, descrizione: form.descrizione || null,
//       id_cliente: finalIdCliente, cliente_nome: finalClienteNome,
//       id_tipo: form.id_tipo || null, privata: form.privata, stato: form.stato,
//       colore: form.colore || null,
//       guadagno_preventivato: parseFloat(form.guadagno_preventivato) || 0,
//       data_preventivata_fine: form.data_preventivata_fine || null,
//     };

//     let praticaId = editId;

//     if (editId) {
//       const { error } = await supabase.from("pratiche").update(payload).eq("id", editId);
//       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
//       await logAudit("Modifica pratica", `Pratica "${form.titolo}" modificata`);
//       toast({ title: "Pratica aggiornata" });
//     } else {
//       const { error, data: newPratica } = await supabase.from("pratiche").insert({ ...payload, proprietario_id: user.id }).select().single();
//       if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
//       praticaId = newPratica.id;
//       await logAudit("Creazione pratica", `Pratica "${form.titolo}" creata`);
//       toast({ title: "Pratica creata" });
//     }

//     const validScadenze = scadenze.filter(s => s.data);
//     if (validScadenze.length > 0 && praticaId) {
//       await supabase.from("scadenze").insert(validScadenze.map(s => ({ titolo: s.titolo || form.titolo, data_scadenza: format(s.data!, "yyyy-MM-dd"), id_pratica: praticaId })));
//       const { data: { user: currentUser } } = await supabase.auth.getUser();
//       if (currentUser) {
//         await (supabase as any).from("eventi_calendario").insert(validScadenze.map(s => ({
//           user_id: currentUser.id,
//           titolo: `📌 ${s.titolo || form.titolo}`,
//           colore: "#ef4444",
//           data: format(s.data!, "yyyy-MM-dd"),
//           id_pratica: praticaId,
//         })));
//       }
//       await logAudit("Nuove scadenze", `${validScadenze.length} scadenze aggiunte alla pratica "${form.titolo}"`);
//     }

//     setDialogOpen(false); setEditId(null); setForm(emptyForm); load();
//   };

//   const handleDelete = async () => {
//     if (!deleteId) return;
//     await supabase.from("scadenze").delete().eq("id_pratica", deleteId);
//     const { error } = await supabase.from("pratiche").delete().eq("id", deleteId);
//     if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
//     await logAudit("Eliminazione pratica", `Pratica "${deleteTitolo}" eliminata`);
//     toast({ title: "Pratica eliminata" }); setDeleteId(null); load();
//   };

//   const handleFiltroChange = (val: string) => {
//     setFiltroStato(val);
//     if (val === "tutti") { searchParams.delete("stato"); } else { searchParams.set("stato", val); }
//     setSearchParams(searchParams, { replace: true });
//   };

//   const getClientName = (p: Pratica) => p.clienti?.nome_completo || p.cliente_nome || "—";

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight">Pratiche</h1>
//           <p className="text-muted-foreground text-sm mt-1">{pratiche.length} pratiche totali</p>
//         </div>
//         <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuova Pratica</Button>
//       </div>

//       <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
//         <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
//           <DialogHeader><DialogTitle>{editId ? "Modifica Pratica" : "Nuova Pratica"}</DialogTitle></DialogHeader>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2"><Label>Titolo</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} required /></div>
//             <div className="space-y-2"><Label>Descrizione</Label><Textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} /></div>
//             <div className="space-y-2">
//               <Label>Cliente</Label>
//               <div className="flex gap-2 mb-2">
//                 <Button type="button" size="sm" variant={clienteMode === "registrato" ? "default" : "outline"} onClick={() => setClienteMode("registrato")}>Registrato</Button>
//                 <Button type="button" size="sm" variant={clienteMode === "libero" ? "default" : "outline"} onClick={() => setClienteMode("libero")}>Non registrato</Button>
//               </div>
//               {clienteMode === "registrato" ? (
//                 <Select value={form.id_cliente} onValueChange={v => setForm(f => ({ ...f, id_cliente: v }))}><SelectTrigger><SelectValue placeholder="Seleziona cliente" /></SelectTrigger><SelectContent>{clienti.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent></Select>
//               ) : (
//                 <Input placeholder="Nome cliente" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} />
//               )}
//             </div>
//             <div className="space-y-2">
//               <Label>Tipo</Label>
//               <Select value={form.id_tipo} onValueChange={v => setForm(f => ({ ...f, id_tipo: v }))}><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger><SelectContent>{tipi.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Stato</Label>
//               <Select value={form.stato} onValueChange={v => setForm(f => ({ ...f, stato: v as StatoPratica }))}>
//                 <SelectTrigger><SelectValue /></SelectTrigger>
//                 <SelectContent>{stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}</SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label>Colore pratica</Label>
//               <div className="flex gap-2 flex-wrap">
//                 <button type="button" className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center text-xs ${!form.colore ? "border-foreground scale-110" : "border-muted"}`}
//                   style={{ backgroundColor: "transparent" }} onClick={() => setForm(f => ({ ...f, colore: "" }))}>—</button>
//                 {colori.map(c => (
//                   <button key={c.id} type="button"
//                     className={`w-8 h-8 rounded-full border-2 transition-transform ${form.colore === c.colore ? "border-foreground scale-110" : "border-transparent"}`}
//                     style={{ backgroundColor: c.colore }} onClick={() => setForm(f => ({ ...f, colore: c.colore }))}
//                     title={c.label} />
//                 ))}
//               </div>
//             </div>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
//               <div className="space-y-2">
//                 <Label className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" /> Preventivato (€)</Label>
//                 <Input type="number" step="0.01" min="0" value={form.guadagno_preventivato} onChange={e => setForm(f => ({ ...f, guadagno_preventivato: e.target.value }))} />
//               </div>
//               <div className="space-y-2">
//                 <Label>Data fine stimata</Label>
//                 <Input type="date" value={form.data_preventivata_fine} onChange={e => setForm(f => ({ ...f, data_preventivata_fine: e.target.value }))} />
//               </div>
//             </div>
//             <div className="flex items-center gap-3"><Switch checked={form.privata} onCheckedChange={v => setForm(f => ({ ...f, privata: v }))} /><Label>Pratica privata</Label></div>

//             <div className="border-t pt-4 space-y-3">
//               <div className="flex items-center justify-between">
//                 <Label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Scadenze</Label>
//                 <Button type="button" variant="outline" size="sm" onClick={() => setScadenze(prev => [...prev, { titolo: "", data: undefined }])}><Plus className="h-3 w-3 mr-1" /> Aggiungi</Button>
//               </div>
//               {scadenze.map((s, idx) => (
//                 <div key={idx} className="flex gap-2 items-start">
//                   <div className="flex-1 space-y-2">
//                     <Input placeholder={`Titolo (default: ${form.titolo || "titolo pratica"})`} value={s.titolo} onChange={e => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, titolo: e.target.value } : x))} />
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !s.data && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{s.data ? format(s.data, "dd/MM/yyyy") : "Seleziona data"}</Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={s.data} onSelect={d => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, data: d } : x))} locale={it} className="p-3 pointer-events-auto" /></PopoverContent>
//                     </Popover>
//                   </div>
//                   <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => setScadenze(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
//                 </div>
//               ))}
//               {scadenze.length === 0 && <p className="text-xs text-muted-foreground">Nessuna scadenza aggiunta.</p>}
//             </div>

//             <Button type="submit" className="w-full h-12">{editId ? "Salva Modifiche" : "Crea Pratica"}</Button>
//           </form>
//         </DialogContent>
//       </Dialog>

//       <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Eliminare la pratica?</AlertDialogTitle>
//             <AlertDialogDescription>Questa azione è irreversibile. La pratica "{deleteTitolo}" e tutte le scadenze collegate verranno eliminate.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Annulla</AlertDialogCancel>
//             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       <div className="flex flex-col lg:flex-row gap-3">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input placeholder="Cerca per titolo o cliente..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
//         </div>
        
//         <div className="flex flex-col sm:flex-row gap-2">
          
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" className="w-full sm:w-[240px] justify-start">
//                 <ListOrdered className="h-4 w-4 mr-2 shrink-0" />
//                 <span className="truncate">
//                   {tipoOrdinamento === "custom" && "Ordine punto della situazione"}
//                   {tipoOrdinamento === "data" && "Ordine per data"}
//                   {tipoOrdinamento === "alfabetico" && "Ordine alfabetico A-Z"}
//                 </span>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="start" className="w-[240px]">
//               <DropdownMenuItem onClick={() => setTipoOrdinamento("custom")}>
//                 Ordine punto della situazione
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setTipoOrdinamento("data")}>
//                 Ordine per data
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setTipoOrdinamento("alfabetico")}>
//                 Ordine alfabetico A-Z
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <Select value={filtroColore} onValueChange={setFiltroColore}>
//             <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Colore" /></SelectTrigger>
//             <SelectContent>
//               <SelectItem value="tutti">Tutti i colori</SelectItem>
//               {colori.map(c => (
//                 <SelectItem key={c.id} value={c.colore}>
//                   <div className="flex items-center gap-2">
//                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.colore }} />
//                     {c.label || "Colore"}
//                   </div>
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           <Select value={filtroStato} onValueChange={handleFiltroChange}>
//             <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
//             <SelectContent>
//               <SelectItem value="tutti">Tutti gli stati</SelectItem>
//               {stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       <div className="hidden md:block">
//         <Card>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b bg-muted/30">
//                     <th className="w-[20px] p-3"></th>
//                     <th className="text-left p-3 font-medium text-muted-foreground">Titolo</th>
//                     <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
//                     <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
//                     <th className="text-left p-3 font-medium text-muted-foreground">
//                       <div className="flex items-center gap-1">
//                         Data 
//                         {tipoOrdinamento === "data" && <ArrowDown className="h-3 w-3" />}
//                       </div>
//                     </th>
//                     <th className="text-left p-3 font-medium text-muted-foreground">Stato</th>
//                     <th className="text-left p-3 font-medium text-muted-foreground w-16"></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filtered.map(p => (
//                     <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/pratiche/${p.id}`)}>
//                       <td className="p-3">{p.colore && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.colore }} />}</td>
//                       <td className="p-3 font-medium max-w-[200px] truncate">{p.titolo}</td>
//                       <td className="p-3 text-muted-foreground max-w-[150px] truncate">{getClientName(p)}</td>
//                       <td className="p-3 text-muted-foreground hidden lg:table-cell">{p.tipi_pratica?.label || "—"}</td>
//                       <td className="p-3 text-muted-foreground whitespace-nowrap">{format(parseISO(p.created_at), "dd/MM/yyyy")}</td>
//                       <td className="p-3">
//                         <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
//                       </td>
//                       <td className="p-3">
//                         <div className="flex items-center gap-1">
//                           {p.privata && <Lock className="h-4 w-4 text-muted-foreground" />}
//                           <DropdownMenu>
//                             <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
//                               <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align="end">
//                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
//                               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Nessuna pratica trovata.</p>}
//           </CardContent>
//         </Card>
//       </div>

//       <div className="md:hidden space-y-3">
//         {filtered.map(p => (
//           <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/pratiche/${p.id}`)}>
//             <CardContent className="p-4">
//               <div className="flex items-start justify-between gap-2">
//                 <div className="min-w-0 flex-1">
//                   <p className="font-medium flex items-center gap-2 truncate">
//                     {p.colore && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
//                     {p.titolo} {p.privata && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
//                   </p>
//                   <p className="text-xs text-muted-foreground mt-1 truncate">{getClientName(p)} · {p.tipi_pratica?.label || "—"}</p>
//                   <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(p.created_at), "dd/MM/yyyy")}</p>
//                 </div>
//                 <div className="flex items-center gap-1 shrink-0">
//                   <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
//                       <Button variant="ghost" size="icon" className="h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
//                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//         {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nessuna pratica trovata.</p>}
//       </div>
//     </div>
//   );
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Lock, CalendarIcon, Euro, Trash2, MoreVertical, Edit, ArrowDown, ListOrdered } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useStatiPratica } from "@/hooks/use-stati-pratica";
import { useColoriPratica } from "@/hooks/use-colori-pratica";
import type { Pratica, Cliente, TipoPratica, StatoPratica } from "@/types/database";

type PraticaForm = {
  titolo: string;
  descrizione: string;
  id_cliente: string;
  id_tipo: string;
  cliente_nome: string;
  privata: boolean;
  stato: StatoPratica;
  colore: string;
  guadagno_preventivato: string;
  data_preventivata_fine: string;
};

type ScadenzaEntry = { titolo: string; data: Date | undefined };

const emptyForm: PraticaForm = { titolo: "", descrizione: "", id_cliente: "", id_tipo: "", cliente_nome: "", privata: false, stato: "aperta", colore: "", guadagno_preventivato: "0", data_preventivata_fine: "" };

export default function Pratiche() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [tipi, setTipi] = useState<TipoPratica[]>([]);
  const [filtroStato, setFiltroStato] = useState<string>(searchParams.get("stato") || "tutti");
  const [filtroColore, setFiltroColore] = useState<string>("tutti");
  const [ricerca, setRicerca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PraticaForm>(emptyForm);
  const [clienteMode, setClienteMode] = useState<"registrato" | "libero">("registrato");
  const [scadenze, setScadenze] = useState<ScadenzaEntry[]>([]);
  const [tipoOrdinamento, setTipoOrdinamento] = useState<"custom" | "data" | "alfabetico">("custom");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitolo, setDeleteTitolo] = useState("");
  const { toast } = useToast();
  const { stati, getLabel, getColore } = useStatiPratica();
  const { colori } = useColoriPratica();

  const load = async () => {
    const { data } = await supabase.from("pratiche").select("*, clienti(*), tipi_pratica(*)").order("ordine_situazione", { ascending: true });
    setPratiche((data as Pratica[]) || []);
    const { data: c } = await supabase.from("clienti").select("*").order("nome_completo");
    setClienti((c as Cliente[]) || []);
    const { data: t } = await supabase.from("tipi_pratica").select("*").order("label");
    setTipi((t as TipoPratica[]) || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const stato = searchParams.get("stato"); if (stato) setFiltroStato(stato); }, [searchParams]);
  useEffect(() => {
    const modificaId = searchParams.get("modifica");
    if (modificaId && pratiche.length > 0) {
      const p = pratiche.find(pr => pr.id === modificaId);
      if (p) { openEdit(p); searchParams.delete("modifica"); setSearchParams(searchParams, { replace: true }); }
    }
  }, [searchParams, pratiche]);

  const filtered = pratiche.filter((p) => {
    if (filtroStato !== "tutti" && p.stato !== filtroStato) return false;
    if (filtroColore !== "tutti" && p.colore !== filtroColore) return false;
    const clientName = p.clienti?.nome_completo || p.cliente_nome || "";
    if (ricerca && !p.titolo.toLowerCase().includes(ricerca.toLowerCase()) && !clientName.toLowerCase().includes(ricerca.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (tipoOrdinamento === "custom") {
      const aChiusa = a.stato === "chiusa" ? 1 : 0;
      const bChiusa = b.stato === "chiusa" ? 1 : 0;
      if (aChiusa !== bChiusa) return aChiusa - bChiusa;
      return (a.ordine_situazione ?? 0) - (b.ordine_situazione ?? 0);
    }
    if (tipoOrdinamento === "alfabetico") {
      return a.titolo.localeCompare(b.titolo, 'it');
    }
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const openEdit = (p: Pratica) => {
    setEditId(p.id);
    setClienteMode(p.id_cliente ? "registrato" : "libero");
    setForm({
      titolo: p.titolo, descrizione: p.descrizione || "", id_cliente: p.id_cliente || "",
      id_tipo: p.id_tipo || "", cliente_nome: p.cliente_nome || "", privata: p.privata,
      stato: p.stato, colore: p.colore || "",
      guadagno_preventivato: String(p.guadagno_preventivato ?? 0),
      data_preventivata_fine: p.data_preventivata_fine || "",
    });
    setScadenze([]);
    setDialogOpen(true);
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setClienteMode("registrato"); setScadenze([]); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let finalIdCliente = clienteMode === "registrato" && form.id_cliente ? form.id_cliente : null;
    let finalClienteNome = clienteMode === "libero" && form.cliente_nome ? form.cliente_nome : null;

    if (clienteMode === "libero" && form.cliente_nome.trim()) {
      const nomeNormalized = form.cliente_nome.trim().toLowerCase().replace(/\s+/g, " ");
      const existing = clienti.find(c => c.nome_completo.trim().toLowerCase().replace(/\s+/g, " ") === nomeNormalized);
      if (existing) { finalIdCliente = existing.id; finalClienteNome = null; }
      else {
        const { data: newCliente } = await supabase.from("clienti").insert({ nome_completo: form.cliente_nome.trim() }).select().single();
        if (newCliente) { finalIdCliente = newCliente.id; finalClienteNome = null; }
      }
    }

    const payload: any = {
      titolo: form.titolo, descrizione: form.descrizione || null,
      id_cliente: finalIdCliente, cliente_nome: finalClienteNome,
      id_tipo: form.id_tipo || null, privata: form.privata, stato: form.stato,
      colore: form.colore || null,
      guadagno_preventivato: parseFloat(form.guadagno_preventivato) || 0,
      data_preventivata_fine: form.data_preventivata_fine || null,
    };

    let praticaId = editId;

    if (editId) {
      const { error } = await supabase.from("pratiche").update(payload).eq("id", editId);
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
      await logAudit("Modifica pratica", `Pratica "${form.titolo}" modificata`);
      toast({ title: "Pratica aggiornata" });
    } else {
      const { error, data: newPratica } = await supabase.from("pratiche").insert({ ...payload, proprietario_id: user.id }).select().single();
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
      praticaId = newPratica.id;
      await logAudit("Creazione pratica", `Pratica "${form.titolo}" creata`);
      toast({ title: "Pratica creata" });
    }

    const validScadenze = scadenze.filter(s => s.data);
    if (validScadenze.length > 0 && praticaId) {
      await supabase.from("scadenze").insert(validScadenze.map(s => ({ titolo: s.titolo || form.titolo, data_scadenza: format(s.data!, "yyyy-MM-dd"), id_pratica: praticaId })));
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await (supabase as any).from("eventi_calendario").insert(validScadenze.map(s => ({
          user_id: currentUser.id,
          titolo: `📌 ${s.titolo || form.titolo}`,
          colore: "#ef4444",
          data: format(s.data!, "yyyy-MM-dd"),
          id_pratica: praticaId,
        })));
      }
      await logAudit("Nuove scadenze", `${validScadenze.length} scadenze aggiunte alla pratica "${form.titolo}"`);
    }

    setDialogOpen(false); setEditId(null); setForm(emptyForm); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("scadenze").delete().eq("id_pratica", deleteId);
    const { error } = await supabase.from("pratiche").delete().eq("id", deleteId);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); return; }
    await logAudit("Eliminazione pratica", `Pratica "${deleteTitolo}" eliminata`);
    toast({ title: "Pratica eliminata" }); setDeleteId(null); load();
  };

  const handleFiltroChange = (val: string) => {
    setFiltroStato(val);
    if (val === "tutti") { searchParams.delete("stato"); } else { searchParams.set("stato", val); }
    setSearchParams(searchParams, { replace: true });
  };

  const getClientName = (p: Pratica) => p.clienti?.nome_completo || p.cliente_nome || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pratiche</h1>
          <p className="text-muted-foreground text-sm mt-1">{pratiche.length} pratiche totali</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nuova Pratica</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditId(null); }}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto top-[10%] translate-y-0 sm:top-[50%] sm:-translate-y-[50%]">
          <DialogHeader><DialogTitle>{editId ? "Modifica Pratica" : "Nuova Pratica"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Button type="submit" className="w-full h-12 sm:hidden">{editId ? "Salva Modifiche" : "Crea Pratica"}</Button>
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
                  style={{ backgroundColor: "transparent" }} onClick={() => setForm(f => ({ ...f, colore: "" }))}>—</button>
                {colori.map(c => (
                  <button key={c.id} type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${form.colore === c.colore ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.colore }} onClick={() => setForm(f => ({ ...f, colore: c.colore }))}
                    title={c.label} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Euro className="h-3.5 w-3.5" /> Preventivato (€)</Label>
                <Input type="number" step="0.01" min="0" value={form.guadagno_preventivato} onChange={e => setForm(f => ({ ...f, guadagno_preventivato: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data fine stimata</Label>
                <Input type="date" value={form.data_preventivata_fine} onChange={e => setForm(f => ({ ...f, data_preventivata_fine: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.privata} onCheckedChange={v => setForm(f => ({ ...f, privata: v }))} /><Label>Pratica privata</Label></div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Scadenze</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setScadenze(prev => [...prev, { titolo: "", data: undefined }])}><Plus className="h-3 w-3 mr-1" /> Aggiungi</Button>
              </div>
              {scadenze.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input placeholder={`Titolo (default: ${form.titolo || "titolo pratica"})`} value={s.titolo} onChange={e => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, titolo: e.target.value } : x))} />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !s.data && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{s.data ? format(s.data, "dd/MM/yyyy") : "Seleziona data"}</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={s.data} onSelect={d => setScadenze(prev => prev.map((x, i) => i === idx ? { ...x, data: d } : x))} locale={it} className="p-3 pointer-events-auto" /></PopoverContent>
                    </Popover>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => setScadenze(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              {scadenze.length === 0 && <p className="text-xs text-muted-foreground">Nessuna scadenza aggiunta.</p>}
            </div>

            <Button type="submit" className="w-full h-12 hidden sm:flex">{editId ? "Salva Modifiche" : "Crea Pratica"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la pratica?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione è irreversibile. La pratica "{deleteTitolo}" e tutte le scadenze collegate verranno eliminate.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca per titolo o cliente..." className="pl-9" value={ricerca} onChange={e => setRicerca(e.target.value)} />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[240px] justify-start">
                <ListOrdered className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">
                  {tipoOrdinamento === "custom" && "Ordine punto della situazione"}
                  {tipoOrdinamento === "data" && "Ordine per data"}
                  {tipoOrdinamento === "alfabetico" && "Ordine alfabetico A-Z"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              <DropdownMenuItem onClick={() => setTipoOrdinamento("custom")}>
                Ordine punto della situazione
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTipoOrdinamento("data")}>
                Ordine per data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTipoOrdinamento("alfabetico")}>
                Ordine alfabetico A-Z
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={filtroColore} onValueChange={setFiltroColore}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Colore" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti i colori</SelectItem>
              {colori.map(c => (
                <SelectItem key={c.id} value={c.colore}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.colore }} />
                    {c.label || "Colore"}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroStato} onValueChange={handleFiltroChange}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti gli stati</SelectItem>
              {stati.map(s => <SelectItem key={s.id} value={s.valore}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="w-[20px] p-3"></th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Titolo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Descrizione</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        Data 
                        {tipoOrdinamento === "data" && <ArrowDown className="h-3 w-3" />}
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Stato</th>
                    <th className="text-left p-3 font-medium text-muted-foreground w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/pratiche/${p.id}`)}>
                      <td className="p-3">{p.colore && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.colore }} />}</td>
                      <td className="p-3 font-medium max-w-[200px] truncate">{p.titolo}</td>
                      <td className="p-3 text-muted-foreground max-w-[250px] truncate">{p.descrizione || "—"}</td>
                      <td className="p-3 text-muted-foreground max-w-[150px] truncate">{getClientName(p)}</td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{format(parseISO(p.created_at), "dd/MM/yyyy")}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {p.privata && <Lock className="h-4 w-4 text-muted-foreground" />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Nessuna pratica trovata.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(p => (
          <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/pratiche/${p.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium flex items-center gap-2 truncate">
                    {p.colore && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />}
                    {p.titolo} {p.privata && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{getClientName(p)} · {p.tipi_pratica?.label || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(p.created_at), "dd/MM/yyyy")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-xs text-center justify-center" style={{ borderColor: getColore(p.stato), color: getColore(p.stato), backgroundColor: `${getColore(p.stato)}15` }}>{getLabel(p.stato)}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit className="h-4 w-4 mr-2" /> Modifica</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteTitolo(p.titolo); }} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Elimina</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nessuna pratica trovata.</p>}
      </div>
    </div>
  );
}