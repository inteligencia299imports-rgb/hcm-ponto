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
    throw redirect({ to: "/ponto" });
  },
  component: () => null,
});
