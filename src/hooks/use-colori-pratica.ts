import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ColorePratica } from "@/types/database";

export function useColoriPratica() {
  const [colori, setColori] = useState<ColorePratica[]>([]);

  const load = async () => {
    const { data } = await supabase.from("colori_pratica").select("*").order("ordine");
    setColori((data as ColorePratica[]) || []);
  };

  useEffect(() => { load(); }, []);

  return { colori, reload: load };
}
