import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExternalSupabase,
  hasExternalSupabaseConfig,
  type PontoRegistro,
  type TipoPonto,
} from "@/integrations/external-supabase/client";
import { useMeuPerfil } from "@/hooks/use-meu-perfil";
import {
  chaveDiaOperacional,
  DATA_MINIMA_FILTRO,
  fmtDiaMes,
  fmtHoraSaoPaulo,
  limiteDiaOperacional,
} from "@/lib/tempo";
import { agruparPontosPorDia, fmtDuracaoHoras } from "@/lib/ponto";
import { SingleDatePicker } from "@/components/single-date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarIcon,
  Check,
  Clock,
  ClockCheck,
  Hourglass,
  LogOut,
  Loader2,
  MapPin,
  Pause,
  Play,
  X,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ponto")({
  component: PontoPage,
});

const ORDEM_TIPOS: TipoPonto[] = ["entrada", "intervalo", "retorno", "saida"];

const TIPO_INFO: Record<
  TipoPonto,
  { label: string; mensagem: string; icon: LucideIcon; corPrimaria: boolean }
> = {
  entrada: { label: "Entrada", mensagem: "Entrada registrada!", icon: ClockCheck, corPrimaria: true },
  intervalo: { label: "Intervalo", mensagem: "Intervalo registrado!", icon: Pause, corPrimaria: false },
  retorno: { label: "Retorno", mensagem: "Retorno registrado!", icon: Play, corPrimaria: true },
  saida: { label: "Saída", mensagem: "Saída registrada!", icon: LogOut, corPrimaria: false },
};

function obterLocalizacao(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalização não é suportada neste navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

function mensagemErroLocalizacao(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: number }).code;
    if (code === 1)
      return "Permissão de localização negada. Ative o acesso à localização e tente novamente.";
    if (code === 2) return "Não foi possível obter sua localização no momento.";
    if (code === 3) return "Tempo esgotado ao tentar obter sua localização.";
  }
  return err instanceof Error ? err.message : "Falha ao obter localização.";
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-0.5 truncate text-lg font-bold text-foreground">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PontoPage() {
  const queryClient = useQueryClient();
  const configOk = hasExternalSupabaseConfig();
  const { data: meuPerfil } = useMeuPerfil();

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroOpen, setFiltroOpen] = useState(false);
  const [rascunhoInicio, setRascunhoInicio] = useState("");
  const [rascunhoFim, setRascunhoFim] = useState("");

  function abrirFiltro(open: boolean) {
    if (open) {
      setRascunhoInicio(dataInicio);
      setRascunhoFim(dataFim);
    }
    setFiltroOpen(open);
  }

  function aplicarFiltro() {
    setDataInicio(rascunhoInicio);
    setDataFim(rascunhoFim);
    setFiltroOpen(false);
  }

  function limpar() {
    setDataInicio("");
    setDataFim("");
    setRascunhoInicio("");
    setRascunhoFim("");
  }

  const filtroAtivo = Boolean(dataInicio || dataFim);

  const { data: ultimoPonto, isLoading: carregandoUltimo } = useQuery({
    enabled: configOk,
    queryKey: ["ultimo-ponto"],
    queryFn: async () => {
      const client = getExternalSupabase();
      const { data: userRes } = await client.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return null;
      const { data, error } = await client
        .from("pontos")
        .select("id, tipo, registrado_em")
        .eq("user_id", uid)
        .order("registrado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; tipo: TipoPonto; registrado_em: string } | null;
    },
  });

  const {
    data: meusPontos = [],
    isLoading: carregandoPontos,
    error: erroPontos,
  } = useQuery({
    enabled: configOk,
    queryKey: ["meus-pontos", dataInicio, dataFim],
    queryFn: async () => {
      const client = getExternalSupabase();
      const { data: userRes } = await client.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return [];
      let q = client
        .from("pontos")
        .select("id, user_id, nome_vendedor, tipo, registrado_em, latitude, longitude")
        .eq("user_id", uid)
        .order("registrado_em", { ascending: true });
      if (dataInicio) q = q.gte("registrado_em", limiteDiaOperacional(dataInicio));
      if (dataFim) q = q.lt("registrado_em", limiteDiaOperacional(dataFim, 1));
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PontoRegistro[];
    },
  });

  const linhasPonto = useMemo(() => agruparPontosPorDia(meusPontos), [meusPontos]);

  const { diasTrabalhados, horasTrabalhadasMedia } = useMemo(() => {
    let dias = 0;
    let totalHoras = 0;
    let diasComHoras = 0;

    for (const linha of linhasPonto) {
      if (linha.entrada) dias += 1;
      if (linha.msTrabalhados > 0) {
        totalHoras += linha.msTrabalhados / 3_600_000;
        diasComHoras += 1;
      }
    }

    return {
      diasTrabalhados: dias,
      horasTrabalhadasMedia: diasComHoras > 0 ? totalHoras / diasComHoras : 0,
    };
  }, [linhasPonto]);

  // Se o último ponto foi num dia operacional anterior (antes das 3h), o
  // ciclo reinicia: a próxima batida é sempre entrada, mesmo que o dia
  // anterior tenha ficado incompleto (ex.: sem saída registrada).
  const proximoTipo: TipoPonto =
    !ultimoPonto || chaveDiaOperacional(ultimoPonto.registrado_em) !== chaveDiaOperacional(new Date().toISOString())
      ? "entrada"
      : ORDEM_TIPOS[(ORDEM_TIPOS.indexOf(ultimoPonto.tipo) + 1) % ORDEM_TIPOS.length];

  const bater = useMutation({
    mutationFn: async (tipo: TipoPonto) => {
      const client = getExternalSupabase();
      const { data: userRes } = await client.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid || !meuPerfil) throw new Error("Não foi possível identificar o usuário.");
      const pos = await obterLocalizacao();
      const { error } = await client.from("pontos").insert({
        user_id: uid,
        nome_vendedor: meuPerfil.nome,
        tipo,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        precisao_metros: pos.coords.accuracy,
      });
      if (error) throw error;
    },
    onSuccess: (_data, tipo) => {
      toast.success(TIPO_INFO[tipo].mensagem);
      queryClient.invalidateQueries({ queryKey: ["ultimo-ponto"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
    onError: (err: Error) => {
      toast.error("Não foi possível bater o ponto", { description: mensagemErroLocalizacao(err) });
    },
  });

  const ProximoIcon = TIPO_INFO[proximoTipo].icon;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Clock className="h-6 w-6" /> Ponto
        </h1>

        <div className="flex items-center gap-2">
          {filtroAtivo && (
            <Button
              variant="outline"
              size="sm"
              className="p-2"
              onClick={limpar}
              aria-label="Limpar filtro de data"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Popover open={filtroOpen} onOpenChange={abrirFiltro}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="p-2">
                <CalendarIcon className="h-4 w-4" />
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

      <div className="space-y-2">
        <Button
          size="lg"
          className="h-16 w-full text-lg flex"
          disabled={!configOk || carregandoUltimo || bater.isPending}
          onClick={() => bater.mutate(proximoTipo)}
        >
          {bater.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ProximoIcon className="h-5 w-5" /> {TIPO_INFO[proximoTipo].label}
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          Sua localização será solicitada ao bater o ponto.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label="Dias trabalhados" value={String(diasTrabalhados)} icon={CalendarCheck} />
        <KpiCard
          label="Horas (média)"
          value={horasTrabalhadasMedia > 0 ? fmtDuracaoHoras(horasTrabalhadasMedia) : "—"}
          icon={Hourglass}
        />
      </div>

      <h2 className="text-lg font-semibold mb-1">Registros</h2>
      <div className="mb-4 h-px w-full bg-border/50" />

      <Card>
        <CardContent className="p-0">
          {carregandoPontos ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : erroPontos ? (
            <div className="py-8 text-center text-sm text-destructive">
              {(erroPontos as Error).message}
            </div>
          ) : linhasPonto.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Retorno</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Horas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhasPonto.map((linha) => (
                  <TableRow key={linha.dia}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
