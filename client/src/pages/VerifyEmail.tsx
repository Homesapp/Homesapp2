import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [_, setLocation] = useLocation();
  const searchParams = useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = new URLSearchParams(searchParams).get("token");
      
      if (!token) {
        setStatus("error");
        setMessage("Token de verificación no encontrado");
        return;
      }

      try {
        const response = await fetch(`/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Error al verificar el email");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Error de conexión. Por favor intenta de nuevo.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${
              status === "loading" ? "bg-primary/10" :
              status === "success" ? "bg-green-100 dark:bg-green-900/20" :
              "bg-red-100 dark:bg-red-900/20"
            }`}>
              {status === "loading" ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : status === "success" ? (
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" ? "Verificando Email" : 
             status === "success" ? "¡Email Verificado!" : 
             "Error de Verificación"}
          </CardTitle>
          <CardDescription>
            {status === "loading" ? "Por favor espera un momento..." : message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Tu cuenta ha sido verificada exitosamente.</p>
              <p className="mt-2">Ahora puedes iniciar sesión con tu email y contraseña.</p>
            </div>
          )}
          
          {status !== "loading" && (
            <Button
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-goto-login"
            >
              {status === "success" ? "Ir a Inicio de Sesión" : "Volver"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
