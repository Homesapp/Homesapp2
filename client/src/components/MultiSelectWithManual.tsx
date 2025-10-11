import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MultiSelectWithManualProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function MultiSelectWithManual({
  options,
  value = [],
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
  "data-testid": dataTestId,
}: MultiSelectWithManualProps) {
  const [open, setOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const handleSelect = (option: string) => {
    if (option === "Carga Manual") {
      setShowManualInput(true);
      setOpen(false);
    } else {
      const newValue = value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option];
      onChange(newValue);
    }
  };

  const handleManualAdd = () => {
    if (manualInput.trim() && !value.includes(manualInput.trim())) {
      onChange([...value, manualInput.trim()]);
      setManualInput("");
      setShowManualInput(false);
    }
  };

  const handleRemove = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className="space-y-2">
      {!showManualInput ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
              data-testid={dataTestId}
            >
              {value.length > 0
                ? `${value.length} seleccionado${value.length > 1 ? "s" : ""}`
                : placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar..." />
              <CommandEmpty>No se encontraron opciones</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="Carga Manual"
                  onSelect={() => handleSelect("Carga Manual")}
                  className="font-semibold"
                >
                  Carga Manual
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Ingrese valor manual..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleManualAdd();
              }
            }}
            data-testid={`${dataTestId}-manual-input`}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleManualAdd}
            data-testid={`${dataTestId}-manual-add`}
          >
            Agregar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setShowManualInput(false);
              setManualInput("");
            }}
            data-testid={`${dataTestId}-manual-cancel`}
          >
            Cancelar
          </Button>
        </div>
      )}
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="gap-1"
              data-testid={`badge-${dataTestId}-${item}`}
            >
              {item}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemove(item)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
