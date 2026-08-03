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
  isMaster: boolean;
  isGestor: boolean;
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
        .select("nome, role, departamento")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      if (!registro) return null;

      const departamento = registro.departamento?.trim().toLowerCase();

      return {
        userId: uid,
        nome: registro.nome,
        role: registro.role as AppRole,
        departamento: registro.departamento,
        isMaster: registro.role === "master",
        isGestor: departamento === "gestor",
      };
    },
  });
}
