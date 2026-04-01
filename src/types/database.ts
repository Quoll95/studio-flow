export type Cliente = {
  id: string;
  nome_completo: string;
  p_iva_cf: string | null;
  email: string | null;
  telefono: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type TipoPratica = {
  id: string;
  label: string;
  created_at: string;
};

export type StatoPraticaRecord = {
  id: string;
  label: string;
  valore: string;
  colore: string;
  ordine: number;
  created_at: string;
};

export type ColorePratica = {
  id: string;
  label: string;
  colore: string;
  ordine: number;
  created_at: string;
};

export type StatoPratica = string;

export type Pratica = {
  id: string;
  titolo: string;
  descrizione: string | null;
  id_cliente: string | null;
  id_tipo: string | null;
  cliente_nome: string | null;
  stato: StatoPratica;
  privata: boolean;
  proprietario_id: string;
  colore: string | null;
  spese: number;
  guadagni: number;
  guadagno_preventivato: number;
  data_preventivata_fine: string | null;
  soldi_presi: number;
  ordine_situazione: number;
  created_at: string;
  updated_at: string;
  clienti?: Cliente | null;
  tipi_pratica?: TipoPratica | null;
};

export type Scadenza = {
  id: string;
  titolo: string;
  data_scadenza: string;
  id_pratica: string | null;
  completata: boolean;
  avvisi: string[];
  created_at: string;
  pratiche?: Pratica | null;
};

export type PuntoDellaSituazione = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ora_inizio: string | null;
  ora_fine: string | null;
  id: string;
  id_pratica: string;
  testo: string;
  descrizione: string | null;
  completata: boolean;
  ordine: number;
  data: string | null;
  created_at: string;
};

export type NotaPratica = {
  id: string;
  id_pratica: string;
  testo: string;
  colore: string;
  created_at: string;
  updated_at: string;
  ora_inizio: string | null;
  ora_fine: string | null;
};

export type EventoCalendario = {
  id: string;
  user_id: string;
  titolo: string;
  descrizione: string | null;
  colore: string;
  data: string;
  ora_inizio: string | null;
  ora_fine: string | null;
  id_pratica: string | null;
  avvisi: string[];
  created_at: string;
  pratiche?: Pratica | null;
};

export type NotaGiornaliera = {
  id: string;
  data: string;
  contenuto: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type NotaGiornalieraPostit = {
  id: string;
  user_id: string;
  data: string;
  testo: string;
  colore: string;
  ordine: number;
  created_at: string;
};

export type MovimentoPratica = {
  id: string;
  id_pratica: string;
  tipo: 'entrata' | 'uscita';
  importo: number;
  descrizione: string | null;
  data: string;
  created_at: string;
};

export type AuditLogEntry = {
  id: string;
  user_id: string | null;
  azione: string;
  dettagli: string | null;
  created_at: string;
  profiles?: { nome_completo: string | null; email: string | null } | null;
};
