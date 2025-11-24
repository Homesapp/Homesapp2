import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Filter,
  Search,
  X,
  LayoutGrid,
  Table as TableIcon,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Send,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalPayment } from "@shared/schema";
import { markPaymentAsPaidSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";

type MarkAsPaidFormData = z.infer<typeof markPaymentAsPaidSchema>;

type SortField = "dueDate" | "amount" | "status" | "serviceType";
type SortOrder = "asc" | "desc";

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", icon: Clock },
  overdue: { label: "Vencido", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: AlertCircle },
  paid: { label: "Pagado", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: CheckCircle2 },
};

const serviceTypeLabels: Record<string, string> = {
  rent: "Renta",
  electricity: "Electricidad",
  water: "Agua",
  gas: "Gas",
  internet: "Internet",
  cable_tv: "Cable TV",
  security: "Seguridad",
  parking: "Estacionamiento",
  maintenance: "Mantenimiento",
  cleaning: "Limpieza",
  other: "Otro",
};

interface ExternalPaymentsProps {
  showHeader?: boolean;
}

export default function ExternalPayments({ showHeader = true }: ExternalPaymentsProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();

  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [isMarkAsPaidDialogOpen, setIsMarkAsPaidDialogOpen] = useState(false);
  const [isSendReminderDialogOpen, setIsSendReminderDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ExternalPayment | null>(null);

  useLayoutEffect(() => {
    setViewMode(isMobile ? "cards" : "table");
  }, [isMobile]);

  const { data: payments = [], isLoading } = useQuery<ExternalPayment[]>({
    queryKey: ["/api/external-payments"],
  });

  const filteredAndSortedPayments = payments
    .filter((payment) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        payment.notes?.toLowerCase().includes(searchLower) ||
        payment.paymentReference?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      const matchesServiceType = serviceTypeFilter === "all" || payment.serviceType === serviceTypeFilter;
      
      return matchesSearch && matchesStatus && matchesServiceType;
    })
    .sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case "dueDate":
          compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "amount":
          compareValue = parseFloat(a.amount) - parseFloat(b.amount);
          break;
        case "status":
          compareValue = a.status.localeCompare(b.status);
          break;
        case "serviceType":
          compareValue = a.serviceType.localeCompare(b.serviceType);
          break;
      }
      
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPayments.length / itemsPerPage));

  useEffect(() => {
    const clampedPage = Math.min(currentPage, totalPages);
    if (clampedPage !== currentPage) {
      setCurrentPage(clampedPage);
    }
  }, [totalPages, currentPage]);

  const paginatedPayments = filteredAndSortedPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const markAsPaidForm = useForm<MarkAsPaidFormData>({
    resolver: zodResolver(markPaymentAsPaidSchema),
    defaultValues: {
      paidDate: new Date(),
      paymentMethod: "",
      paymentReference: "",
      paymentProofUrl: "",
      notes: "",
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (data: MarkAsPaidFormData) => {
      if (!selectedPayment) throw new Error("No payment selected");
      return await apiRequest("PATCH", `/api/external-payments/${selectedPayment.id}/mark-paid`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-payments"] });
      setIsMarkAsPaidDialogOpen(false);
      setSelectedPayment(null);
      markAsPaidForm.reset();
      toast({
        title: "Pago registrado",
        description: "El pago ha sido marcado como pagado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo registrar el pago",
      });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await apiRequest("POST", `/api/external-payments/${paymentId}/send-reminder`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-payments"] });
      setIsSendReminderDialogOpen(false);
      setSelectedPayment(null);
      toast({
        title: "Recordatorio enviado",
        description: "El recordatorio de pago ha sido enviado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el recordatorio",
      });
    },
  });

  const handleMarkAsPaid = (payment: ExternalPayment) => {
    setSelectedPayment(payment);
    markAsPaidForm.reset({
      paidDate: new Date(),
      paymentMethod: "",
      paymentReference: "",
      paymentProofUrl: "",
      notes: "",
    });
    setIsMarkAsPaidDialogOpen(true);
  };

  const handleSendReminder = (payment: ExternalPayment) => {
    setSelectedPayment(payment);
    setIsSendReminderDialogOpen(true);
  };

  const onMarkAsPaidSubmit = (data: MarkAsPaidFormData) => {
    markAsPaidMutation.mutate(data);
  };

  const onSendReminderConfirm = () => {
    if (selectedPayment) {
      sendReminderMutation.mutate(selectedPayment.id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    serviceTypeFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setServiceTypeFilter("all");
  };

  const getPaymentStatus = (payment: ExternalPayment): "pending" | "overdue" | "paid" | "confirmed" => {
    if (payment.status === "paid" || payment.status === "confirmed") {
      return payment.status;
    }
    
    const today = new Date();
    const dueDate = parseISO(payment.dueDate.toString());
    
    if (isPast(dueDate) && dueDate < today) {
      return "overdue";
    }
    
    return "pending";
  };

  const getDaysUntilDue = (dueDate: Date | string): number => {
    const today = new Date();
    const due = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
    return differenceInDays(due, today);
  };

  const metrics = {
    total: payments.length,
    pending: payments.filter(p => p.status === "pending").length,
    overdue: payments.filter(p => {
      if (p.status === "paid" || p.status === "confirmed") return false;
      const dueDate = parseISO(p.dueDate.toString());
      return isPast(dueDate);
    }).length,
    paid: payments.filter(p => p.status === "paid" || p.status === "confirmed").length,
    totalAmount: payments
      .filter(p => p.status === "pending" || getPaymentStatus(p) === "overdue")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {showHeader && (
        <div>
          <h1 className="text-3xl font-bold">Cobros y Pagos</h1>
          <p className="text-muted-foreground">
            Gestión de cobros automatizados y recordatorios
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalAmount.toFixed(2)} MXN
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pending + metrics.overdue} pagos por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pending}</div>
            <p className="text-xs text-muted-foreground">
              Por vencer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paid}</div>
            <p className="text-xs text-muted-foreground">
              Completados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                placeholder="Buscar por referencia o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2"
                  data-testid="button-filter"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1 min-w-5 justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Estado</h4>
                    <div className="flex flex-wrap gap-2">
                      {["all", "pending", "overdue", "paid", "confirmed"].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                          data-testid={`filter-status-${status}`}
                        >
                          {status === "all" ? "Todos" : statusConfig[status as keyof typeof statusConfig]?.label || status}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Tipo de Servicio</h4>
                    <div className="flex flex-wrap gap-2">
                      {["all", "rent", "electricity", "water", "internet", "other"].map((type) => (
                        <Button
                          key={type}
                          variant={serviceTypeFilter === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setServiceTypeFilter(type)}
                          data-testid={`filter-service-${type}`}
                        >
                          {type === "all" ? "Todos" : serviceTypeLabels[type] || type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full"
                      data-testid="button-clear-filters"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("cards")}
                data-testid="button-view-cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : paginatedPayments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchTerm || activeFiltersCount > 0
                  ? "No se encontraron pagos con los filtros seleccionados"
                  : "No hay pagos registrados"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("dueDate")}
                      className="hover-elevate gap-1 -ml-3"
                      data-testid="sort-dueDate"
                    >
                      Vencimiento
                      <SortIcon field="dueDate" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("serviceType")}
                      className="hover-elevate gap-1 -ml-3"
                      data-testid="sort-serviceType"
                    >
                      Servicio
                      <SortIcon field="serviceType" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("amount")}
                      className="hover-elevate gap-1 -ml-3"
                      data-testid="sort-amount"
                    >
                      Monto
                      <SortIcon field="amount" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("status")}
                      className="hover-elevate gap-1 -ml-3"
                      data-testid="sort-status"
                    >
                      Estado
                      <SortIcon field="status" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.map((payment) => {
                  const status = getPaymentStatus(payment);
                  const statusInfo = statusConfig[status];
                  const StatusIcon = statusInfo.icon;
                  const daysUntilDue = getDaysUntilDue(payment.dueDate);

                  return (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(payment.dueDate.toString()), "dd MMM yyyy", { locale: es })}
                        </div>
                        {status === "pending" && daysUntilDue <= 3 && daysUntilDue >= 0 && (
                          <div className="text-xs text-amber-600 dark:text-amber-400">
                            Vence en {daysUntilDue} {daysUntilDue === 1 ? "día" : "días"}
                          </div>
                        )}
                        {status === "overdue" && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            Vencido hace {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? "día" : "días"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {serviceTypeLabels[payment.serviceType] || payment.serviceType}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        ${parseFloat(payment.amount).toFixed(2)} {payment.currency}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", statusInfo.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {(status === "pending" || status === "overdue") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(payment)}
                                data-testid={`button-mark-paid-${payment.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Marcar Pagado
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendReminder(payment)}
                                data-testid={`button-send-reminder-${payment.id}`}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Recordatorio
                              </Button>
                            </>
                          )}
                          {payment.paymentProofUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(payment.paymentProofUrl!, "_blank")}
                              data-testid={`button-view-proof-${payment.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Comprobante
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paginatedPayments.map((payment) => {
            const status = getPaymentStatus(payment);
            const statusInfo = statusConfig[status];
            const StatusIcon = statusInfo.icon;
            const daysUntilDue = getDaysUntilDue(payment.dueDate);

            return (
              <Card key={payment.id} data-testid={`card-payment-${payment.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {serviceTypeLabels[payment.serviceType] || payment.serviceType}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(payment.dueDate.toString()), "dd MMM yyyy", { locale: es })}
                      </div>
                    </div>
                    <Badge className={cn("gap-1", statusInfo.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold">
                    ${parseFloat(payment.amount).toFixed(2)} {payment.currency}
                  </div>

                  {status === "pending" && daysUntilDue <= 3 && daysUntilDue >= 0 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Vence en {daysUntilDue} {daysUntilDue === 1 ? "día" : "días"}
                    </div>
                  )}

                  {status === "overdue" && (
                    <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Vencido hace {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? "día" : "días"}
                    </div>
                  )}

                  {payment.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {payment.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {(status === "pending" || status === "overdue") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(payment)}
                          data-testid={`button-mark-paid-${payment.id}`}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Marcar Pagado
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReminder(payment)}
                          data-testid={`button-send-reminder-${payment.id}`}
                          className="flex-1"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Recordatorio
                        </Button>
                      </>
                    )}
                    {payment.paymentProofUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(payment.paymentProofUrl!, "_blank")}
                        data-testid={`button-view-proof-${payment.id}`}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Comprobante
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <ExternalPaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredAndSortedPayments.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
        />
      )}

      <Dialog open={isMarkAsPaidDialogOpen} onOpenChange={setIsMarkAsPaidDialogOpen}>
        <DialogContent data-testid="dialog-mark-paid">
          <DialogHeader>
            <DialogTitle>Marcar Pago como Pagado</DialogTitle>
            <DialogDescription>
              Registra el pago recibido y proporciona los detalles de la transacción
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-2 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicio:</span>
                <span className="font-medium">
                  {serviceTypeLabels[selectedPayment.serviceType] || selectedPayment.serviceType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-medium">
                  ${parseFloat(selectedPayment.amount).toFixed(2)} {selectedPayment.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimiento:</span>
                <span className="font-medium">
                  {format(parseISO(selectedPayment.dueDate.toString()), "dd MMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
          )}

          <Form {...markAsPaidForm}>
            <form onSubmit={markAsPaidForm.handleSubmit(onMarkAsPaidSubmit)} className="space-y-4">
              <FormField
                control={markAsPaidForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Transferencia, efectivo, cheque..."
                        data-testid="input-payment-method"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={markAsPaidForm.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia / Folio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Número de referencia"
                        data-testid="input-payment-reference"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={markAsPaidForm.control}
                name="paymentProofUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Comprobante</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://..."
                        data-testid="input-payment-proof-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={markAsPaidForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Notas adicionales..."
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMarkAsPaidDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={markAsPaidMutation.isPending}
                  data-testid="button-submit"
                >
                  {markAsPaidMutation.isPending ? "Guardando..." : "Guardar Pago"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendReminderDialogOpen} onOpenChange={setIsSendReminderDialogOpen}>
        <DialogContent data-testid="dialog-send-reminder">
          <DialogHeader>
            <DialogTitle>Enviar Recordatorio</DialogTitle>
            <DialogDescription>
              Se enviará un recordatorio de pago al inquilino
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-2 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicio:</span>
                <span className="font-medium">
                  {serviceTypeLabels[selectedPayment.serviceType] || selectedPayment.serviceType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-medium">
                  ${parseFloat(selectedPayment.amount).toFixed(2)} {selectedPayment.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimiento:</span>
                <span className="font-medium">
                  {format(parseISO(selectedPayment.dueDate.toString()), "dd MMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendReminderDialogOpen(false)}
              data-testid="button-cancel-reminder"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSendReminderConfirm}
              disabled={sendReminderMutation.isPending}
              data-testid="button-confirm-reminder"
            >
              {sendReminderMutation.isPending ? "Enviando..." : "Enviar Recordatorio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
