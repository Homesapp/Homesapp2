import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, DollarSign, Wrench, Calendar as CalIcon, User, Clock, AlertCircle, FileText, Filter, Eye, EyeOff } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, isSameDay, isWithinInterval, addDays, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalPayment, ExternalMaintenanceTicket, SelectUser, ExternalRentalContract } from "@shared/schema";

type SelectedEvent = {
  type: 'payment' | 'ticket' | 'contract';
  data: ExternalPayment | ExternalMaintenanceTicket | ExternalRentalContract;
};

export default function ExternalCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [selectedCondominium, setSelectedCondominium] = useState<string>("all");
  const [showPayments, setShowPayments] = useState(true);
  const [showTickets, setShowTickets] = useState(true);
  const [showContracts, setShowContracts] = useState(true);
  const { language } = useLanguage();

  // Fetch payments
  const { data: payments = [] } = useQuery<ExternalPayment[]>({
    queryKey: ["/api/external-payments"],
  });

  // Fetch maintenance tickets
  const { data: tickets = [] } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ["/api/external-tickets"],
  });

  // Fetch units for ticket details
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["/api/external-units"],
  });

  // Fetch condominiums for filtering
  const { data: condominiums = [] } = useQuery<any[]>({
    queryKey: ["/api/external-condominiums"],
  });

  // Fetch owners for payment details
  const { data: owners = [] } = useQuery<any[]>({
    queryKey: ["/api/external-owners"],
  });

  // Fetch rental contracts for tenant info
  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ["/api/external-rental-contracts"],
  });

  // Fetch users for assignment details
  const { data: users = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/external-agency-users"],
  });

  // Filter payments and tickets by condominium
  const filteredPayments = useMemo(() => {
    if (selectedCondominium === "all") return payments;
    return payments.filter((p) => {
      const unit = units.find(u => u.id === p.unitId);
      return unit?.condominiumId === selectedCondominium;
    });
  }, [payments, units, selectedCondominium]);

  const filteredTickets = useMemo(() => {
    if (selectedCondominium === "all") return tickets;
    return tickets.filter((t) => {
      const unit = units.find(u => u.id === t.unitId);
      return unit?.condominiumId === selectedCondominium;
    });
  }, [tickets, units, selectedCondominium]);

  // Filter contracts by condominium
  const filteredContracts = useMemo(() => {
    if (selectedCondominium === "all") return contracts;
    return contracts.filter((c: any) => {
      const unit = units.find(u => u.id === c.unitId);
      return unit?.condominiumId === selectedCondominium;
    });
  }, [contracts, units, selectedCondominium]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const next30Days = addDays(now, 30);

    const pendingPayments = filteredPayments.filter(
      (p) => p.status === "pending" && 
      new Date(p.dueDate) >= startOfDay(now) &&
      new Date(p.dueDate) <= next30Days
    ).length;

    const scheduledTickets = filteredTickets.filter(
      (t) => t.scheduledDate && 
      (t.status === "open" || t.status === "in_progress") &&
      new Date(t.scheduledDate) >= startOfDay(now)
    ).length;

    const thisMonthEvents = [
      ...(showPayments ? filteredPayments : []),
      ...(showTickets ? filteredTickets : []),
      ...(showContracts ? filteredContracts : [])
    ].filter((item) => {
      const date = 'dueDate' in item ? new Date(item.dueDate) : 
                   'scheduledDate' in item && item.scheduledDate ? new Date(item.scheduledDate) :
                   'startDate' in item && item.startDate ? new Date(item.startDate) : null;
      if (!date) return false;
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }).length;

    return { pendingPayments, scheduledTickets, thisMonthEvents };
  }, [filteredPayments, filteredTickets, filteredContracts, showPayments, showTickets, showContracts]);

  // Get events for selected date
  const eventsForDate = useMemo(() => {
    if (!selectedDate) return [];

    const dayPayments = showPayments ? filteredPayments
      .filter((p) => isSameDay(new Date(p.dueDate), selectedDate))
      .map((p) => {
        const unit = units.find(u => u.id === p.unitId);
        const location = unit ? `${unit.condominium?.name || ''} - ${unit.unitNumber}` : '';
        return {
          type: 'payment' as const,
          title: language === "es" 
            ? `Pago: ${p.serviceType} - ${location}`
            : `Payment: ${p.serviceType} - ${location}`,
          time: format(new Date(p.dueDate), 'HH:mm'),
          status: p.status,
          data: p,
        };
      }) : [];

    const dayTickets = showTickets ? filteredTickets
      .filter((t) => t.scheduledDate && isSameDay(new Date(t.scheduledDate), selectedDate))
      .map((t) => {
        const unit = units.find(u => u.id === t.unitId);
        const location = unit ? `${unit.condominium?.name || ''} - ${unit.unitNumber}` : '';
        return {
          type: 'ticket' as const,
          title: `${t.title} - ${location}`,
          time: t.scheduledDate ? format(new Date(t.scheduledDate), 'HH:mm') : '--:--',
          status: t.status,
          priority: t.priority,
          data: t,
        };
      }) : [];

    // Add contract start dates as events
    const dayContracts = showContracts ? filteredContracts
      .filter((c: any) => c.startDate && isSameDay(new Date(c.startDate), selectedDate))
      .map((c: any) => {
        const unit = units.find(u => u.id === c.unitId);
        const location = unit ? `${unit.condominium?.name || ''} - ${unit.unitNumber}` : '';
        return {
          type: 'contract' as const,
          title: language === "es" 
            ? `Inicio de Renta: ${c.tenantName} - ${location}`
            : `Rental Start: ${c.tenantName} - ${location}`,
          time: '00:00',
          status: c.status,
          data: c,
        };
      }) : [];

    return [...dayPayments, ...dayTickets, ...dayContracts].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
  }, [selectedDate, filteredPayments, filteredTickets, filteredContracts, language, units, showPayments, showTickets, showContracts]);

  // Get event modifiers for calendar highlighting
  const datesWithPayments = useMemo(() => {
    if (!showPayments) return [];
    return filteredPayments.map((p) => new Date(p.dueDate));
  }, [filteredPayments, showPayments]);

  const datesWithTickets = useMemo(() => {
    if (!showTickets) return [];
    return filteredTickets
      .filter((t) => t.scheduledDate)
      .map((t) => new Date(t.scheduledDate!));
  }, [filteredTickets, showTickets]);

  const datesWithContracts = useMemo(() => {
    if (!showContracts) return [];
    return filteredContracts
      .filter((c: any) => c.startDate)
      .map((c: any) => new Date(c.startDate));
  }, [filteredContracts, showContracts]);

  // Get events by date for indicators
  const eventsByDate = useMemo(() => {
    const dateMap = new Map<string, { payments: number; tickets: number; contracts: number }>();
    
    if (showPayments) {
      filteredPayments.forEach((p) => {
        const dateKey = format(new Date(p.dueDate), 'yyyy-MM-dd');
        const current = dateMap.get(dateKey) || { payments: 0, tickets: 0, contracts: 0 };
        dateMap.set(dateKey, { ...current, payments: current.payments + 1 });
      });
    }
    
    if (showTickets) {
      filteredTickets.forEach((t) => {
        if (t.scheduledDate) {
          const dateKey = format(new Date(t.scheduledDate), 'yyyy-MM-dd');
          const current = dateMap.get(dateKey) || { payments: 0, tickets: 0, contracts: 0 };
          dateMap.set(dateKey, { ...current, tickets: current.tickets + 1 });
        }
      });
    }
    
    if (showContracts) {
      filteredContracts.forEach((c: any) => {
        if (c.startDate) {
          const dateKey = format(new Date(c.startDate), 'yyyy-MM-dd');
          const current = dateMap.get(dateKey) || { payments: 0, tickets: 0, contracts: 0 };
          dateMap.set(dateKey, { ...current, contracts: current.contracts + 1 });
        }
      });
    }
    
    return dateMap;
  }, [filteredPayments, filteredTickets, filteredContracts, showPayments, showTickets, showContracts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-calendar-title">
            <CalendarIcon className="h-8 w-8" />
            {language === "es" ? "Calendario" : "Calendar"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Visualiza pagos, mantenimientos y eventos importantes" 
              : "View payments, maintenance, and important events"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{language === "es" ? "Filtros" : "Filters"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Condominium filter */}
            <div className="flex-1 space-y-2">
              <Label>{language === "es" ? "Condominio" : "Condominium"}</Label>
              <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
                <SelectTrigger data-testid="select-condominium-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "es" ? "Todos los condominios" : "All condominiums"}
                  </SelectItem>
                  {condominiums.map((condo) => (
                    <SelectItem key={condo.id} value={condo.id}>
                      {condo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event type filters */}
            <div className="flex-1 space-y-3">
              <Label>{language === "es" ? "Tipos de Eventos" : "Event Types"}</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-payments"
                    checked={showPayments}
                    onCheckedChange={setShowPayments}
                    data-testid="checkbox-filter-payments"
                  />
                  <Label htmlFor="filter-payments" className="flex items-center gap-2 cursor-pointer">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    {language === "es" ? "Pagos" : "Payments"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-tickets"
                    checked={showTickets}
                    onCheckedChange={setShowTickets}
                    data-testid="checkbox-filter-tickets"
                  />
                  <Label htmlFor="filter-tickets" className="flex items-center gap-2 cursor-pointer">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    {language === "es" ? "Mantenimientos" : "Maintenance"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-contracts"
                    checked={showContracts}
                    onCheckedChange={setShowContracts}
                    data-testid="checkbox-filter-contracts"
                  />
                  <Label htmlFor="filter-contracts" className="flex items-center gap-2 cursor-pointer">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    {language === "es" ? "Contratos" : "Contracts"}
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pagos Pendientes" : "Pending Payments"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-payments">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Próximos 30 días" : "Next 30 days"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Mantenimientos" : "Maintenance"}
            </CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-scheduled-tickets">{stats.scheduledTickets}</div>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Programados" : "Scheduled"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Eventos" : "Events"}
            </CardTitle>
            <CalIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-month-events">{stats.thisMonthEvents}</div>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Este mes" : "This month"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{language === "es" ? "Calendario" : "Calendar"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={language === "es" ? es : enUS}
              className="rounded-md border [&_.rdp-day_button]:relative"
              data-testid="calendar-main"
              modifiers={{
                hasPayments: datesWithPayments,
                hasTickets: datesWithTickets,
                hasContracts: datesWithContracts,
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const events = eventsByDate.get(dateKey);
                  
                  return (
                    <>
                      {format(date, 'd')}
                      {events && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '2px',
                          pointerEvents: 'none'
                        }}>
                          {events.payments > 0 && (
                            <div 
                              style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: 'rgb(34, 197, 94)'
                              }}
                              data-testid="indicator-payment" 
                            />
                          )}
                          {events.tickets > 0 && (
                            <div 
                              style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: 'rgb(59, 130, 246)'
                              }}
                              data-testid="indicator-ticket" 
                            />
                          )}
                          {events.contracts > 0 && (
                            <div 
                              style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: 'rgb(168, 85, 247)'
                              }}
                              data-testid="indicator-contract" 
                            />
                          )}
                        </div>
                      )}
                    </>
                  );
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, language === "es" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { 
                    locale: language === "es" ? es : enUS 
                  })
                : language === "es" ? "Selecciona una fecha" : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsForDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "No hay eventos para esta fecha" 
                    : "No events for this date"}
                </p>
              ) : (
                <div className="space-y-2">
                  {eventsForDate.map((event, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-md hover-elevate cursor-pointer"
                      onClick={() => setSelectedEvent({ type: event.type, data: event.data })}
                      data-testid={`event-${event.type}-${idx}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {event.type === 'payment' ? (
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          ) : event.type === 'ticket' ? (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event detail dialog */}
      {selectedEvent && (
        <Card className="fixed inset-0 z-50 m-4 overflow-y-auto max-h-[calc(100vh-2rem)]" data-testid="card-event-detail">
          <CardHeader className="sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedEvent(null)}
                data-testid="button-close-detail"
              >
                ← {language === "es" ? "Volver" : "Back"}
              </Button>
              {selectedEvent.type === 'payment' ? (
                <DollarSign className="h-6 w-6 text-green-600" />
              ) : selectedEvent.type === 'contract' ? (
                <CalIcon className="h-6 w-6 text-purple-600" />
              ) : (
                <Wrench className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEvent.type === 'payment' && (() => {
              const payment = selectedEvent.data as ExternalPayment;
              const unit = units.find(u => u.id === payment.unitId);
              const parsedAmount = payment.amount ? parseFloat(payment.amount) : NaN;
              const hasValidAmount = Number.isFinite(parsedAmount);

              return (
                <>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {language === "es" ? "Pago" : "Payment"}: {payment.serviceType}
                    </h3>
                    {hasValidAmount && (
                      <p className="text-2xl font-bold mt-2 text-green-600">
                        ${parsedAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </div>
                    {unit && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{language === "es" ? "Unidad" : "Unit"}</p>
                          <p className="text-muted-foreground">
                            {unit.unitNumber} - {unit.condominium?.name || ""}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <CalIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{language === "es" ? "Fecha de Vencimiento" : "Due Date"}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(payment.dueDate), "PPP", { locale: language === "es" ? es : enUS })}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {selectedEvent.type === 'ticket' && (() => {
              const ticket = selectedEvent.data as ExternalMaintenanceTicket;
              const unit = units.find(u => u.id === ticket.unitId);
              const assignedUser = users.find(u => u.id === ticket.assignedTo);

              return (
                <>
                  <div>
                    <h3 className="font-semibold text-lg">{ticket.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                  </div>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline">{ticket.category}</Badge>
                      <Badge variant={ticket.status === 'in_progress' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </div>
                    {unit && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{language === "es" ? "Ubicación" : "Location"}</p>
                          <p className="text-muted-foreground">
                            {unit.unitNumber} - {unit.condominium?.name || ""}
                          </p>
                        </div>
                      </div>
                    )}
                    {ticket.scheduledDate && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{language === "es" ? "Programado" : "Scheduled"}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(ticket.scheduledDate), "PPP p", { locale: language === "es" ? es : enUS })}
                          </p>
                        </div>
                      </div>
                    )}
                    {assignedUser && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{language === "es" ? "Trabajador asignado" : "Assigned worker"}</p>
                          <p className="text-muted-foreground">
                            {assignedUser.name}{assignedUser.maintenanceSpecialty ? ` (${assignedUser.maintenanceSpecialty})` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {selectedEvent.type === 'contract' && (() => {
              const contract = selectedEvent.data as ExternalRentalContract;
              const unit = units.find(u => u.id === contract.unitId);
              const parsedRent = contract.monthlyRent ? parseFloat(contract.monthlyRent) : NaN;
              const hasValidRent = Number.isFinite(parsedRent);

              return (
                <>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {language === "es" ? "Inicio de Contrato" : "Contract Start"}
                    </h3>
                    <p className="text-xl font-bold mt-2 text-purple-600">
                      {contract.tenantName}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                        {contract.status}
                      </Badge>
                    </div>
                    {unit && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{language === "es" ? "Unidad" : "Unit"}</p>
                          <p className="text-muted-foreground">
                            {unit.unitNumber} - {unit.condominium?.name || ""}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{language === "es" ? "Renta Mensual" : "Monthly Rent"}</p>
                        <p className="text-muted-foreground">
                          {hasValidRent 
                            ? `${contract.currency || 'MXN'} $${parsedRent.toLocaleString()}`
                            : (language === "es" ? "Monto no especificado" : "Amount not specified")
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{language === "es" ? "Duración" : "Duration"}</p>
                        <p className="text-muted-foreground">
                          {contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}
                        </p>
                      </div>
                    </div>
                    {contract.startDate && (
                      <div className="flex items-start gap-2">
                        <CalIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{language === "es" ? "Fecha de Inicio" : "Start Date"}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(contract.startDate), "PPP", { locale: language === "es" ? es : enUS })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
