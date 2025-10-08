import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredDialog({ open, onOpenChange }: AuthRequiredDialogProps) {
  const [, setLocation] = useLocation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-auth-required">
        <AlertDialogHeader>
          <AlertDialogTitle>Crea tu cuenta para continuar</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Para coordinar citas y acceder a todas las funcionalidades de HomesApp,
              necesitas tener una cuenta.
            </p>
            
            <div className="space-y-3 pt-2">
              <p className="font-semibold text-foreground">Beneficios de la plataforma:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Coordina citas y recorridos de propiedades fácilmente</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Guarda tus propiedades favoritas para verlas después</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Recibe notificaciones sobre nuevas propiedades</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Accede a información detallada y precios exclusivos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Gestiona todas tus solicitudes desde un solo lugar</span>
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-auth">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setLocation("/auth/register");
            }}
            data-testid="button-create-account"
          >
            Crear cuenta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
