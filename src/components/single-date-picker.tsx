import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function SingleDatePicker({
  id,
  value,
  onChange,
  allowedDates,
  minDate,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  // Quando omitido, qualquer data até hoje é selecionável.
  allowedDates?: Set<string>;
  // Data mais antiga (YYYY-MM-DD) que pode ser selecionada.
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const today = new Date();

  function isDisabled(date: Date) {
    if (date > today) return true;
    if (minDate && dateKey(date) < minDate) return true;
    if (allowedDates && !allowedDates.has(dateKey(date))) return true;
    return false;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" className="w-full justify-start font-normal">
          <CalendarIcon className="h-4 w-4" />
          {selected ? (
            selected.toLocaleDateString("pt-BR")
          ) : (
            <span className="text-muted-foreground">Selecione</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (d) onChange(dateKey(d));
            setOpen(false);
          }}
          disabled={isDisabled}
        />
      </PopoverContent>
    </Popover>
  );
}
