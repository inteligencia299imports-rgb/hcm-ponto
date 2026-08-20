import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function ColunaTempo({
  valores,
  selecionado,
  onSelect,
  onStep,
}: {
  valores: string[];
  selecionado: string;
  onSelect: (v: string) => void;
  onStep: (v: string) => void;
}) {
  const selecionadoRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selecionadoRef.current?.scrollIntoView({ block: "center" });
  }, [selecionado]);

  // O seletor abre num Popover dentro de um Dialog; o bloqueio de scroll do
  // Radix Dialog intercepta o evento de wheel antes dele chegar aqui (o
  // popover é renderizado num portal fora da árvore DOM do Dialog, então o
  // remove-scroll do Dialog não reconhece esta div como rolável). Em vez de
  // depender do scroll nativo do navegador, ajusta o scrollTop manualmente.
  function rolar(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    if (containerRef.current) containerRef.current.scrollTop += e.deltaY;
  }

  // O seletor abre num Popover dentro de um Dialog; nesse aninhamento, o
  // bloqueio de scroll do Dialog costuma impedir o gesto de arrastar pra
  // rolar no celular. As setas dão um jeito de trocar o valor sem depender
  // do scroll por toque, que é o que falha nos aparelhos reais. Usam
  // onStep (não onSelect) porque o avanço da seta não deve fechar o popover.
  function passo(delta: number) {
    const atual = valores.indexOf(selecionado);
    const base = atual === -1 ? 0 : atual;
    onStep(valores[(base + delta + valores.length) % valores.length]);
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => passo(-1)}
        aria-label="Anterior"
        className="flex h-7 w-14 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <div
        ref={containerRef}
        onWheel={rolar}
        className="h-56 w-14 touch-pan-y overflow-y-auto overscroll-contain"
      >
        <div className="flex flex-col gap-0.5 p-1">
          {valores.map((v) => {
            const ativo = v === selecionado;
            return (
              <button
                key={v}
                type="button"
                ref={ativo ? selecionadoRef : undefined}
                onClick={() => onSelect(v)}
                className={cn(
                  "rounded-md py-1.5 text-center text-sm tabular-nums transition-colors hover:bg-accent",
                  ativo && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => passo(1)}
        aria-label="Próximo"
        className="flex h-7 w-14 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TimePicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hora, minuto] = value ? value.split(":") : ["--", "--"];

  function definirHora(h: string) {
    onChange(`${h}:${minuto === "--" ? "00" : minuto}`);
  }
  function ajustarMinuto(m: string) {
    onChange(`${hora === "--" ? "00" : hora}:${m}`);
  }
  function selecionarMinuto(m: string) {
    ajustarMinuto(m);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" className="w-28 justify-start font-normal shrink-0">
          <Clock className="h-4 w-4" />
          {value ? (
            <span className="tabular-nums">{value}</span>
          ) : (
            <span className="text-muted-foreground">Selecione</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex divide-x">
          <ColunaTempo
            valores={HORAS}
            selecionado={hora}
            onSelect={definirHora}
            onStep={definirHora}
          />
          <ColunaTempo
            valores={MINUTOS}
            selecionado={minuto}
            onSelect={selecionarMinuto}
            onStep={ajustarMinuto}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
