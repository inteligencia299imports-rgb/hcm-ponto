import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useMeuPerfil } from "@/hooks/use-meu-perfil";
import { Users, Clock } from "lucide-react";
import logo from "@/assets/HCM-PONTO.png";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: meuPerfil } = useMeuPerfil();

  const navItems = [
    { to: "/ponto", label: "Ponto", icon: Clock },
    ...(meuPerfil?.isGestor
      ? [{ to: "/acompanhamento", label: "Acompanhamento", icon: Users }]
      : []),
  ] as const;

  const homeLink = meuPerfil?.isGestor ? "/acompanhamento" : "/ponto";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link to={homeLink} className="flex items-center gap-3">
            <img
              src={logo}
              alt="HCM Ponto"
              className="h-10 w-10 rounded-md object-cover object-center animate-logo-glow-sm transition-transform hover:scale-105"
            />
            <span className="font-bold tracking-tight text-xs sm:text-sm text-muted-foreground">
              HCM Ponto
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
