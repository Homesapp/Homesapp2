import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadFloatingActionButtonProps {
  visible: boolean;
  onClick: () => void;
  label?: string;
}

export function LeadFloatingActionButton({
  visible,
  onClick,
  label = "Agregar",
}: LeadFloatingActionButtonProps) {
  if (!visible) return null;

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      onClick={onClick}
      data-testid="button-fab-primary"
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
