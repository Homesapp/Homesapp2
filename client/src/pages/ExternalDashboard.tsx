import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DollarSign, Wrench, Calendar, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExternalProperty, ExternalPayment, ExternalMaintenanceTicket } from "@shared/schema";

export default function ExternalDashboard() {
  const { language } = useLanguage();

  const { data: properties, isLoading: propertiesLoading } = useQuery<ExternalProperty[]>({
    queryKey: ['/api/external-properties'],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<ExternalPayment[]>({
    queryKey: ['/api/external-payments'],
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ['/api/external-tickets'],
  });

  const stats = {
    totalProperties: properties?.length || 0,
    pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
    overduePayments: payments?.filter(p => p.status === 'overdue').length || 0,
    openTickets: tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0,
  };

  const isLoading = propertiesLoading || paymentsLoading || ticketsLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "es" ? "Dashboard de Gestión Externa" : "External Management Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Resumen general de tu agencia y propiedades externas"
            : "Overview of your agency and external properties"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-properties">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Propiedades Totales" : "Total Properties"}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-properties">
                {stats.totalProperties}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-pending-payments">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pagos Pendientes" : "Pending Payments"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-pending-payments">
                {stats.pendingPayments}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-overdue-payments">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pagos Vencidos" : "Overdue Payments"}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive" data-testid="text-overdue-payments">
                {stats.overduePayments}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-open-tickets">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Tickets Abiertos" : "Open Tickets"}
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-open-tickets">
                {stats.openTickets}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-recent-payments">
          <CardHeader>
            <CardTitle>
              {language === "es" ? "Pagos Recientes" : "Recent Payments"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Últimos pagos registrados" : "Latest recorded payments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b pb-2"
                    data-testid={`payment-${payment.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {payment.type === 'rent' 
                          ? (language === "es" ? "Renta" : "Rent")
                          : payment.type === 'water'
                          ? (language === "es" ? "Agua" : "Water")
                          : payment.type === 'electricity'
                          ? (language === "es" ? "Electricidad" : "Electricity")
                          : (language === "es" ? "Internet" : "Internet")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.dueDate).toLocaleDateString(language === "es" ? "es-MX" : "en-US")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        ${payment.amount.toLocaleString()} {payment.currency}
                      </p>
                      <p className={`text-xs ${
                        payment.status === 'paid' 
                          ? 'text-green-600' 
                          : payment.status === 'overdue'
                          ? 'text-destructive'
                          : 'text-yellow-600'
                      }`}>
                        {payment.status === 'paid' 
                          ? (language === "es" ? "Pagado" : "Paid")
                          : payment.status === 'overdue'
                          ? (language === "es" ? "Vencido" : "Overdue")
                          : (language === "es" ? "Pendiente" : "Pending")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "es" ? "No hay pagos registrados" : "No payments recorded"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recent-tickets">
          <CardHeader>
            <CardTitle>
              {language === "es" ? "Tickets Recientes" : "Recent Tickets"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Solicitudes de mantenimiento más recientes" : "Latest maintenance requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : tickets && tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between border-b pb-2"
                    data-testid={`ticket-${ticket.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`text-xs px-2 py-1 rounded ${
                        ticket.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : ticket.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.status === 'resolved' 
                          ? (language === "es" ? "Resuelto" : "Resolved")
                          : ticket.status === 'in_progress'
                          ? (language === "es" ? "En Progreso" : "In Progress")
                          : (language === "es" ? "Abierto" : "Open")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "es" ? "No hay tickets registrados" : "No tickets recorded"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
