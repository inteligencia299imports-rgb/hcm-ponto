import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  getExternalSupabase,
  hasExternalSupabaseConfig,
} from "@/integrations/external-supabase/client";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!hasExternalSupabaseConfig()) throw redirect({ to: "/auth" });
    const client = getExternalSupabase();
    let { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      // Uma falha aqui costuma ser uma corrida com o auto-refresh em segundo
      // plano (refresh token já girado por ele) e não uma sessão realmente
      // expirada. Dá uma segunda chance antes de deslogar de verdade.
      await new Promise((resolve) => setTimeout(resolve, 300));
      ({ data, error } = await client.auth.getUser());
      if (error || !data.user) throw redirect({ to: "/auth" });
    }

    const { data: registro, error: roleError } = await client
      .from("user_roles")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (roleError) throw roleError;
    if (!registro) {
      await client.auth.signOut();
      toast.error("Sua conta não tem acesso a este sistema.");
      throw redirect({ to: "/auth" });
    }

    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
