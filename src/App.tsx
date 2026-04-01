import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Pratiche from "@/pages/Pratiche";
import Clienti from "@/pages/Clienti";
import ClienteDettaglio from "@/pages/ClienteDettaglio";
import Calendario from "@/pages/Calendario";
import PraticaDettaglio from "@/pages/PraticaDettaglio";
import AuditLog from "@/pages/AuditLog";
import Impostazioni from "@/pages/Impostazioni";
import PuntoSituazione from "@/pages/PuntoSituazione";
import Guadagni from "@/pages/Guadagni";
import SpeseFisse from "@/pages/SpeseFisse";
import NettoTasse from "@/pages/NettoTasse";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Caricamento...</p></div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route index element={<Dashboard />} />
            <Route path="pratiche" element={<Pratiche />} />
            <Route path="pratiche/:id" element={<PraticaDettaglio />} />
            <Route path="situazione" element={<PuntoSituazione />} />
            <Route path="guadagni" element={<Guadagni />} />
            <Route path="spese-fisse" element={<SpeseFisse />} />
            <Route path="netto-tasse" element={<NettoTasse />} />
            <Route path="clienti" element={<Clienti />} />
            <Route path="clienti/:id" element={<ClienteDettaglio />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="impostazioni" element={<Impostazioni />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
