import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  FileText,
  Home,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface RentalContract {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  status: string;
  monthlyRent: number;
  leaseDurationMonths: number;
  depositAmount: number;
  administrativeFee: number;
  totalCommissionAmount: number | null;
  sellerCommissionAmount: number;
  homesappCommissionAmount: number;
  leaseStartDate: string;
  leaseEndDate: string | null;
  property?: {
    title: string;
    location: string;
  };
  tenant?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface IncomeSummary {
  totalEarnings: number;
  paidAmount: number;
  pendingAmount: number;
  transactionCount: number;
  byCategory: Record<string, { count: number; total: number }>;
}

export default function OwnerFinancialReport() {
  const { language, t } = useLanguage();
  const { data: contracts = [], isLoading: contractsLoading, error: contractsError } = useQuery<RentalContract[]>({
    queryKey: ["/api/rental-contracts"],
  });

  const { data: incomeSummary, isLoading: summaryLoading, error: summaryError } = useQuery<IncomeSummary>({
    queryKey: ["/api/income/my-summary"],
  });

  const isLoading = contractsLoading || summaryLoading;
  const hasError = contractsError || summaryError;

  const activeContracts = contracts.filter(c => 
    c.status === "active" || c.status === "signed"
  );

  const totalMonthlyIncome = activeContracts.reduce(
    (sum, c) => sum + Number(c.monthlyRent), 0
  );

  const totalAnnualIncome = activeContracts.reduce((sum, c) => {
    if (!c.leaseEndDate) {
      return sum;
    }
    const monthsRemaining = Math.max(0, 
      Math.ceil((new Date(c.leaseEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
    );
    return sum + (Number(c.monthlyRent) * Math.min(monthsRemaining, 12));
  }, 0);

  const totalCommissionsPaid = contracts.reduce(
    (sum, c) => sum + Number(c.totalCommissionAmount ?? 0), 0
  );

  const netIncome = (incomeSummary?.paidAmount || 0) - totalCommissionsPaid;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; labelKey: string }> = {
      draft: { variant: "secondary", labelKey: "financialReport.statusDraft" },
      signed: { variant: "default", labelKey: "financialReport.statusSigned" },
      active: { variant: "default", labelKey: "financialReport.statusActive" },
      completed: { variant: "outline", labelKey: "financialReport.statusCompleted" },
      cancelled: { variant: "destructive", labelKey: "financialReport.statusCancelled" },
    };

    const config = statusConfig[status] || { variant: "secondary", labelKey: status };
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {statusConfig[status] ? t(config.labelKey) : status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="loading-state">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert variant="destructive" data-testid="error-state">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('financialReport.errorLoading')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {t('financialReport.title')}
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          {t('financialReport.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-monthly-income">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financialReport.monthlyIncome')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-income">
              ${totalMonthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeContracts.length} {t('financialReport.activeContracts').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-annual-projected">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financialReport.annualProjection')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-annual-projected">
              ${totalAnnualIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('financialReport.next12Months')}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-commissions-paid">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financialReport.commissionsPaid')}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-commissions-paid">
              ${totalCommissionsPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('financialReport.totalHistorical')}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-net-income">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financialReport.netIncome')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-net-income">
              ${netIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('financialReport.receivedMinusCommissions')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList>
          <TabsTrigger value="contracts" data-testid="tab-contracts">
            {t('financialReport.rentalContracts')}
          </TabsTrigger>
          <TabsTrigger value="income" data-testid="tab-income">
            {t('financialReport.incomeReceived')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('financialReport.rentalContracts')}</CardTitle>
              <CardDescription>
                {contracts.length} {t('financialReport.totalContracts')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-contracts">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('financialReport.noContracts')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('financialReport.noContractsDesc')}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('financialReport.property')}</TableHead>
                      <TableHead>{t('financialReport.tenant')}</TableHead>
                      <TableHead>{t('financialReport.monthlyRent')}</TableHead>
                      <TableHead>{t('financialReport.duration')}</TableHead>
                      <TableHead>{t('financialReport.start')}</TableHead>
                      <TableHead>{t('financialReport.end')}</TableHead>
                      <TableHead>{t('financialReport.commission')}</TableHead>
                      <TableHead>{t('financialReport.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-contract-property-${contract.id}`}>
                              {contract.property?.title || t('financialReport.noTitle')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {contract.property?.location || t('financialReport.noLocation')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-contract-tenant-${contract.id}`}>
                              {contract.tenant?.firstName || ''} {contract.tenant?.lastName || ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {contract.tenant?.email || ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold" data-testid={`text-contract-rent-${contract.id}`}>
                          ${Number(contract.monthlyRent).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell data-testid={`text-contract-duration-${contract.id}`}>
                          {contract.leaseDurationMonths} {contract.leaseDurationMonths === 1 ? t('financialReport.month') : t('financialReport.months')}
                        </TableCell>
                        <TableCell data-testid={`text-contract-start-${contract.id}`}>
                          {format(new Date(contract.leaseStartDate), "PP", { locale: language === "es" ? es : undefined })}
                        </TableCell>
                        <TableCell data-testid={`text-contract-end-${contract.id}`}>
                          {contract.leaseEndDate ? format(new Date(contract.leaseEndDate), "PP", { locale: language === "es" ? es : undefined }) : '-'}
                        </TableCell>
                        <TableCell className="text-orange-600" data-testid={`text-contract-commission-${contract.id}`}>
                          ${Number(contract.totalCommissionAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('financialReport.incomeSummary')}</CardTitle>
              <CardDescription>
                {t('financialReport.incomeSummaryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="flex items-center gap-3 p-3 border rounded-md" data-testid="summary-total-received">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('financialReport.totalReceived')}
                    </p>
                    <p className="text-xl font-bold" data-testid="text-total-received">
                      ${(incomeSummary?.paidAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-md" data-testid="summary-pending">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('financialReport.pending')}
                    </p>
                    <p className="text-xl font-bold" data-testid="text-total-pending">
                      ${(incomeSummary?.pendingAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-md" data-testid="summary-net-balance">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Home className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('financialReport.net')}
                    </p>
                    <p className="text-xl font-bold text-green-600" data-testid="text-net-balance">
                      ${netIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {incomeSummary?.byCategory && Object.keys(incomeSummary.byCategory).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    {t('financialReport.breakdownByCategory')}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(incomeSummary.byCategory).map(([category, data]) => (
                      <div 
                        key={category} 
                        className="flex items-center justify-between p-3 rounded-md hover-elevate"
                        data-testid={`category-item-${category}`}
                      >
                        <div>
                          <div className="font-medium capitalize">{category.replace(/_/g, ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} {data.count === 1 ? t('financialReport.transaction') : t('financialReport.transactions')}
                          </div>
                        </div>
                        <div className="text-lg font-bold" data-testid={`category-total-${category}`}>
                          ${data.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
