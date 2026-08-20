import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import logo from "@/assets/HCM-PONTO.png";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-4">
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
