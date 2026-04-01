import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StatoPraticaRecord } from "@/types/database";

export function useStatiPratica() {
  const [stati, setStati] = useState<StatoPraticaRecord[]>([]);

  const load = async () => {
    const { data } = await supabase.from("stati_pratica").select("*").order("ordine");
    setStati((data as StatoPraticaRecord[]) || []);
  };

  useEffect(() => { load(); }, []);

  const getLabel = (valore: string) => stati.find(s => s.valore === valore)?.label || valore;
  const getColore = (valore: string) => stati.find(s => s.valore === valore)?.colore || "#94a3b8";

  const getBadgeClass = (valore: string) => {
    const colore = getColore(valore);
    // Return inline style-compatible approach
    return "";
  };

  return { stati, getLabel, getColore, reload: load };
}
