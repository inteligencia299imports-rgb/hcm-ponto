import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { getExternalSupabase } from "@/integrations/external-supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/HCM-PONTO.png";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  async function sair() {
    await getExternalSupabase().auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/ponto" className="flex items-center gap-3">
            <img
              src={logo}
              alt="HCM Ponto"
              className="h-10 w-10 rounded-md object-cover object-center animate-logo-glow-sm transition-transform hover:scale-105"
            />
            <span className="font-bold tracking-tight text-xs sm:text-sm text-muted-foreground">
              HCM Ponto
            </span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-muted-foreground hover:text-muted-foreground"
            onClick={sair}
            aria-label="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
