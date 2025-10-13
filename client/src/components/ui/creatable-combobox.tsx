import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreatableComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
  placeholder?: string;
  emptyText?: string;
  createText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  testId?: string;
}

export function CreatableCombobox({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  emptyText = "No se encontraron resultados.",
  createText = "Crear",
  searchPlaceholder = "Buscar...",
  disabled = false,
  testId,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedOption = options.find((option) => option.id === value);
  
  // Check if search value matches any existing option
  const exactMatch = options.find(
    (option) => option.label.toLowerCase() === searchValue.toLowerCase()
  );

  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue === value ? "" : currentValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleCreate = () => {
    if (searchValue.trim()) {
      // Use the search value as the new value
      onValueChange(searchValue.trim());
      setOpen(false);
      setSearchValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-testid={testId}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              <div className="text-sm text-muted-foreground py-2">
                {emptyText}
              </div>
              {searchValue.trim() && !exactMatch && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleCreate}
                  data-testid={`${testId}-create-new`}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createText} "{searchValue.trim()}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => handleSelect(option.id)}
                  data-testid={`${testId}-option-${option.id}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {searchValue.trim() && !exactMatch && options.length > 0 && (
              <CommandGroup>
                <CommandItem onSelect={handleCreate} data-testid={`${testId}-create-new-alt`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {createText} "{searchValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
