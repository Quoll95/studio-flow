export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          azione: string
          created_at: string
          dettagli: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          azione: string
          created_at?: string
          dettagli?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          azione?: string
          created_at?: string
          dettagli?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categorie_spesa: {
        Row: {
          created_at: string
          id: string
          label: string
          ordine: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          ordine?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          ordine?: number
        }
        Relationships: []
      }
      clienti: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome_completo: string
          note: string | null
          p_iva_cf: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome_completo: string
          note?: string | null
          p_iva_cf?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string
          note?: string | null
          p_iva_cf?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      colori_pratica: {
        Row: {
          colore: string
          created_at: string
          id: string
          label: string
          ordine: number
        }
        Insert: {
          colore?: string
          created_at?: string
          id?: string
          label: string
          ordine?: number
        }
        Update: {
          colore?: string
          created_at?: string
          id?: string
          label?: string
          ordine?: number
        }
        Relationships: []
      }
      eventi_calendario: {
        Row: {
          avvisi: string[]
          colore: string
          created_at: string
          data: string
          descrizione: string | null
          id: string
          id_pratica: string | null
          ora_fine: string | null
          ora_inizio: string | null
          titolo: string
          user_id: string
        }
        Insert: {
          avvisi?: string[]
          colore?: string
          created_at?: string
          data: string
          descrizione?: string | null
          id?: string
          id_pratica?: string | null
          ora_fine?: string | null
          ora_inizio?: string | null
          titolo: string
          user_id: string
        }
        Update: {
          avvisi?: string[]
          colore?: string
          created_at?: string
          data?: string
          descrizione?: string | null
          id?: string
          id_pratica?: string | null
          ora_fine?: string | null
          ora_inizio?: string | null
          titolo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventi_calendario_id_pratica_fkey"
            columns: ["id_pratica"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      file_pratica: {
        Row: {
          created_at: string
          dimensione: number | null
          id: string
          id_pratica: string
          mime_type: string | null
          nome_file: string
          storage_path: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dimensione?: number | null
          id?: string
          id_pratica: string
          mime_type?: string | null
          nome_file: string
          storage_path: string
          tipo?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dimensione?: number | null
          id?: string
          id_pratica?: string
          mime_type?: string | null
          nome_file?: string
          storage_path?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_pratica_id_pratica_fkey"
            columns: ["id_pratica"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      movimenti_pratica: {
        Row: {
          created_at: string
          data: string
          descrizione: string | null
          id: string
          id_pratica: string
          importo: number
          tipo: string
        }
        Insert: {
          created_at?: string
          data?: string
          descrizione?: string | null
          id?: string
          id_pratica: string
          importo?: number
          tipo?: string
        }
        Update: {
          created_at?: string
          data?: string
          descrizione?: string | null
          id?: string
          id_pratica?: string
          importo?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimenti_pratica_id_pratica_fkey"
            columns: ["id_pratica"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      netto_tasse_config: {
        Row: {
          categoria_key: string
          coefficiente: number
          created_at: string
          fatturato: number
          id: string
          min_int: number
          min_sogg: number
          nome: string
          perc_int: number
          perc_sogg: number
          perc_tasse: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_key: string
          coefficiente?: number
          created_at?: string
          fatturato?: number
          id?: string
          min_int?: number
          min_sogg?: number
          nome: string
          perc_int?: number
          perc_sogg?: number
          perc_tasse?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria_key?: string
          coefficiente?: number
          created_at?: string
          fatturato?: number
          id?: string
          min_int?: number
          min_sogg?: number
          nome?: string
          perc_int?: number
          perc_sogg?: number
          perc_tasse?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      netto_tasse_storico: {
        Row: {
          anno: string
          created_at: string
          id: string
          paolo_lordo: number
          paolo_netto: number
          paolo_rim_int: number
          paolo_rim_sogg: number
          paolo_tasse: number
          roberto_lordo: number
          roberto_netto: number
          roberto_rim_int: number
          roberto_rim_sogg: number
          roberto_tasse: number
          sergio_lordo: number
          sergio_netto: number
          sergio_rim_int: number
          sergio_rim_sogg: number
          sergio_tasse: number
          totale_famiglia: number
          user_id: string
        }
        Insert: {
          anno: string
          created_at?: string
          id?: string
          paolo_lordo?: number
          paolo_netto?: number
          paolo_rim_int?: number
          paolo_rim_sogg?: number
          paolo_tasse?: number
          roberto_lordo?: number
          roberto_netto?: number
          roberto_rim_int?: number
          roberto_rim_sogg?: number
          roberto_tasse?: number
          sergio_lordo?: number
          sergio_netto?: number
          sergio_rim_int?: number
          sergio_rim_sogg?: number
          sergio_tasse?: number
          totale_famiglia?: number
          user_id: string
        }
        Update: {
          anno?: string
          created_at?: string
          id?: string
          paolo_lordo?: number
          paolo_netto?: number
          paolo_rim_int?: number
          paolo_rim_sogg?: number
          paolo_tasse?: number
          roberto_lordo?: number
          roberto_netto?: number
          roberto_rim_int?: number
          roberto_rim_sogg?: number
          roberto_tasse?: number
          sergio_lordo?: number
          sergio_netto?: number
          sergio_rim_int?: number
          sergio_rim_sogg?: number
          sergio_tasse?: number
          totale_famiglia?: number
          user_id?: string
        }
        Relationships: []
      }
      note_cliente: {
        Row: {
          colore: string
          created_at: string
          id: string
          id_cliente: string
          ordine: number
          testo: string
          updated_at: string
        }
        Insert: {
          colore?: string
          created_at?: string
          id?: string
          id_cliente: string
          ordine?: number
          testo?: string
          updated_at?: string
        }
        Update: {
          colore?: string
          created_at?: string
          id?: string
          id_cliente?: string
          ordine?: number
          testo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_cliente_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      note_giornaliere: {
        Row: {
          contenuto: string
          created_at: string
          data: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contenuto?: string
          created_at?: string
          data: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contenuto?: string
          created_at?: string
          data?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      note_giornaliere_postit: {
        Row: {
          colore: string
          created_at: string
          data: string
          id: string
          ordine: number
          testo: string
          user_id: string
        }
        Insert: {
          colore?: string
          created_at?: string
          data: string
          id?: string
          ordine?: number
          testo?: string
          user_id: string
        }
        Update: {
          colore?: string
          created_at?: string
          data?: string
          id?: string
          ordine?: number
          testo?: string
          user_id?: string
        }
        Relationships: []
      }
      note_pratica: {
        Row: {
          colore: string
          created_at: string
          id: string
          id_pratica: string
          ordine: number
          testo: string
          updated_at: string
        }
        Insert: {
          colore?: string
          created_at?: string
          id?: string
          id_pratica: string
          ordine?: number
          testo?: string
          updated_at?: string
        }
        Update: {
          colore?: string
          created_at?: string
          id?: string
          id_pratica?: string
          ordine?: number
          testo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_pratica_id_pratica_fkey"
            columns: ["id_pratica"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      note_spese: {
        Row: {
          colore: string
          created_at: string
          id: string
          ordine: number
          testo: string
          user_id: string
        }
        Insert: {
          colore?: string
          created_at?: string
          id?: string
          ordine?: number
          testo?: string
          user_id: string
        }
        Update: {
          colore?: string
          created_at?: string
          id?: string
          ordine?: number
          testo?: string
          user_id?: string
        }
        Relationships: []
      }
      pratiche: {
        Row: {
          cliente_nome: string | null
          colore: string | null
          created_at: string
          data_preventivata_fine: string | null
          descrizione: string | null
          guadagni: number | null
          guadagno_preventivato: number | null
          id: string
          id_cliente: string | null
          id_tipo: string | null
          ordine_situazione: number
          privata: boolean
          proprietario_id: string
          soldi_presi: number | null
          spese: number | null
          stato: string
          titolo: string
          updated_at: string
        }
        Insert: {
          cliente_nome?: string | null
          colore?: string | null
          created_at?: string
          data_preventivata_fine?: string | null
          descrizione?: string | null
          guadagni?: number | null
          guadagno_preventivato?: number | null
          id?: string
          id_cliente?: string | null
          id_tipo?: string | null
          ordine_situazione?: number
          privata?: boolean
          proprietario_id: string
          soldi_presi?: number | null
          spese?: number | null
          stato?: string
          titolo: string
          updated_at?: string
        }
        Update: {
          cliente_nome?: string | null
          colore?: string | null
          created_at?: string
          data_preventivata_fine?: string | null
          descrizione?: string | null
          guadagni?: number | null
          guadagno_preventivato?: number | null
          id?: string
          id_cliente?: string | null
          id_tipo?: string | null
          ordine_situazione?: number
          privata?: boolean
          proprietario_id?: string
          soldi_presi?: number | null
          spese?: number | null
          stato?: string
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pratiche_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pratiche_id_tipo_fkey"
            columns: ["id_tipo"]
            isOneToOne: false
            referencedRelation: "tipi_pratica"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_email_enabled: boolean
          daily_email_hour: number
          email: string | null
          id: string
          nome_completo: string | null
        }
        Insert: {
          created_at?: string
          daily_email_enabled?: boolean
          daily_email_hour?: number
          email?: string | null
          id: string
          nome_completo?: string | null
        }
        Update: {
          created_at?: string
          daily_email_enabled?: boolean
          daily_email_hour?: number
          email?: string | null
          id?: string
          nome_completo?: string | null
        }
        Relationships: []
      }
      punti_situazione: {
        Row: {
          completata: boolean
          created_at: string
          data: string | null
          descrizione: string | null
          id: string
          id_pratica: string
          ordine: number
          testo: string
        }
        Insert: {
          completata?: boolean
          created_at?: string
          data?: string | null
          descrizione?: string | null
          id?: string
          id_pratica: string
          ordine?: number
          testo: string
        }
        Update: {
          completata?: boolean
          created_at?: string
          data?: string | null
          descrizione?: string | null
          id?: string
          id_pratica?: string
          ordine?: number
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "punti_situazione_id_pratica_fkey"
            columns: ["id_pratica"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      scadenze: {
        Row: {
          avvisi: string[]
          completata: boolean
          created_at: string
          data_scadenza: string
          id: string
          id_pratica: string | null
          titolo: string
        }
        Insert: {
          avvisi?: string[]
          completata?: boolean
          created_at?: string
          data_scadenza: string
          id?: string
          id_pratica?: string | null
          titolo: string
        }
        Update: {
          avvisi?: string[]
          completata?: boolean
          created_at?: string
          data_scadenza?: string
          id?: string
          id_pratica?: string | null
          titolo?: string
        }
        Relationships: [
          {
            foreignKeyName: "scadenze_id_pratica_fkey"
            columns: ["id_pratica"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      spese_fisse: {
        Row: {
          categoria: string
          created_at: string
          data: string
          frequenza_mesi: number
          id: string
          importo: number
          n_rate: number
          note: string | null
          titolo: string
          user_id: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          data?: string
          frequenza_mesi?: number
          id?: string
          importo?: number
          n_rate?: number
          note?: string | null
          titolo: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          frequenza_mesi?: number
          id?: string
          importo?: number
          n_rate?: number
          note?: string | null
          titolo?: string
          user_id?: string
        }
        Relationships: []
      }
      stati_pratica: {
        Row: {
          colore: string
          created_at: string
          id: string
          label: string
          ordine: number
          valore: string
        }
        Insert: {
          colore?: string
          created_at?: string
          id?: string
          label: string
          ordine?: number
          valore: string
        }
        Update: {
          colore?: string
          created_at?: string
          id?: string
          label?: string
          ordine?: number
          valore?: string
        }
        Relationships: []
      }
      tipi_pratica: {
        Row: {
          created_at: string
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
