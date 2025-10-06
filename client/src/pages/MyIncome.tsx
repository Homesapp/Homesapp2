import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface IncomeTransaction {
  id: string;
  category: string;
  beneficiaryId: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  payoutBatchId?: string;
}

interface IncomeSummary {
  totalEarnings: number;
  paidAmount: number;
  pendingAmount: number;
  transactionCount: number;
  byCategory: Record<string, { count: number; total: number }>;
}

export default function MyIncome() {
  const { language } = useLanguage();

  const { data: summary, isLoading: summaryLoading } = useQuery<IncomeSummary>({
    queryKey: ["/api/income/my-summary"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<IncomeTransaction[]>({
    queryKey: ["/api/income/my-transactions"],
  });

  const isLoading = summaryLoading || transactionsLoading;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      referral_client: { es: "Referido de Cliente", en: "Client Referral" },
      referral_owner: { es: "Referido de Propietario", en: "Owner Referral" },
      rental_commission: { es: "Comisión de Renta", en: "Rental Commission" },
      other_income: { es: "Otros Ingresos", en: "Other Income" },
    };
    return labels[category]?.[language] || category;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: { es: string; en: string } }> = {
      pending: { 
        variant: "secondary", 
        label: { es: "Pendiente", en: "Pending" } 
      },
      paid: { 
        variant: "default", 
        label: { es: "Pagado", en: "Paid" } 
      },
      cancelled: { 
        variant: "destructive", 
        label: { es: "Cancelado", en: "Cancelled" } 
      },
    };

    const config = statusConfig[status] || { 
      variant: "secondary", 
      label: { es: status, en: status } 
    };

    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label[language]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-state">
        <div className="text-muted-foreground">
          {language === "es" ? "Cargando..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Mis Ingresos" : "My Income"}
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          {language === "es"
            ? "Consulta tus ingresos por referidos y comisiones"
            : "View your income from referrals and commissions"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-stat-total">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Ingresos Totales" : "Total Earnings"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-earnings">
              ${summary?.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-paid">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pagado" : "Paid"}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-paid-amount">
              ${summary?.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pendiente" : "Pending"}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-amount">
              ${summary?.pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-transactions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Transacciones" : "Transactions"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-transaction-count">
              {summary?.transactionCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
        <Card data-testid="card-by-category">
          <CardHeader>
            <CardTitle>
              {language === "es" ? "Ingresos por Categoría" : "Income by Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.byCategory).map(([category, data]) => (
                <div 
                  key={category} 
                  className="flex items-center justify-between p-3 rounded-md hover-elevate"
                  data-testid={`category-item-${category}`}
                >
                  <div>
                    <div className="font-medium">{getCategoryLabel(category)}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} {language === "es" ? "transacciones" : "transactions"}
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    ${data.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-transactions">
        <CardHeader>
          <CardTitle>
            {language === "es" ? "Historial de Transacciones" : "Transaction History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-transactions">
              {language === "es"
                ? "No tienes transacciones de ingresos aún"
                : "You don't have any income transactions yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
                  <TableHead>{language === "es" ? "Categoría" : "Category"}</TableHead>
                  <TableHead>{language === "es" ? "Descripción" : "Description"}</TableHead>
                  <TableHead>{language === "es" ? "Monto" : "Amount"}</TableHead>
                  <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                  <TableHead>{language === "es" ? "Fecha de Pago" : "Payment Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                    <TableCell>
                      {format(new Date(transaction.createdAt), "PP", {
                        locale: language === "es" ? es : undefined,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-category-${transaction.id}`}>
                        {getCategoryLabel(transaction.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="font-semibold">
                      ${transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      {transaction.paidAt
                        ? format(new Date(transaction.paidAt), "PP", {
                            locale: language === "es" ? es : undefined,
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
