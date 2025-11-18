import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DollarSign, Plus, Calendar, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExternalPaymentSchema } from "@shared/schema";
import type { ExternalPayment, ExternalProperty } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = insertExternalPaymentSchema.omit({ propertyId: true, scheduleId: true }).extend({
  propertyId: z.string(),
});

export default function ExternalPayments() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: properties } = useQuery<ExternalProperty[]>({
    queryKey: ['/api/external-properties'],
  });

  const { data: payments, isLoading } = useQuery<ExternalPayment[]>({
    queryKey: ['/api/external-payments'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      type: "rent",
      amount: 0,
      currency: "MXN",
      dueDate: new Date().toISOString().split('T')[0],
      status: "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/external-payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-payments'] });
      toast({
        title: language === "es" ? "Pago creado" : "Payment created",
        description: language === "es" 
          ? "El pago ha sido creado exitosamente"
          : "Payment has been created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo crear el pago"
          : "Could not create payment",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/external-payments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-payments'] });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
        description: language === "es" 
          ? "El estado del pago ha sido actualizado"
          : "Payment status has been updated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar el estado del pago"
          : "Could not update payment status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const handleMarkPaid = (id: string) => {
    updateStatusMutation.mutate({ id, status: "paid" });
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'rent': return language === "es" ? "Renta" : "Rent";
      case 'water': return language === "es" ? "Agua" : "Water";
      case 'electricity': return language === "es" ? "Electricidad" : "Electricity";
      case 'internet': return language === "es" ? "Internet" : "Internet";
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return language === "es" ? "Pagado" : "Paid";
      case 'overdue': return language === "es" ? "Vencido" : "Overdue";
      case 'pending': return language === "es" ? "Pendiente" : "Pending";
      default: return status;
    }
  };

  const filteredPayments = payments?.filter((payment) => {
    if (filterStatus !== "all" && payment.status !== filterStatus) return false;
    if (filterType !== "all" && payment.type !== filterType) return false;
    return true;
  });

  const getPropertyAddress = (propertyId: string) => {
    const property = properties?.find(p => p.id === propertyId);
    return property?.address || (language === "es" ? "Propiedad desconocida" : "Unknown property");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "es" ? "Calendario de Pagos" : "Payment Calendar"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Gestiona los pagos de tus propiedades externas"
              : "Manage payments for your external properties"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-payment">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Agregar Pago" : "Add Payment"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Nuevo Pago" : "New Payment"}
              </DialogTitle>
              <DialogDescription>
                {language === "es" 
                  ? "Registra un nuevo pago pendiente"
                  : "Register a new pending payment"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Propiedad" : "Property"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property">
                            <SelectValue placeholder={language === "es" ? "Selecciona una propiedad" : "Select a property"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties?.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.address} - {property.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tipo de Pago" : "Payment Type"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rent">{language === "es" ? "Renta" : "Rent"}</SelectItem>
                          <SelectItem value="water">{language === "es" ? "Agua" : "Water"}</SelectItem>
                          <SelectItem value="electricity">{language === "es" ? "Electricidad" : "Electricity"}</SelectItem>
                          <SelectItem value="internet">{language === "es" ? "Internet" : "Internet"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Monto" : "Amount"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            step="0.01"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Moneda" : "Currency"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MXN">MXN</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{language === "es" ? "Fecha de Vencimiento" : "Due Date"}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-select-date"
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: language === "es" ? es : undefined })
                              ) : (
                                <span>{language === "es" ? "Selecciona una fecha" : "Pick a date"}</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-payment">
                    {createMutation.isPending 
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Guardar" : "Save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "es" ? "Todos los estados" : "All statuses"}</SelectItem>
            <SelectItem value="pending">{language === "es" ? "Pendiente" : "Pending"}</SelectItem>
            <SelectItem value="paid">{language === "es" ? "Pagado" : "Paid"}</SelectItem>
            <SelectItem value="overdue">{language === "es" ? "Vencido" : "Overdue"}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "es" ? "Todos los tipos" : "All types"}</SelectItem>
            <SelectItem value="rent">{language === "es" ? "Renta" : "Rent"}</SelectItem>
            <SelectItem value="water">{language === "es" ? "Agua" : "Water"}</SelectItem>
            <SelectItem value="electricity">{language === "es" ? "Electricidad" : "Electricity"}</SelectItem>
            <SelectItem value="internet">{language === "es" ? "Internet" : "Internet"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "es" ? "Lista de Pagos" : "Payments List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover-elevate" data-testid={`payment-card-${payment.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold">{getPaymentTypeLabel(payment.type)}</h3>
                          <Badge className={getStatusColor(payment.status)}>
                            {getStatusLabel(payment.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {getPropertyAddress(payment.propertyId)}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-bold text-primary">
                            ${payment.amount.toLocaleString()} {payment.currency}
                          </span>
                          <span className="text-muted-foreground">
                            {language === "es" ? "Vence:" : "Due:"} {format(new Date(payment.dueDate), "PPP", { locale: language === "es" ? es : undefined })}
                          </span>
                          {payment.paidDate && (
                            <span className="text-green-600">
                              {language === "es" ? "Pagado:" : "Paid:"} {format(new Date(payment.paidDate), "PPP", { locale: language === "es" ? es : undefined })}
                            </span>
                          )}
                        </div>
                      </div>
                      {payment.status !== 'paid' && (
                        <Button 
                          size="sm"
                          onClick={() => handleMarkPaid(payment.id)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-mark-paid-${payment.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {language === "es" ? "Marcar como Pagado" : "Mark as Paid"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === "es" ? "No hay pagos registrados" : "No payments registered"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
