import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Home, DollarSign, AlertCircle, CheckCircle2, Clock, XCircle, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Condominium = {
  id: string;
  name: string;
  approvalStatus: string;
};

type CondominiumUnit = {
  id: string;
  condominiumId: string;
  unitNumber: string;
  ownerId: string | null;
  floor: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
};

type CondominiumFee = {
  id: string;
  condominiumId: string;
  unitId: string;
  amount: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  description: string | null;
};

type CondominiumIssue = {
  id: string;
  condominiumId: string;
  reportedById: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  location: string | null;
  reportedAt: string;
};

export default function HoaManagement() {
  const { toast } = useToast();
  const [selectedCondominium, setSelectedCondominium] = useState<string>("");

  // Fetch condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums"],
  });

  // Fetch units for selected condominium
  const { data: units = [], isLoading: loadingUnits } = useQuery<CondominiumUnit[]>({
    queryKey: ["/api/hoa/condominiums", selectedCondominium, "units"],
    enabled: !!selectedCondominium,
  });

  // Fetch fees for selected condominium
  const { data: fees = [], isLoading: loadingFees } = useQuery<CondominiumFee[]>({
    queryKey: ["/api/hoa/condominiums", selectedCondominium, "fees"],
    enabled: !!selectedCondominium,
  });

  // Fetch issues for selected condominium
  const { data: issues = [], isLoading: loadingIssues } = useQuery<CondominiumIssue[]>({
    queryKey: ["/api/hoa/condominiums", selectedCondominium, "issues"],
    enabled: !!selectedCondominium,
  });

  // Calculate stats
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.ownerId).length;
  const vacantUnits = totalUnits - occupiedUnits;

  const pendingFees = fees.filter(f => f.status === "pending").length;
  const paidFees = fees.filter(f => f.status === "paid").length;
  const overdueFees = fees.filter(f => f.status === "overdue").length;

  const openIssues = issues.filter(i => i.status === "open").length;
  const inProgressIssues = issues.filter(i => i.status === "in_progress").length;
  const resolvedIssues = issues.filter(i => i.status === "resolved").length;

  const totalFeeAmount = fees
    .filter(f => f.status === "pending" || f.status === "paid")
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const paidFeeAmount = fees
    .filter(f => f.status === "paid")
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-hoa-management">Gestión HOA</h1>
        <p className="text-muted-foreground">
          Administración de condominios, cuotas e incidencias
        </p>
      </div>

      {/* Condominium Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Condominio</CardTitle>
          <CardDescription>Elige el condominio que deseas gestionar</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
            <SelectTrigger data-testid="select-condominium">
              <SelectValue placeholder="Selecciona un condominio" />
            </SelectTrigger>
            <SelectContent>
              {condominiums
                .filter(c => c.approvalStatus === "approved")
                .map(condominium => (
                  <SelectItem 
                    key={condominium.id} 
                    value={condominium.id}
                    data-testid={`select-option-condominium-${condominium.id}`}
                  >
                    {condominium.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCondominium && (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-units">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUnits}</div>
                <p className="text-xs text-muted-foreground">
                  {occupiedUnits} ocupadas, {vacantUnits} vacantes
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-fee-stats">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cuotas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fees.length}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingFees} pendientes, {overdueFees} vencidas
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-collection-rate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recaudación</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${paidFeeAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  de ${totalFeeAmount.toLocaleString()} total
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-issues-stats">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{issues.length}</div>
                <p className="text-xs text-muted-foreground">
                  {openIssues} abiertas, {inProgressIssues} en progreso
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Units, Fees, and Issues */}
          <Tabs defaultValue="units" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="units" data-testid="tab-units">Unidades</TabsTrigger>
              <TabsTrigger value="fees" data-testid="tab-fees">Cuotas</TabsTrigger>
              <TabsTrigger value="issues" data-testid="tab-issues">Incidencias</TabsTrigger>
            </TabsList>

            <TabsContent value="units" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Unidades del Condominio</CardTitle>
                  <CardDescription>
                    {totalUnits} unidad{totalUnits !== 1 ? "es" : ""} registrada{totalUnits !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUnits ? (
                    <div className="text-center text-muted-foreground py-8">
                      Cargando unidades...
                    </div>
                  ) : units.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No hay unidades registradas
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {units.map(unit => (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                          data-testid={`unit-${unit.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Home className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Unidad {unit.unitNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {unit.floor && `Piso ${unit.floor}`}
                                {unit.bedrooms && ` · ${unit.bedrooms} rec.`}
                                {unit.bathrooms && ` · ${unit.bathrooms} baños`}
                              </p>
                            </div>
                          </div>
                          <Badge variant={unit.ownerId ? "default" : "secondary"}>
                            {unit.ownerId ? "Ocupada" : "Vacante"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Cuotas</CardTitle>
                  <CardDescription>Distribución por estado de pago</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Pagadas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{paidFees}</span>
                        <Badge variant="default">
                          {fees.length > 0 ? Math.round((paidFees / fees.length) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Pendientes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{pendingFees}</span>
                        <Badge variant="default">
                          {fees.length > 0 ? Math.round((pendingFees / fees.length) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Vencidas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{overdueFees}</span>
                        <Badge variant="destructive">
                          {fees.length > 0 ? Math.round((overdueFees / fees.length) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cuotas Recientes</CardTitle>
                  <CardDescription>
                    {fees.length} cuota{fees.length !== 1 ? "s" : ""} registrada{fees.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingFees ? (
                    <div className="text-center text-muted-foreground py-8">
                      Cargando cuotas...
                    </div>
                  ) : fees.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No hay cuotas registradas
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fees.slice(0, 10).map(fee => (
                        <div
                          key={fee.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                          data-testid={`fee-${fee.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">${parseFloat(fee.amount).toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                Vence: {new Date(fee.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              fee.status === "paid"
                                ? "default"
                                : fee.status === "overdue"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {fee.status === "paid"
                              ? "Pagada"
                              : fee.status === "overdue"
                              ? "Vencida"
                              : "Pendiente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Incidencias</CardTitle>
                  <CardDescription>Distribución por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Abiertas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{openIssues}</span>
                        <Badge variant="destructive">
                          {issues.length > 0 ? Math.round((openIssues / issues.length) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">En progreso</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{inProgressIssues}</span>
                        <Badge variant="default">
                          {issues.length > 0 ? Math.round((inProgressIssues / issues.length) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Resueltas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{resolvedIssues}</span>
                        <Badge variant="default">
                          {issues.length > 0 ? Math.round((resolvedIssues / issues.length) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Incidencias Recientes</CardTitle>
                  <CardDescription>
                    {issues.length} incidencia{issues.length !== 1 ? "s" : ""} registrada{issues.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingIssues ? (
                    <div className="text-center text-muted-foreground py-8">
                      Cargando incidencias...
                    </div>
                  ) : issues.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No hay incidencias registradas
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {issues.slice(0, 10).map(issue => (
                        <div
                          key={issue.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                          data-testid={`issue-${issue.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{issue.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {issue.category} · {issue.priority} prioridad
                                {issue.location && ` · ${issue.location}`}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              issue.status === "resolved"
                                ? "default"
                                : issue.status === "open"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {issue.status === "open"
                              ? "Abierta"
                              : issue.status === "in_progress"
                              ? "En progreso"
                              : issue.status === "resolved"
                              ? "Resuelta"
                              : "Cerrada"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedCondominium && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona un condominio para ver su información</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
