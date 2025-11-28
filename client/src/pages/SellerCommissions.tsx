import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Clock, Home } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Commission {
  id: string;
  amount: number;
  propertyName: string;
  clientName: string;
  status: 'pending' | 'approved' | 'paid';
  rentalDate: string;
  paidAt?: string;
}

export default function SellerCommissions() {
  const { t } = useLanguage();

  const { data: commissions = [], isLoading } = useQuery<Commission[]>({
    queryKey: ["/api/external-seller/commissions"],
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    paid: "Pagada"
  };

  const totalEarned = commissions.reduce((sum, c) => 
    c.status === "paid" ? sum + Number(c.amount) : sum, 0
  );

  const pendingAmount = commissions.reduce((sum, c) => 
    c.status === "pending" || c.status === "approved" ? sum + Number(c.amount) : sum, 0
  );

  const totalCommissions = commissions.length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mis Comisiones</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Gestiona tus comisiones por rentas realizadas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-earned">
              {formatCurrency(totalEarned)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comisiones pagadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-amount">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendientes de pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operaciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-operations">
              {totalCommissions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rentas realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Comisiones</CardTitle>
          <CardDescription>Revisa el estado de tus comisiones por rentas</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Aún no tienes comisiones registradas
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tus comisiones aparecerán aquí cuando cierres una renta
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover-elevate gap-3"
                  data-testid={`commission-${commission.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">
                        {formatCurrency(commission.amount)}
                      </span>
                      <Badge className={statusColors[commission.status]}>
                        {statusLabels[commission.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{commission.propertyName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Cliente: {commission.clientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{new Date(commission.rentalDate).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                    {commission.status === 'paid' && commission.paidAt && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
