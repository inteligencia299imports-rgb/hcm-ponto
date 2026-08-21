import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  getExternalSupabase,
  hasExternalSupabaseConfig,
  PROJETO_ID_HCM_PONTO,
} from "@/integrations/external-supabase/client";

const MENSAGEM_SEM_ACESSO =
  "Você não tem acesso a este sistema. Procure o departamento de inteligência da 299.";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import logo from "@/assets/HCM-PONTO.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const configOk = hasExternalSupabaseConfig();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configOk) {
      toast.error("Credenciais do banco externo não configuradas no .env");
      return;
    }
    setLoading(true);
    try {
      const client = getExternalSupabase();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Falha no login", { description: error.message });
        return;
      }

      const { data: registro, error: roleError } = await client
        .from("user_roles")
        .select("ativo, projeto_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (roleError) {
        await client.auth.signOut();
        toast.error("Falha no login", { description: roleError.message });
        return;
      }
      if (!registro || !registro.ativo || registro.projeto_id !== PROJETO_ID_HCM_PONTO) {
        await client.auth.signOut();
        toast.error(MENSAGEM_SEM_ACESSO);
        return;
      }

      toast.success("Bem-vindo!");
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={logo}
            alt="HCM Ponto"
            className="h-28 w-28 rounded-md object-cover object-center animate-logo-glow"
          />
          <h1 className="mt-4 text-2xl font-extrabold uppercase tracking-wide text-foreground">
            HCM Ponto
          </h1>
        </div>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !configOk}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Contas são criadas pelo administrador.
        </p>
      </div>
    </div>
  );
}
