import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getExternalSupabase,
  hasExternalSupabaseConfig,
  type PontoRegistro,
  type TipoPonto,
} from "@/integrations/external-supabase/client";
import {
  chaveDiaOperacional,
  DATA_MINIMA_FILTRO,
  fmtDataCompleta,
  fmtDiaMes,
  fmtHoraSaoPaulo,
  instanteDoDiaOperacional,
  limiteDiaOperacional,
} from "@/lib/tempo";
import { agruparPontosPorDia, fmtDuracaoHoras, type LinhaPonto } from "@/lib/ponto";
import { abreviarNomeCompleto } from "@/lib/nomes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SingleDatePicker } from "@/components/single-date-picker";
import { TimePicker } from "@/components/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  FileText,
  Filter,
  Hourglass,
  MapPin,
  Save,
  Trash2,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

const TIPOS_PONTO_AJUSTE: { value: TipoPonto; label: string }[] = [
  { value: "entrada", label: "Entrada" },
  { value: "intervalo", label: "Intervalo" },
  { value: "retorno", label: "Retorno" },
  { value: "saida", label: "Saída" },
];

export const Route = createFileRoute("/_authenticated/acompanhamento")({
  beforeLoad: async () => {
    if (!hasExternalSupabaseConfig()) return;
    const client = getExternalSupabase();
    const { data: userRes } = await client.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) return;

    const { data: registro } = await client
      .from("user_roles")
      .select("departamento")
      .eq("user_id", uid)
      .maybeSingle();
    const departamento = registro?.departamento?.trim().toLowerCase();
    if (departamento !== "gestor") {
      throw redirect({ to: "/ponto" });
    }
  },
  component: AcompanhamentoPage,
});

function capitalizarDepartamento(dep: string): string {
  return dep.charAt(0).toUpperCase() + dep.slice(1).toLowerCase();
}

function FolhaPontoImpressao({
  nome,
  departamento,
  periodoLabel,
  linhas,
}: {
  nome: string;
  departamento: string | null;
  periodoLabel: string;
  linhas: LinhaPonto[];
}) {
  const geradoEm = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div id="folha-ponto-impressao" className="hidden print:block bg-white p-10 text-black">
      <h1 className="text-center text-xl font-bold tracking-wide">REGISTRO DE PONTO - HCM PONTO</h1>

      <div className="mt-8 mb-6 flex items-start justify-between text-sm">
        <div className="space-y-1">
          <div>
            <span className="font-semibold">Colaborador:</span> {nome}
          </div>
          <div>
            <span className="font-semibold">Departamento:</span>{" "}
            {departamento ? capitalizarDepartamento(departamento) : "—"}
          </div>
        </div>
        <div className="text-right">
          <span className="font-semibold">Período:</span> {periodoLabel}
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-black bg-neutral-100 p-1 text-left">Dia</th>
            <th className="border border-black bg-neutral-100 p-1 text-left">Entrada</th>
            <th className="border border-black bg-neutral-100 p-1 text-left">Intervalo</th>
            <th className="border border-black bg-neutral-100 p-1 text-left">Retorno</th>
            <th className="border border-black bg-neutral-100 p-1 text-left">Saída</th>
            <th className="border border-black bg-neutral-100 p-1 text-left">Horas</th>
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 ? (
            <tr>
              <td colSpan={6} className="border border-black p-2 text-center">
                Nenhum registro no período selecionado.
              </td>
            </tr>
          ) : (
            linhas.map((linha) => (
              <tr key={linha.dia}>
                <td className="border border-black p-1">{fmtDiaMes(linha.dia)}</td>
                <td className="border border-black p-1">
                  {linha.entrada ? fmtHoraSaoPaulo(linha.entrada) : "—"}
                </td>
                <td className="border border-black p-1">
                  {linha.intervalo ? fmtHoraSaoPaulo(linha.intervalo) : "—"}
                </td>
                <td className="border border-black p-1">
                  {linha.retorno ? fmtHoraSaoPaulo(linha.retorno) : "—"}
                </td>
                <td className="border border-black p-1">
                  {linha.saida ? fmtHoraSaoPaulo(linha.saida) : "—"}
                </td>
                <td className="border border-black p-1">
                  {linha.msTrabalhados > 0 ? fmtDuracaoHoras(linha.msTrabalhados / 3_600_000) : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="folha-ponto-assinaturas grid grid-cols-2 gap-16 px-10 text-sm">
        <div className="text-center">
          <div className="border-t border-black pt-2">{nome}</div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2">Assinatura do Gestor</div>
        </div>
      </div>

      <div className="folha-ponto-rodape text-center text-xs text-neutral-500">
        Gerado em {geradoEm}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-3 sm:pt-6 flex items-center gap-3 sm:gap-4 p-3 sm:p-6">
        <div
          className={cn(
            "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full",
            accent
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div
            className={cn(
              "mt-1 truncate text-lg sm:text-2xl font-bold",
              accent ? "text-primary" : "text-foreground",
            )}
          >
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AcompanhamentoPage() {
  const queryClient = useQueryClient();
  const configOk = hasExternalSupabaseConfig();

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroOpen, setFiltroOpen] = useState(false);
  const [rascunhoInicio, setRascunhoInicio] = useState("");
  const [rascunhoFim, setRascunhoFim] = useState("");
  const [departamentoFiltro, setDepartamentoFiltro] = useState("todos");
  const [rascunhoDepartamento, setRascunhoDepartamento] = useState("todos");
  const [usuarioFiltro, setUsuarioFiltro] = useState("todos");
  const [rascunhoUsuario, setRascunhoUsuario] = useState("todos");

  const {
    data: pontosRelatorio = [],
    isLoading: isLoadingPonto,
    error: errorPonto,
  } = useQuery({
    enabled: configOk,
    queryKey: ["pontos-relatorio", dataInicio, dataFim],
    queryFn: async () => {
      const client = getExternalSupabase();
      let q = client
        .from("pontos")
        .select("id, user_id, nome_vendedor, tipo, registrado_em, latitude, longitude")
        .order("registrado_em", { ascending: true });
      if (dataInicio) q = q.gte("registrado_em", limiteDiaOperacional(dataInicio));
      if (dataFim) q = q.lt("registrado_em", limiteDiaOperacional(dataFim, 1));
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PontoRegistro[];
    },
  });

  const { data: roles = [] } = useQuery({
    enabled: configOk,
    queryKey: ["user-roles-departamentos"],
    queryFn: async () => {
      const client = getExternalSupabase();
      const { data, error } = await client
        .from("user_roles")
        .select("user_id, nome, departamento");
      if (error) throw error;
      return (data ?? []) as { user_id: string; nome: string; departamento: string | null }[];
    },
  });

  const departamentoPorUserId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const r of roles) map.set(r.user_id, r.departamento);
    return map;
  }, [roles]);

  const departamentosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const r of roles) {
      const dep = r.departamento?.trim();
      if (dep) set.add(dep);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [roles]);

  // Restrita ao departamento escolhido no rascunho do filtro, pra lista de
  // usuário já vir filtrada em cascata enquanto o usuário monta o filtro.
  const usuariosDisponiveis = useMemo(() => {
    return roles
      .filter((r) => rascunhoDepartamento === "todos" || r.departamento === rascunhoDepartamento)
      .map((r) => ({ userId: r.user_id, nome: r.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [roles, rascunhoDepartamento]);

  // O nome exibido vem sempre de user_roles, não do nome_vendedor gravado
  // na hora do registro do ponto — que fica desatualizado se o nome do
  // colaborador for corrigido depois.
  const nomePorUserIdRoles = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roles) map.set(r.user_id, r.nome);
    return map;
  }, [roles]);

  const linhasPonto = useMemo(() => {
    const filtrados = pontosRelatorio
      .filter(
        (p) =>
          (departamentoFiltro === "todos" ||
            departamentoPorUserId.get(p.user_id) === departamentoFiltro) &&
          (usuarioFiltro === "todos" || p.user_id === usuarioFiltro),
      )
      .map((p) => ({
        ...p,
        nome_vendedor: nomePorUserIdRoles.get(p.user_id) ?? p.nome_vendedor,
      }));
    return agruparPontosPorDia(filtrados);
  }, [
    pontosRelatorio,
    departamentoFiltro,
    usuarioFiltro,
    departamentoPorUserId,
    nomePorUserIdRoles,
  ]);

  // Coordenadas padrão usadas quando o ponto é ajustado manualmente pelo
  // gestor (sem captura de localização real do colaborador).
  const LOCALIZACAO_AJUSTE_PONTO = { latitude: -15.7037675048221, longitude: -47.9173897638939 };

  const HORAS_AJUSTE_VAZIAS: Record<TipoPonto, string> = {
    entrada: "",
    intervalo: "",
    retorno: "",
    saida: "",
  };

  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [ajusteUserId, setAjusteUserId] = useState<string | null>(null);
  const [ajusteNome, setAjusteNome] = useState("");
  const [ajusteDia, setAjusteDia] = useState("");
  const [ajusteHoras, setAjusteHoras] = useState<Record<TipoPonto, string>>(HORAS_AJUSTE_VAZIAS);

  // Chamado a partir de uma linha da tabela de registros: o ajuste é sempre
  // pra um dia e usuário específicos (o da linha clicada), pré-preenchido
  // com os horários já lançados naquele dia (se houver).
  function abrirAjuste(linha: LinhaPonto) {
    setAjusteUserId(linha.userId);
    setAjusteNome(linha.nome);
    setAjusteDia(linha.dia);
    setAjusteHoras({
      entrada: linha.entrada ? fmtHoraSaoPaulo(linha.entrada) : "",
      intervalo: linha.intervalo ? fmtHoraSaoPaulo(linha.intervalo) : "",
      retorno: linha.retorno ? fmtHoraSaoPaulo(linha.retorno) : "",
      saida: linha.saida ? fmtHoraSaoPaulo(linha.saida) : "",
    });
    setAjusteOpen(true);
  }

  const ajustarPonto = useMutation({
    mutationFn: async (vars: {
      userId: string;
      nome: string;
      dia: string;
      horas: Record<TipoPonto, string>;
    }) => {
      const client = getExternalSupabase();
      // Um registro por tipo por dia/usuário: se já existe, atualiza o
      // horário; senão, cria um novo. Não mexe em tipos deixados em branco.
      const existentes = pontosRelatorio.filter(
        (p) => p.user_id === vars.userId && chaveDiaOperacional(p.registrado_em) === vars.dia,
      );
      const idPorTipo = new Map<TipoPonto, string>();
      for (const p of existentes) idPorTipo.set(p.tipo, p.id);

      for (const { value: tipo } of TIPOS_PONTO_AJUSTE) {
        const hora = vars.horas[tipo];
        const idExistente = idPorTipo.get(tipo);
        if (!hora) {
          // Campo limpo pelo ícone de excluir: apaga o registro existente.
          if (idExistente) {
            const { error } = await client.from("pontos").delete().eq("id", idExistente);
            if (error) throw error;
          }
          continue;
        }
        const registrado_em = instanteDoDiaOperacional(vars.dia, hora);
        if (idExistente) {
          const { error } = await client
            .from("pontos")
            .update({ registrado_em })
            .eq("id", idExistente);
          if (error) throw error;
        } else {
          const { error } = await client.from("pontos").insert({
            user_id: vars.userId,
            nome_vendedor: vars.nome,
            tipo,
            registrado_em,
            latitude: LOCALIZACAO_AJUSTE_PONTO.latitude,
            longitude: LOCALIZACAO_AJUSTE_PONTO.longitude,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Ponto ajustado com sucesso!");
      setAjusteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pontos-relatorio"] });
    },
    onError: (err: Error) => {
      toast.error("Não foi possível ajustar o ponto", { description: err.message });
    },
  });

  // Só o último tipo preenchido pode ser excluído (não dá pra apagar
  // Retorno, por exemplo, se Saída já foi batida naquele dia).
  const ultimoTipoComHorario = (() => {
    for (let i = TIPOS_PONTO_AJUSTE.length - 1; i >= 0; i--) {
      const tipo = TIPOS_PONTO_AJUSTE[i].value;
      if (ajusteHoras[tipo]) return tipo;
    }
    return null;
  })();

  function limparHoraAjuste(tipo: TipoPonto) {
    setAjusteHoras((prev) => ({ ...prev, [tipo]: "" }));
  }

  function confirmarAjuste() {
    if (!ajusteUserId) return;
    ajustarPonto.mutate({
      userId: ajusteUserId,
      nome: ajusteNome,
      dia: ajusteDia,
      horas: ajusteHoras,
    });
  }

  const [impressaoOpen, setImpressaoOpen] = useState(false);
  const [impressaoDepartamento, setImpressaoDepartamento] = useState("todos");
  const [impressaoUserId, setImpressaoUserId] = useState<string | null>(null);
  const [impressaoTrigger, setImpressaoTrigger] = useState(0);

  const colaboradoresParaImpressao = useMemo(() => {
    return roles
      .filter((r) => impressaoDepartamento === "todos" || r.departamento === impressaoDepartamento)
      .map((r) => ({ userId: r.user_id, nome: r.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [roles, impressaoDepartamento]);

  const colaboradorImpressao = useMemo(
    () => roles.find((r) => r.user_id === impressaoUserId) ?? null,
    [roles, impressaoUserId],
  );

  const linhasPontoImpressao = useMemo(() => {
    if (!impressaoUserId) return [];
    return agruparPontosPorDia(pontosRelatorio.filter((p) => p.user_id === impressaoUserId));
  }, [pontosRelatorio, impressaoUserId]);

  const impressaoPeriodoLabel = useMemo(() => {
    if (dataInicio && dataFim)
      return `${fmtDataCompleta(dataInicio)} à ${fmtDataCompleta(dataFim)}`;
    if (dataInicio) return `A partir de ${fmtDataCompleta(dataInicio)}`;
    if (dataFim) return `Até ${fmtDataCompleta(dataFim)}`;
    if (linhasPontoImpressao.length > 0) {
      const dias = linhasPontoImpressao.map((l) => l.dia).sort();
      const primeiro = dias[0];
      const ultimo = dias[dias.length - 1];
      return primeiro === ultimo
        ? fmtDataCompleta(primeiro)
        : `${fmtDataCompleta(primeiro)} à ${fmtDataCompleta(ultimo)}`;
    }
    return fmtDataCompleta(chaveDiaOperacional(new Date().toISOString()));
  }, [dataInicio, dataFim, linhasPontoImpressao]);

  function abrirImpressao() {
    setImpressaoDepartamento(departamentoFiltro);
    setImpressaoUserId(null);
    setImpressaoOpen(true);
  }

  function confirmarImpressao() {
    if (!impressaoUserId) return;
    setImpressaoOpen(false);
    setImpressaoTrigger((n) => n + 1);
  }

  useEffect(() => {
    if (impressaoTrigger === 0) return;
    const t = setTimeout(() => window.print(), 150);
    return () => clearTimeout(t);
  }, [impressaoTrigger]);

  const { diasTrabalhadosMedia, horasTrabalhadasMediaEquipe } = useMemo(() => {
    const diasPorUsuario = new Map<string, Set<string>>();
    let totalHoras = 0;
    let diasComHoras = 0;

    for (const linha of linhasPonto) {
      if (linha.entrada) {
        const set = diasPorUsuario.get(linha.nome) ?? new Set<string>();
        set.add(linha.dia);
        diasPorUsuario.set(linha.nome, set);
      }
      if (linha.msTrabalhados > 0) {
        totalHoras += linha.msTrabalhados / 3_600_000;
        diasComHoras += 1;
      }
    }

    const totalUsuarios = diasPorUsuario.size;
    const totalDias = [...diasPorUsuario.values()].reduce((s, set) => s + set.size, 0);

    return {
      diasTrabalhadosMedia: totalUsuarios > 0 ? totalDias / totalUsuarios : 0,
      horasTrabalhadasMediaEquipe: diasComHoras > 0 ? totalHoras / diasComHoras : 0,
    };
  }, [linhasPonto]);

  // Sem filtro de data aplicado, a lista de registros mostra só o dia atual
  // (os KPIs acima continuam considerando todo o histórico do período).
  const linhasPontoExibidas = useMemo(() => {
    if (dataInicio || dataFim) return linhasPonto;
    const hoje = chaveDiaOperacional(new Date().toISOString());
    return linhasPonto.filter((linha) => linha.dia === hoje);
  }, [linhasPonto, dataInicio, dataFim]);

  function abrirFiltro(open: boolean) {
    if (open) {
      setRascunhoInicio(dataInicio);
      setRascunhoFim(dataFim);
      setRascunhoDepartamento(departamentoFiltro);
      setRascunhoUsuario(usuarioFiltro);
    }
    setFiltroOpen(open);
  }

  function aplicarFiltro() {
    setDataInicio(rascunhoInicio);
    setDataFim(rascunhoFim);
    setDepartamentoFiltro(rascunhoDepartamento);
    setUsuarioFiltro(rascunhoUsuario);
    setFiltroOpen(false);
  }

  function limpar() {
    setDataInicio("");
    setDataFim("");
    setRascunhoInicio("");
    setRascunhoFim("");
    setDepartamentoFiltro("todos");
    setRascunhoDepartamento("todos");
    setUsuarioFiltro("todos");
    setRascunhoUsuario("todos");
  }

  const filtroAtivo = Boolean(
    dataInicio || dataFim || departamentoFiltro !== "todos" || usuarioFiltro !== "todos",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6" /> Acompanhamento
          </h1>
          <p className="text-sm text-muted-foreground">Registros de ponto de todos os usuários.</p>
        </div>

        <div className="flex items-center gap-2">
          {filtroAtivo && (
            <Button
              variant="outline"
              size="sm"
              className="p-2"
              onClick={limpar}
              aria-label="Limpar filtro"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Popover open={filtroOpen} onOpenChange={abrirFiltro}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="p-2">
                <Filter className="h-4 w-4" />
                {filtroAtivo && <span className="ml-2 h-1.5 w-1.5 rounded-full bg-primary" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="di">Data início</Label>
                  <SingleDatePicker
                    id="di"
                    value={rascunhoInicio}
                    onChange={setRascunhoInicio}
                    minDate={DATA_MINIMA_FILTRO}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="df">Data fim</Label>
                  <SingleDatePicker
                    id="df"
                    value={rascunhoFim}
                    onChange={setRascunhoFim}
                    minDate={DATA_MINIMA_FILTRO}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Select
                    value={rascunhoDepartamento}
                    onValueChange={(v) => {
                      setRascunhoDepartamento(v);
                      setRascunhoUsuario("todos");
                    }}
                  >
                    <SelectTrigger id="departamento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {departamentosDisponiveis.map((dep) => (
                        <SelectItem key={dep} value={dep}>
                          {capitalizarDepartamento(dep)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuário</Label>
                  <Select value={rascunhoUsuario} onValueChange={setRascunhoUsuario}>
                    <SelectTrigger id="usuario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {usuariosDisponiveis.map((u) => (
                        <SelectItem key={u.userId} value={u.userId}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={aplicarFiltro} className="w-full">
                  <Check className="h-4 w-4" /> Ok
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {!configOk && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6 flex gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
            <div>
              Credenciais do banco externo não configuradas. Preencha{" "}
              <code>VITE_EXTERNAL_SUPABASE_URL</code> e <code>VITE_EXTERNAL_SUPABASE_ANON_KEY</code>{" "}
              no arquivo <code>.env</code>.
            </div>
          </CardContent>
        </Card>
      )}

      {errorPonto && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <div className="font-medium text-destructive">Não foi possível carregar o ponto</div>
              <div className="text-muted-foreground">{(errorPonto as Error).message}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Dias trabalhados (média)"
          value={
            isLoadingPonto
              ? "…"
              : diasTrabalhadosMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
          }
          icon={CalendarCheck}
          accent
        />
        <StatCard
          label="Tempo médio"
          value={
            isLoadingPonto
              ? "…"
              : horasTrabalhadasMediaEquipe > 0
                ? fmtDuracaoHoras(horasTrabalhadasMediaEquipe)
                : "—"
          }
          icon={Hourglass}
        />
      </div>

      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Registros</h2>
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={abrirImpressao}
          aria-label="Imprimir folha de ponto individual"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </div>
      <div className="mb-4 h-px w-full bg-border/50" />

      <Card>
        <CardContent className="p-0">
          {isLoadingPonto ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : linhasPontoExibidas.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Nenhum registro de ponto encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Dia</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Retorno</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead className="text-center">Ajuste</TableHead>
                  <TableHead className="text-center">Local</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhasPontoExibidas.map((linha) => (
                  <TableRow key={`${linha.userId}-${linha.dia}`}>
                    <TableCell className="whitespace-nowrap">
                      {abreviarNomeCompleto(linha.nome)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDiaMes(linha.dia)}</TableCell>
                    <TableCell>{linha.entrada ? fmtHoraSaoPaulo(linha.entrada) : "—"}</TableCell>
                    <TableCell>{linha.intervalo ? fmtHoraSaoPaulo(linha.intervalo) : "—"}</TableCell>
                    <TableCell>{linha.retorno ? fmtHoraSaoPaulo(linha.retorno) : "—"}</TableCell>
                    <TableCell>{linha.saida ? fmtHoraSaoPaulo(linha.saida) : "—"}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {linha.msTrabalhados > 0
                        ? fmtDuracaoHoras(linha.msTrabalhados / 3_600_000)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => abrirAjuste(linha)}
                        className="inline-flex cursor-pointer text-muted-foreground hover:text-foreground"
                        aria-label="Ajustar ponto deste dia/usuário"
                      >
                        <Wrench className="h-4 w-4" />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      {linha.latitude !== null && linha.longitude !== null ? (
                        <a
                          href={`https://www.google.com/maps?q=${linha.latitude},${linha.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-muted-foreground hover:text-foreground"
                          aria-label="Ver localização no mapa"
                        >
                          <MapPin className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={impressaoOpen} onOpenChange={setImpressaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Imprimir folha de ponto
            </DialogTitle>
            <DialogDescription>
              Selecione o departamento e o colaborador para geração da folha de ponto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="impressao-departamento">Departamento</Label>
              <Select
                value={impressaoDepartamento}
                onValueChange={(v) => {
                  setImpressaoDepartamento(v);
                  setImpressaoUserId(null);
                }}
              >
                <SelectTrigger id="impressao-departamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {departamentosDisponiveis.map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {capitalizarDepartamento(dep)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="impressao-colaborador">Colaborador</Label>
              <Select value={impressaoUserId ?? undefined} onValueChange={setImpressaoUserId}>
                <SelectTrigger id="impressao-colaborador">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresParaImpressao.map((c) => (
                    <SelectItem key={c.userId} value={c.userId}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={confirmarImpressao} disabled={!impressaoUserId} className="w-full">
              <FileText className="h-4 w-4" /> Gerar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Ajustar ponto
            </DialogTitle>
            <DialogDescription>
              {ajusteNome} - {ajusteDia ? fmtDiaMes(ajusteDia) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {TIPOS_PONTO_AJUSTE.map((t) => (
                <div key={t.value} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`ajuste-hora-${t.value}`}>{t.label}</Label>
                  <div className="flex items-center gap-1.5">
                    <TimePicker
                      id={`ajuste-hora-${t.value}`}
                      value={ajusteHoras[t.value]}
                      onChange={(v) => setAjusteHoras((prev) => ({ ...prev, [t.value]: v }))}
                    />
                    {t.value === ultimoTipoComHorario ? (
                      <button
                        type="button"
                        onClick={() => limparHoraAjuste(t.value)}
                        className="inline-flex cursor-pointer text-destructive hover:text-destructive/80"
                        aria-label={`Excluir ${t.label.toLowerCase()}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="inline-flex h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={confirmarAjuste} disabled={ajustarPonto.isPending} className="w-full">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {colaboradorImpressao && (
        <FolhaPontoImpressao
          nome={colaboradorImpressao.nome}
          departamento={colaboradorImpressao.departamento}
          periodoLabel={impressaoPeriodoLabel}
          linhas={linhasPontoImpressao}
        />
      )}
    </div>
  );
}
