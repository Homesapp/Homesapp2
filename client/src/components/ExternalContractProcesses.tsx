import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface ExternalContractProcessesProps {
  searchTerm: string;
  statusFilter: string;
  viewMode: string;
}

export default function ExternalContractProcesses({ searchTerm, statusFilter, viewMode }: ExternalContractProcessesProps) {
  const { language } = useLanguage();

  // This would query contract processes in the future
  const contractProcesses: any[] = [];

  const filteredProcesses = contractProcesses.filter((process: any) => {
    // Apply search filter
    const matchesSearch = !searchTerm || 
      process.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = process.status !== "completed" && (!process.expiresAt || new Date(process.expiresAt) >= new Date());
    } else if (statusFilter === "completed") {
      matchesStatus = process.status === "completed";
    } else if (statusFilter === "expired") {
      matchesStatus = process.status !== "completed" && process.expiresAt && new Date(process.expiresAt) < new Date();
    }
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          {language === "es" ? "Procesos de Contrato" : "Contract Processes"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === "es"
            ? "Gestiona el proceso completo desde la oferta hasta la activación de la renta"
            : "Manage the complete process from offer to rental activation"}
        </p>
      </div>

      {filteredProcesses.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === "es" ? "No hay procesos de contrato" : "No contract processes"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === "es"
              ? "Los procesos de contrato aparecerán aquí cuando se completen ofertas y formularios de renta"
              : "Contract processes will appear here when offers and rental forms are completed"}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProcesses.map((process: any) => (
            <Card key={process.id} className="hover-elevate" data-testid={`card-process-${process.id}`}>
              <CardHeader>
                <CardTitle className="text-base">{process.clientName}</CardTitle>
                <CardDescription>{process.propertyTitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === "es" ? "Creado" : "Created"}
                  </span>
                  <span>
                    {format(new Date(process.createdAt), "dd/MM/yyyy", {
                      locale: language === "es" ? es : enUS,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {language === "es" ? "Estado" : "Status"}
                  </span>
                  <Badge variant={process.status === "completed" ? "default" : "outline"}>
                    {process.status}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  data-testid="button-view-process"
                >
                  {language === "es" ? "Ver Detalles" : "View Details"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "es" ? "Cliente" : "Client"}</TableHead>
                <TableHead>{language === "es" ? "Propiedad" : "Property"}</TableHead>
                <TableHead>{language === "es" ? "Creado" : "Created"}</TableHead>
                <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcesses.map((process: any) => (
                <TableRow key={process.id}>
                  <TableCell className="font-medium">{process.clientName}</TableCell>
                  <TableCell>{process.propertyTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(process.createdAt), "dd/MM/yyyy", {
                      locale: language === "es" ? es : enUS,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={process.status === "completed" ? "default" : "outline"}>
                      {process.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid="button-view-process"
                    >
                      {language === "es" ? "Ver" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
