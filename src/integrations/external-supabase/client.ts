// Cliente Supabase EXTERNO (banco do cliente) — auth + tabelas public.pontos
// e public.user_roles
// Configure em .env:
//   VITE_EXTERNAL_SUPABASE_URL=...
//   VITE_EXTERNAL_SUPABASE_ANON_KEY=...
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export type AppRole = "vendedor" | "master";

export type UserRole = {
  id: string;
  user_id: string;
  nome: string;
  role: AppRole;
  departamento: string | null;
  created_at: string;
};

export type TipoPonto = "entrada" | "intervalo" | "retorno" | "saida";

export type PontoRegistro = {
  id: string;
  user_id: string;
  nome_vendedor: string;
  tipo: TipoPonto;
  registrado_em: string;
  latitude: number | null;
  longitude: number | null;
  precisao_metros: number | null;
};

let _client: SupabaseClient | undefined;

// Só reaproveita o cliente (singleton) no navegador. No servidor (Cloudflare
// Workers), o mesmo isolate/processo pode atender requisições de usuários
// diferentes, então cachear a instância aqui vazaria estado de sessão entre
// eles — cada chamada no servidor cria um cliente novo e descartável.
export function getExternalSupabase(): SupabaseClient {
  const isBrowser = typeof window !== "undefined";
  if (isBrowser && _client) return _client;

  const url = import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) {
    throw new Error(
      "Credenciais do Supabase externo ausentes. Preencha VITE_EXTERNAL_SUPABASE_URL e VITE_EXTERNAL_SUPABASE_ANON_KEY no arquivo .env.",
    );
  }
  const client = createClient(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: {
      storage: isBrowser ? window.localStorage : undefined,
      storageKey: "external-sb-auth",
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
    },
  });
  if (isBrowser) _client = client;
  return client;
}

export function hasExternalSupabaseConfig(): boolean {
  return Boolean(
    import.meta.env.VITE_EXTERNAL_SUPABASE_URL && import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY,
  );
}
