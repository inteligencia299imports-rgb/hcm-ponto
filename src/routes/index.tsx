import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getExternalSupabase,
  hasExternalSupabaseConfig,
} from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    if (!hasExternalSupabaseConfig()) throw redirect({ to: "/auth" });
    const client = getExternalSupabase();
    const { data } = await client.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });

    const { data: registro } = await client
      .from("user_roles")
      .select("departamento")
      .eq("user_id", data.user.id)
      .maybeSingle();
    const departamento = registro?.departamento?.trim().toLowerCase();
    throw redirect({ to: departamento === "gestor" ? "/acompanhamento" : "/ponto" });
  },
  component: () => null,
});
