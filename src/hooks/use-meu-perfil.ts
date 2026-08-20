import { useQuery } from "@tanstack/react-query";
import {
  type AppRole,
  getExternalSupabase,
  hasExternalSupabaseConfig,
} from "@/integrations/external-supabase/client";

export type MeuPerfil = {
  userId: string;
  nome: string;
  role: AppRole;
  departamento: string | null;
  cargaHoraria: number | null;
  isMaster: boolean;
};

export function useMeuPerfil() {
  const configOk = hasExternalSupabaseConfig();
  return useQuery({
    enabled: configOk,
    queryKey: ["meu-perfil"],
    queryFn: async (): Promise<MeuPerfil | null> => {
      const client = getExternalSupabase();
      const { data: userRes } = await client.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return null;

      const { data: registro, error } = await client
        .from("user_roles")
        .select("nome, app_role")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      if (!registro) return null;

      const { data: funcionario, error: funcionarioError } = await client
        .from("funcionarios_hcm")
        .select("departamento, carga_horaria")
        .eq("usuario_id", uid)
        .maybeSingle();
      if (funcionarioError) throw funcionarioError;

      return {
        userId: uid,
        nome: registro.nome,
        role: registro.app_role as AppRole,
        departamento: funcionario?.departamento ?? null,
        cargaHoraria: funcionario?.carga_horaria ?? null,
        isMaster: registro.app_role === "master",
      };
    },
  });
}
