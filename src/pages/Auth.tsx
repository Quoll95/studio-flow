import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// import logoNero from "@/assets/logo-nero.png"; // Logo precedente — mantenuto per riferimento
import logoNero from "@/assets/logo-scritta-grande.png";

// === REGISTRAZIONE CON APPROVAZIONE — IMPORT AGGIUNTIVI ===
// Per attivare: scommentare questi import
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// === FINE IMPORT AGGIUNTIVI ===

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // === REGISTRAZIONE CON APPROVAZIONE — STATI AGGIUNTIVI ===
  // Per attivare: scommentare questi stati
  // const [nome, setNome] = useState("");
  // const [tab, setTab] = useState("login");
  // === FINE STATI AGGIUNTIVI ===

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  // === REGISTRAZIONE CON APPROVAZIONE — FUNZIONE SIGNUP ===
  // Per attivare: scommentare questa funzione
  // NOTA: prima di attivare, eseguire questa migrazione DB:
  //   ALTER TABLE public.profiles ADD COLUMN approved boolean DEFAULT false;
  //   -- Aggiornare le RLS policies per controllare profiles.approved = true
  //
  // const handleSignup = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   const { error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: {
  //       data: { nome_completo: nome },
  //       emailRedirectTo: window.location.origin,
  //     },
  //   });
  //   setLoading(false);
  //   if (error) {
  //     toast({ title: "Errore", description: error.message, variant: "destructive" });
  //   } else {
  //     toast({
  //       title: "Richiesta inviata",
  //       description: "Il tuo account è in attesa di approvazione da parte dell'amministratore.",
  //     });
  //     setTab("login");
  //     setEmail("");
  //     setPassword("");
  //     setNome("");
  //   }
  // };
  // === FINE FUNZIONE SIGNUP ===

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <img src={logoNero} alt="Studio Tecnico Ferrante" className="h-20 w-auto object-contain" />
          </div>
          <CardDescription>Gestione pratiche per studi tecnici</CardDescription>
        </CardHeader>
        <CardContent>

          {/* === VERSIONE SOLO LOGIN (attiva) === */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accesso..." : "Accedi"}
            </Button>
          </form>

          {/* === REGISTRAZIONE CON APPROVAZIONE — UI CON TABS ===
          Per attivare: commentare il form solo-login sopra e scommentare questo blocco.

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Accesso..." : "Accedi"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-nome">Nome completo</Label>
                  <Input id="reg-nome" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrazione..." : "Registrati"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          === FINE UI CON TABS === */}

        </CardContent>
      </Card>
    </div>
  );
}
