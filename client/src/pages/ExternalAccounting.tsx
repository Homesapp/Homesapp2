import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Pencil,
  Trash2,
  Filter,
  X
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalFinancialTransaction, ExternalCondominium, ExternalUnit } from "@shared/schema";
import { insertExternalFinancialTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type AccountingSummary = {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  pendingInflow: number;
  pendingOutflow: number;
  reconciledInflow: number;
  reconciledOutflow: number;
};

type TransactionFormData = z.infer<typeof insertExternalFinancialTransactionSchema>;

export default function ExternalAccounting() {
  const { language } = useLanguage();
  const { toast } = useToast();

  // Filters
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [condominiumFilter, setCondominiumFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ExternalFinancialTransaction | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery<AccountingSummary>({
    queryKey: ['/api/external/accounting/summary'],
  });

  const buildTransactionsQueryKey = () => {
    const params = new URLSearchParams();
    if (directionFilter !== "all") params.append("direction", directionFilter);
    if (categoryFilter !== "all") params.append("category", categoryFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (condominiumFilter !== "all") params.append("condominiumId", condominiumFilter);
    if (unitFilter !== "all") params.append("unitId", unitFilter);
    const queryString = params.toString();
    return queryString ? `/api/external/accounting/transactions?${queryString}` : '/api/external/accounting/transactions';
  };

  const { data: transactions, isLoading: transactionsLoading } = useQuery<ExternalFinancialTransaction[]>({
    queryKey: ['/api/external/accounting/transactions', directionFilter, categoryFilter, statusFilter, condominiumFilter, unitFilter],
    queryFn: async () => {
      const url = buildTransactionsQueryKey();
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const { data: condominiums } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  const createForm = useForm<TransactionFormData>({
    resolver: zodResolver(insertExternalFinancialTransactionSchema),
    defaultValues: {
      direction: "inflow",
      category: "rent_income",
      status: "pending",
      payerRole: "tenant",
      payeeRole: "agency",
      currency: "MXN",
      grossAmount: "0",
      fees: "0",
      netAmount: "0",
      description: "",
    },
  });

  const editForm = useForm<Partial<TransactionFormData>>({
    resolver: zodResolver(insertExternalFinancialTransactionSchema.partial()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return await apiRequest('/api/external/accounting/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/summary'] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({
        title: t.transactionCreated,
        description: t.transactionCreatedDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
      return await apiRequest(`/api/external/accounting/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/summary'] });
      setShowEditDialog(false);
      setSelectedTransaction(null);
      toast({
        title: t.transactionUpdated,
        description: t.transactionUpdatedDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/external/accounting/transactions/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/summary'] });
      setShowDeleteDialog(false);
      setSelectedTransaction(null);
      toast({
        title: t.transactionDeleted,
        description: t.transactionDeletedDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(numAmount)) return 'N/A';
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined });
  };

  const t = language === 'es' ? {
    title: 'Contabilidad Financiera',
    subtitle: 'Resumen financiero de operaciones',
    summaryTab: 'Resumen',
    transactionsTab: 'Transacciones',
    netBalance: 'Balance Neto',
    totalIncome: 'Ingresos Totales',
    totalExpenses: 'Egresos Totales',
    pendingIncome: 'Ingresos Pendientes',
    pendingExpenses: 'Egresos Pendientes',
    reconciledIncome: 'Ingresos Conciliados',
    reconciledExpenses: 'Egresos Conciliados',
    noData: 'Sin datos disponibles',
    income: 'Ingresos',
    expenses: 'Egresos',
    pending: 'Pendiente',
    reconciled: 'Conciliado',
    posted: 'Contabilizado',
    cancelled: 'Cancelado',
    filters: 'Filtros',
    direction: 'Dirección',
    category: 'Categoría',
    status: 'Estado',
    condominium: 'Condominio',
    unit: 'Unidad',
    all: 'Todos',
    inflow: 'Ingresos',
    outflow: 'Egresos',
    clearFilters: 'Limpiar Filtros',
    createTransaction: 'Nueva Transacción',
    editTransaction: 'Editar Transacción',
    deleteTransaction: 'Eliminar Transacción',
    actions: 'Acciones',
    description: 'Descripción',
    amount: 'Monto',
    dueDate: 'Fecha de Vencimiento',
    performedDate: 'Fecha Realizada',
    grossAmount: 'Monto Bruto',
    fees: 'Comisiones',
    netAmount: 'Monto Neto',
    payerRole: 'Pagador',
    payeeRole: 'Beneficiario',
    notes: 'Notas',
    paymentMethod: 'Método de Pago',
    paymentReference: 'Referencia de Pago',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirmDelete: '¿Estás seguro de que deseas eliminar esta transacción?',
    confirmDeleteDesc: 'Esta acción no se puede deshacer.',
    transactionCreated: 'Transacción creada',
    transactionCreatedDesc: 'La transacción se creó exitosamente',
    transactionUpdated: 'Transacción actualizada',
    transactionUpdatedDesc: 'La transacción se actualizó exitosamente',
    transactionDeleted: 'Transacción eliminada',
    transactionDeletedDesc: 'La transacción se eliminó exitosamente',
    error: 'Error',
    tenant: 'Inquilino',
    owner: 'Propietario',
    agency: 'Agencia',
    rent_income: 'Ingreso por Renta',
    rent_payout: 'Pago de Renta',
    hoa_fee: 'Cuota HOA',
    maintenance_charge: 'Cargo por Mantenimiento',
    service_electricity: 'Electricidad',
    service_water: 'Agua',
    service_internet: 'Internet',
    service_gas: 'Gas',
    service_other: 'Otro Servicio',
    adjustment: 'Ajuste',
    tenantName: 'Nombre del Inquilino',
  } : {
    title: 'Financial Accounting',
    subtitle: 'Financial summary of operations',
    summaryTab: 'Summary',
    transactionsTab: 'Transactions',
    netBalance: 'Net Balance',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    pendingIncome: 'Pending Income',
    pendingExpenses: 'Pending Expenses',
    reconciledIncome: 'Reconciled Income',
    reconciledExpenses: 'Reconciled Expenses',
    noData: 'No data available',
    income: 'Income',
    expenses: 'Expenses',
    pending: 'Pending',
    reconciled: 'Reconciled',
    posted: 'Posted',
    cancelled: 'Cancelled',
    filters: 'Filters',
    direction: 'Direction',
    category: 'Category',
    status: 'Status',
    condominium: 'Condominium',
    unit: 'Unit',
    all: 'All',
    inflow: 'Income',
    outflow: 'Expenses',
    clearFilters: 'Clear Filters',
    createTransaction: 'New Transaction',
    editTransaction: 'Edit Transaction',
    deleteTransaction: 'Delete Transaction',
    actions: 'Actions',
    description: 'Description',
    amount: 'Amount',
    dueDate: 'Due Date',
    performedDate: 'Performed Date',
    grossAmount: 'Gross Amount',
    fees: 'Fees',
    netAmount: 'Net Amount',
    payerRole: 'Payer',
    payeeRole: 'Payee',
    notes: 'Notes',
    paymentMethod: 'Payment Method',
    paymentReference: 'Payment Reference',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this transaction?',
    confirmDeleteDesc: 'This action cannot be undone.',
    transactionCreated: 'Transaction created',
    transactionCreatedDesc: 'The transaction was created successfully',
    transactionUpdated: 'Transaction updated',
    transactionUpdatedDesc: 'The transaction was updated successfully',
    transactionDeleted: 'Transaction deleted',
    transactionDeletedDesc: 'The transaction was deleted successfully',
    error: 'Error',
    tenant: 'Tenant',
    owner: 'Owner',
    agency: 'Agency',
    rent_income: 'Rent Income',
    rent_payout: 'Rent Payout',
    hoa_fee: 'HOA Fee',
    maintenance_charge: 'Maintenance Charge',
    service_electricity: 'Electricity',
    service_water: 'Water',
    service_internet: 'Internet',
    service_gas: 'Gas',
    service_other: 'Other Service',
    adjustment: 'Adjustment',
    tenantName: 'Tenant Name',
  };

  const getCategoryLabel = (category: string) => {
    return t[category as keyof typeof t] || category;
  };

  const getRoleLabel = (role: string) => {
    return t[role as keyof typeof t] || role;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      posted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      reconciled: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || ""}>
        {t[status as keyof typeof t] || status}
      </Badge>
    );
  };

  const getDirectionBadge = (direction: string) => {
    if (direction === "inflow") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {t.inflow}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
        <ArrowDownRight className="h-3 w-3 mr-1" />
        {t.outflow}
      </Badge>
    );
  };

  const handleEdit = (transaction: ExternalFinancialTransaction) => {
    setSelectedTransaction(transaction);
    editForm.reset({
      direction: transaction.direction,
      category: transaction.category,
      status: transaction.status,
      grossAmount: transaction.grossAmount,
      fees: transaction.fees || "0",
      netAmount: transaction.netAmount,
      description: transaction.description,
      notes: transaction.notes || "",
      payerRole: transaction.payerRole,
      payeeRole: transaction.payeeRole,
      tenantName: transaction.tenantName || "",
      unitId: transaction.unitId || undefined,
      ownerId: transaction.ownerId || undefined,
      paymentMethod: transaction.paymentMethod || "",
      paymentReference: transaction.paymentReference || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (transaction: ExternalFinancialTransaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteDialog(true);
  };

  const handleClearFilters = () => {
    setDirectionFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCondominiumFilter("all");
    setUnitFilter("all");
  };

  const isPositiveBalance = summary ? summary.netBalance >= 0 : true;

  const activeFilters = [directionFilter, categoryFilter, statusFilter, condominiumFilter, unitFilter].filter(f => f !== "all").length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-financial-title">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary" data-testid="tab-summary">{t.summaryTab}</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">{t.transactionsTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {summaryLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !summary ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t.noData}</p>
            </div>
          ) : (
            <>
              <Card className="hover-elevate border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    {t.netBalance}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-5xl font-bold ${isPositiveBalance ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} data-testid="text-net-balance">
                      {formatCurrency(summary.netBalance)}
                    </p>
                    {isPositiveBalance ? (
                      <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatCurrency(summary.totalInflow)} {t.income} - {formatCurrency(summary.totalOutflow)} {t.expenses}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.totalIncome}</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="text-total-income">
                      {formatCurrency(summary.totalInflow)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      {t.reconciled}: {formatCurrency(summary.reconciledInflow)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.totalExpenses}</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid="text-total-expenses">
                      {formatCurrency(summary.totalOutflow)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      {t.reconciled}: {formatCurrency(summary.reconciledOutflow)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.pendingIncome}</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-pending-income">
                      {formatCurrency(summary.pendingInflow)}
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {t.pending}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.pendingExpenses}</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-pending-expenses">
                      {formatCurrency(summary.pendingOutflow)}
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {t.pending}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.reconciledIncome}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="text-reconciled-income">
                      {formatCurrency(summary.reconciledInflow)}
                    </div>
                    <Badge variant="default" className="mt-2">
                      {t.reconciled}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.reconciledExpenses}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-reconciled-expenses">
                      {formatCurrency(summary.reconciledOutflow)}
                    </div>
                    <Badge variant="default" className="mt-2">
                      {t.reconciled}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t.filters}
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-2">{activeFilters}</Badge>
                  )}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                {activeFilters > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t.clearFilters}
                  </Button>
                )}
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  data-testid="button-create-transaction"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.createTransaction}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger data-testid="select-direction-filter">
                    <SelectValue placeholder={t.direction} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="inflow">{t.inflow}</SelectItem>
                    <SelectItem value="outflow">{t.outflow}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder={t.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="rent_income">{t.rent_income}</SelectItem>
                    <SelectItem value="rent_payout">{t.rent_payout}</SelectItem>
                    <SelectItem value="hoa_fee">{t.hoa_fee}</SelectItem>
                    <SelectItem value="maintenance_charge">{t.maintenance_charge}</SelectItem>
                    <SelectItem value="service_electricity">{t.service_electricity}</SelectItem>
                    <SelectItem value="service_water">{t.service_water}</SelectItem>
                    <SelectItem value="service_internet">{t.service_internet}</SelectItem>
                    <SelectItem value="service_gas">{t.service_gas}</SelectItem>
                    <SelectItem value="service_other">{t.service_other}</SelectItem>
                    <SelectItem value="adjustment">{t.adjustment}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder={t.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="pending">{t.pending}</SelectItem>
                    <SelectItem value="posted">{t.posted}</SelectItem>
                    <SelectItem value="reconciled">{t.reconciled}</SelectItem>
                    <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={condominiumFilter} onValueChange={setCondominiumFilter}>
                  <SelectTrigger data-testid="select-condominium-filter">
                    <SelectValue placeholder={t.condominium} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {condominiums?.map(condo => (
                      <SelectItem key={condo.id} value={condo.id}>
                        {condo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger data-testid="select-unit-filter">
                    <SelectValue placeholder={t.unit} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {units?.filter(u => condominiumFilter === "all" || u.condominiumId === condominiumFilter).map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.transactionsTab}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t.noData}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.dueDate}</TableHead>
                        <TableHead>{t.direction}</TableHead>
                        <TableHead>{t.category}</TableHead>
                        <TableHead>{t.description}</TableHead>
                        <TableHead>{t.amount}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                          <TableCell>{formatDate(transaction.dueDate)}</TableCell>
                          <TableCell>{getDirectionBadge(transaction.direction)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getCategoryLabel(transaction.category)}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(transaction.netAmount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(transaction)}
                                data-testid={`button-edit-${transaction.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(transaction)}
                                data-testid={`button-delete-${transaction.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Transaction Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.createTransaction}</DialogTitle>
            <DialogDescription>
              {t.subtitle}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.direction}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-create-direction">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inflow">{t.inflow}</SelectItem>
                          <SelectItem value="outflow">{t.outflow}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.category}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-create-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rent_income">{t.rent_income}</SelectItem>
                          <SelectItem value="rent_payout">{t.rent_payout}</SelectItem>
                          <SelectItem value="hoa_fee">{t.hoa_fee}</SelectItem>
                          <SelectItem value="maintenance_charge">{t.maintenance_charge}</SelectItem>
                          <SelectItem value="service_electricity">{t.service_electricity}</SelectItem>
                          <SelectItem value="service_water">{t.service_water}</SelectItem>
                          <SelectItem value="service_internet">{t.service_internet}</SelectItem>
                          <SelectItem value="service_gas">{t.service_gas}</SelectItem>
                          <SelectItem value="service_other">{t.service_other}</SelectItem>
                          <SelectItem value="adjustment">{t.adjustment}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="payerRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.payerRole}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-create-payer">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tenant">{t.tenant}</SelectItem>
                          <SelectItem value="owner">{t.owner}</SelectItem>
                          <SelectItem value="agency">{t.agency}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="payeeRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.payeeRole}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-create-payee">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tenant">{t.tenant}</SelectItem>
                          <SelectItem value="owner">{t.owner}</SelectItem>
                          <SelectItem value="agency">{t.agency}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="grossAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.grossAmount}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-create-gross-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="fees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.fees}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-create-fees" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="netAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.netAmount}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-create-net-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.dueDate}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-create-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.unit}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="input-create-unit">
                          <SelectValue placeholder={t.unit} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units?.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.description}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-create-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.notes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-create-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-transaction">
                  {t.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.editTransaction}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: selectedTransaction!.id, data }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.status}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-edit-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">{t.pending}</SelectItem>
                          <SelectItem value="posted">{t.posted}</SelectItem>
                          <SelectItem value="reconciled">{t.reconciled}</SelectItem>
                          <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="netAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.netAmount}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-edit-net-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.description}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-edit-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.notes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-edit-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-transaction">
                  {t.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTransaction}</DialogTitle>
            <DialogDescription>{t.confirmDelete}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.confirmDeleteDesc}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(selectedTransaction!.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
