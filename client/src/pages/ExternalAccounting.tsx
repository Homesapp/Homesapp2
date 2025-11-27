import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  Wrench,
  Sparkles,
  Percent,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Building2,
  User,
  Receipt,
  Home,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from 'xlsx';

interface PayrollItem {
  ticketId: string;
  ticketNumber: string;
  title: string;
  category: string;
  closedAt: string | null;
  unitNumber: string | null;
  condominiumName: string | null;
  workerName: string;
  workerEmail: string | null;
  netPayment: string;
  adminFee: string;
  totalCharged: string;
}

interface CommissionItem {
  type: 'service' | 'rental';
  id: string;
  reference: string;
  description: string;
  category: string;
  date: string | null;
  unitNumber: string | null;
  condominiumName: string | null;
  baseAmount: string;
  commissionAmount: string;
}

interface SellerPayoutItem {
  leadId: string;
  contractId: string;
  leadName: string;
  leadEmail: string | null;
  sellerName: string;
  sellerEmail: string | null;
  unitNumber: string | null;
  condominiumName: string | null;
  contractStartDate: string;
  monthlyRent: string;
  rentalCommission: string;
  sellerPayout: string;
}

interface PayrollResponse {
  period: { year: number; month: number; biweekly: number };
  startDate: string;
  endDate: string;
  items: PayrollItem[];
  totals: {
    count: number;
    netPayment: string;
    adminFees: string;
  };
}

interface CommissionsResponse {
  period: { year: number; month: number; biweekly: number };
  startDate: string;
  endDate: string;
  items: CommissionItem[];
  totals: {
    serviceCount: number;
    rentalCount: number;
    serviceCommissions: string;
    rentalCommissions: string;
    totalCommissions: string;
  };
}

interface SellerPayoutsResponse {
  period: { year: number; month: number; biweekly: number };
  startDate: string;
  endDate: string;
  items: SellerPayoutItem[];
  totals: {
    count: number;
    totalPayouts: string;
  };
}

const translations: Record<string, Record<string, string>> = {
  es: {
    pageTitle: "Contabilidad",
    pageDescription: "Gestión de nóminas, comisiones y pagos",
    maintenancePayroll: "Nómina Mantenimiento",
    cleaningPayroll: "Nómina Limpieza", 
    commissions: "Comisiones",
    sellerPayouts: "Pagos a Vendedores",
    period: "Período",
    year: "Año",
    month: "Mes",
    biweekly: "Quincena",
    first: "1ra (1-15)",
    second: "2da (16-fin)",
    noData: "No hay datos para este período",
    loading: "Cargando...",
    ticket: "Ticket",
    worker: "Trabajador",
    unit: "Unidad",
    condominium: "Condominio",
    netPayment: "Pago Neto",
    adminFee: "Cuota Admin",
    total: "Total",
    totalNetPayment: "Total Pago Neto",
    totalAdminFees: "Total Cuotas Admin",
    items: "elementos",
    exportExcel: "Exportar Excel",
    reference: "Referencia",
    description: "Descripción",
    category: "Categoría",
    date: "Fecha",
    baseAmount: "Monto Base",
    commission: "Comisión",
    serviceCommissions: "Comisiones Servicios",
    rentalCommissions: "Comisiones Rentas",
    totalCommissions: "Total Comisiones",
    lead: "Lead",
    seller: "Vendedor",
    monthlyRent: "Renta Mensual",
    rentalCommission: "Comisión Renta",
    sellerPayout: "Pago Vendedor",
    totalPayouts: "Total Pagos",
    service: "Servicio",
    rental: "Renta",
    maintenance: "Mantenimiento",
    cleaning: "Limpieza",
    january: "Enero",
    february: "Febrero",
    march: "Marzo",
    april: "Abril",
    may: "Mayo",
    june: "Junio",
    july: "Julio",
    august: "Agosto",
    september: "Septiembre",
    october: "Octubre",
    november: "Noviembre",
    december: "Diciembre",
  },
  en: {
    pageTitle: "Accounting",
    pageDescription: "Manage payroll, commissions and payments",
    maintenancePayroll: "Maintenance Payroll",
    cleaningPayroll: "Cleaning Payroll",
    commissions: "Commissions",
    sellerPayouts: "Seller Payouts",
    period: "Period",
    year: "Year",
    month: "Month",
    biweekly: "Biweekly",
    first: "1st (1-15)",
    second: "2nd (16-end)",
    noData: "No data for this period",
    loading: "Loading...",
    ticket: "Ticket",
    worker: "Worker",
    unit: "Unit",
    condominium: "Condominium",
    netPayment: "Net Payment",
    adminFee: "Admin Fee",
    total: "Total",
    totalNetPayment: "Total Net Payment",
    totalAdminFees: "Total Admin Fees",
    items: "items",
    exportExcel: "Export Excel",
    reference: "Reference",
    description: "Description",
    category: "Category",
    date: "Date",
    baseAmount: "Base Amount",
    commission: "Commission",
    serviceCommissions: "Service Commissions",
    rentalCommissions: "Rental Commissions",
    totalCommissions: "Total Commissions",
    lead: "Lead",
    seller: "Seller",
    monthlyRent: "Monthly Rent",
    rentalCommission: "Rental Commission",
    sellerPayout: "Seller Payout",
    totalPayouts: "Total Payouts",
    service: "Service",
    rental: "Rental",
    maintenance: "Maintenance",
    cleaning: "Cleaning",
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
  },
};

const monthNames = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

export default function ExternalAccounting() {
  const { language } = useLanguage();
  const t = translations[language] || translations.es;
  const isMobile = useMobile();
  
  const [activeTab, setActiveTab] = useState("maintenance");
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedBiweekly, setSelectedBiweekly] = useState(currentDate.getDate() <= 15 ? 1 : 2);

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery<PayrollResponse>({
    queryKey: ['/api/external/accounting/payroll/maintenance', selectedYear, selectedMonth, selectedBiweekly],
    queryFn: async () => {
      const response = await fetch(`/api/external/accounting/payroll/maintenance?year=${selectedYear}&month=${selectedMonth}&period=${selectedBiweekly}`);
      if (!response.ok) throw new Error('Failed to fetch maintenance payroll');
      return response.json();
    },
    staleTime: 30000,
  });

  const { data: cleaningData, isLoading: cleaningLoading } = useQuery<PayrollResponse>({
    queryKey: ['/api/external/accounting/payroll/cleaning', selectedYear, selectedMonth, selectedBiweekly],
    queryFn: async () => {
      const response = await fetch(`/api/external/accounting/payroll/cleaning?year=${selectedYear}&month=${selectedMonth}&period=${selectedBiweekly}`);
      if (!response.ok) throw new Error('Failed to fetch cleaning payroll');
      return response.json();
    },
    staleTime: 30000,
  });

  const { data: commissionsData, isLoading: commissionsLoading } = useQuery<CommissionsResponse>({
    queryKey: ['/api/external/accounting/commissions', selectedYear, selectedMonth, selectedBiweekly],
    queryFn: async () => {
      const response = await fetch(`/api/external/accounting/commissions?year=${selectedYear}&month=${selectedMonth}&period=${selectedBiweekly}`);
      if (!response.ok) throw new Error('Failed to fetch commissions');
      return response.json();
    },
    staleTime: 30000,
  });

  const { data: sellerPayoutsData, isLoading: sellerPayoutsLoading } = useQuery<SellerPayoutsResponse>({
    queryKey: ['/api/external/accounting/seller-payouts', selectedYear, selectedMonth, selectedBiweekly],
    queryFn: async () => {
      const response = await fetch(`/api/external/accounting/seller-payouts?year=${selectedYear}&month=${selectedMonth}&period=${selectedBiweekly}`);
      if (!response.ok) throw new Error('Failed to fetch seller payouts');
      return response.json();
    },
    staleTime: 30000,
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, language === 'es' ? 'dd/MM/yyyy' : 'MM/dd/yyyy', { locale: language === 'es' ? es : undefined });
  };

  const handlePreviousPeriod = () => {
    if (selectedBiweekly === 1) {
      if (selectedMonth === 1) {
        setSelectedYear(selectedYear - 1);
        setSelectedMonth(12);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
      setSelectedBiweekly(2);
    } else {
      setSelectedBiweekly(1);
    }
  };

  const handleNextPeriod = () => {
    if (selectedBiweekly === 2) {
      if (selectedMonth === 12) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
      setSelectedBiweekly(1);
    } else {
      setSelectedBiweekly(2);
    }
  };

  const exportToExcel = (tabName: string, data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tabName);
    XLSX.writeFile(wb, `${filename}_${selectedYear}_${selectedMonth}_Q${selectedBiweekly}.xlsx`);
  };

  const PeriodSelector = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handlePreviousPeriod}
          data-testid="button-previous-period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t[monthNames[selectedMonth - 1]]} {selectedYear} - {selectedBiweekly === 1 ? t.first : t.second}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleNextPeriod}
          data-testid="button-next-period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-24" data-testid="select-year">
            <SelectValue placeholder={t.year} />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger className="w-32" data-testid="select-month">
            <SelectValue placeholder={t.month} />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((month, idx) => (
              <SelectItem key={idx} value={String(idx + 1)}>{t[month]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(selectedBiweekly)} onValueChange={(v) => setSelectedBiweekly(parseInt(v))}>
          <SelectTrigger className="w-28" data-testid="select-biweekly">
            <SelectValue placeholder={t.biweekly} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{t.first}</SelectItem>
            <SelectItem value="2">{t.second}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  const MaintenancePayrollTab = () => {
    if (maintenanceLoading) return <LoadingState />;
    if (!maintenanceData || maintenanceData.items.length === 0) {
      return <EmptyState message={t.noData} />;
    }

    const handleExport = () => {
      const exportData = maintenanceData.items.map(item => ({
        'Ticket': item.ticketNumber,
        'Título': item.title,
        'Categoría': item.category,
        'Trabajador': item.workerName,
        'Unidad': item.unitNumber || '',
        'Condominio': item.condominiumName || '',
        'Fecha Cierre': formatDate(item.closedAt),
        'Pago Neto': item.netPayment,
        'Cuota Admin': item.adminFee,
        'Total': item.totalCharged,
      }));
      exportToExcel('Nomina_Mantenimiento', exportData, 'nomina_mantenimiento');
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.totalNetPayment}</p>
                    <p className="text-lg font-bold">{formatCurrency(maintenanceData.totals.netPayment)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.items}</p>
                    <p className="text-lg font-bold">{maintenanceData.totals.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button variant="outline" onClick={handleExport} data-testid="button-export-maintenance">
            <Download className="h-4 w-4 mr-2" />
            {t.exportExcel}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.ticket}</TableHead>
                  <TableHead>{t.worker}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.unit}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.date}</TableHead>
                  <TableHead className="text-right">{t.netPayment}</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">{t.adminFee}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceData.items.map((item) => (
                  <TableRow key={item.ticketId} data-testid={`row-maintenance-${item.ticketId}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.ticketNumber}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{item.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.workerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{item.unitNumber || '-'}</p>
                          <p className="text-xs text-muted-foreground">{item.condominiumName || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(item.closedAt)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(item.netPayment)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                      {formatCurrency(item.adminFee)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const CleaningPayrollTab = () => {
    if (cleaningLoading) return <LoadingState />;
    if (!cleaningData || cleaningData.items.length === 0) {
      return <EmptyState message={t.noData} />;
    }

    const handleExport = () => {
      const exportData = cleaningData.items.map(item => ({
        'Ticket': item.ticketNumber,
        'Título': item.title,
        'Trabajador': item.workerName,
        'Unidad': item.unitNumber || '',
        'Condominio': item.condominiumName || '',
        'Fecha Cierre': formatDate(item.closedAt),
        'Pago Neto': item.netPayment,
        'Cuota Admin': item.adminFee,
        'Total': item.totalCharged,
      }));
      exportToExcel('Nomina_Limpieza', exportData, 'nomina_limpieza');
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.totalNetPayment}</p>
                    <p className="text-lg font-bold">{formatCurrency(cleaningData.totals.netPayment)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.items}</p>
                    <p className="text-lg font-bold">{cleaningData.totals.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button variant="outline" onClick={handleExport} data-testid="button-export-cleaning">
            <Download className="h-4 w-4 mr-2" />
            {t.exportExcel}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.ticket}</TableHead>
                  <TableHead>{t.worker}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.unit}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.date}</TableHead>
                  <TableHead className="text-right">{t.netPayment}</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">{t.adminFee}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cleaningData.items.map((item) => (
                  <TableRow key={item.ticketId} data-testid={`row-cleaning-${item.ticketId}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.ticketNumber}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{item.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.workerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{item.unitNumber || '-'}</p>
                          <p className="text-xs text-muted-foreground">{item.condominiumName || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(item.closedAt)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(item.netPayment)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                      {formatCurrency(item.adminFee)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const CommissionsTab = () => {
    if (commissionsLoading) return <LoadingState />;
    if (!commissionsData || commissionsData.items.length === 0) {
      return <EmptyState message={t.noData} />;
    }

    const handleExport = () => {
      const exportData = commissionsData.items.map(item => ({
        'Tipo': item.type === 'service' ? t.service : t.rental,
        'Referencia': item.reference,
        'Descripción': item.description,
        'Categoría': item.category,
        'Unidad': item.unitNumber || '',
        'Condominio': item.condominiumName || '',
        'Fecha': formatDate(item.date),
        'Monto Base': item.baseAmount,
        'Comisión': item.commissionAmount,
      }));
      exportToExcel('Comisiones', exportData, 'comisiones');
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.serviceCommissions}</p>
                    <p className="text-lg font-bold">{formatCurrency(commissionsData.totals.serviceCommissions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.rentalCommissions}</p>
                    <p className="text-lg font-bold">{formatCurrency(commissionsData.totals.rentalCommissions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.totalCommissions}</p>
                    <p className="text-lg font-bold">{formatCurrency(commissionsData.totals.totalCommissions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button variant="outline" onClick={handleExport} data-testid="button-export-commissions">
            <Download className="h-4 w-4 mr-2" />
            {t.exportExcel}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.reference}</TableHead>
                  <TableHead>{t.category}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.unit}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.date}</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">{t.baseAmount}</TableHead>
                  <TableHead className="text-right">{t.commission}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionsData.items.map((item, idx) => (
                  <TableRow key={`${item.type}-${item.id}-${idx}`} data-testid={`row-commission-${item.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.reference}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'service' ? 'default' : 'secondary'}>
                        {item.type === 'service' ? (
                          <><Wrench className="h-3 w-3 mr-1" />{item.category}</>
                        ) : (
                          <><Home className="h-3 w-3 mr-1" />{t.rental}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="text-sm">{item.unitNumber || '-'}</p>
                        <p className="text-xs text-muted-foreground">{item.condominiumName || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                      {formatCurrency(item.baseAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(item.commissionAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const SellerPayoutsTab = () => {
    if (sellerPayoutsLoading) return <LoadingState />;
    if (!sellerPayoutsData || sellerPayoutsData.items.length === 0) {
      return <EmptyState message={t.noData} />;
    }

    const handleExport = () => {
      const exportData = sellerPayoutsData.items.map(item => ({
        'Lead': item.leadName,
        'Email Lead': item.leadEmail || '',
        'Vendedor': item.sellerName,
        'Email Vendedor': item.sellerEmail || '',
        'Unidad': item.unitNumber || '',
        'Condominio': item.condominiumName || '',
        'Fecha Contrato': formatDate(item.contractStartDate),
        'Renta Mensual': item.monthlyRent,
        'Comisión Renta': item.rentalCommission,
        'Pago Vendedor': item.sellerPayout,
      }));
      exportToExcel('Pagos_Vendedores', exportData, 'pagos_vendedores');
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.totalPayouts}</p>
                    <p className="text-lg font-bold">{formatCurrency(sellerPayoutsData.totals.totalPayouts)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.items}</p>
                    <p className="text-lg font-bold">{sellerPayoutsData.totals.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button variant="outline" onClick={handleExport} data-testid="button-export-sellers">
            <Download className="h-4 w-4 mr-2" />
            {t.exportExcel}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.lead}</TableHead>
                  <TableHead>{t.seller}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.unit}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.date}</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">{t.rentalCommission}</TableHead>
                  <TableHead className="text-right">{t.sellerPayout}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerPayoutsData.items.map((item) => (
                  <TableRow key={item.contractId} data-testid={`row-seller-${item.contractId}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.leadName}</p>
                        <p className="text-xs text-muted-foreground">{item.leadEmail || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{item.sellerName}</p>
                          <p className="text-xs text-muted-foreground">{item.sellerEmail || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{item.unitNumber || '-'}</p>
                          <p className="text-xs text-muted-foreground">{item.condominiumName || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(item.contractStartDate)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                      {formatCurrency(item.rentalCommission)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(item.sellerPayout)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.pageTitle}</h1>
            <p className="text-muted-foreground">{t.pageDescription}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="space-y-4">
          <PeriodSelector />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-4'}`}>
              <TabsTrigger value="maintenance" className="gap-2" data-testid="tab-maintenance">
                <Wrench className="h-4 w-4" />
                <span className={isMobile ? 'hidden sm:inline' : ''}>{t.maintenancePayroll}</span>
                {isMobile && <span className="sm:hidden">Mant.</span>}
              </TabsTrigger>
              <TabsTrigger value="cleaning" className="gap-2" data-testid="tab-cleaning">
                <Sparkles className="h-4 w-4" />
                <span className={isMobile ? 'hidden sm:inline' : ''}>{t.cleaningPayroll}</span>
                {isMobile && <span className="sm:hidden">Limp.</span>}
              </TabsTrigger>
              <TabsTrigger value="commissions" className="gap-2" data-testid="tab-commissions">
                <Percent className="h-4 w-4" />
                <span className={isMobile ? 'hidden sm:inline' : ''}>{t.commissions}</span>
                {isMobile && <span className="sm:hidden">Com.</span>}
              </TabsTrigger>
              <TabsTrigger value="sellers" className="gap-2" data-testid="tab-sellers">
                <Users className="h-4 w-4" />
                <span className={isMobile ? 'hidden sm:inline' : ''}>{t.sellerPayouts}</span>
                {isMobile && <span className="sm:hidden">Vend.</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="maintenance">
              <MaintenancePayrollTab />
            </TabsContent>

            <TabsContent value="cleaning">
              <CleaningPayrollTab />
            </TabsContent>

            <TabsContent value="commissions">
              <CommissionsTab />
            </TabsContent>

            <TabsContent value="sellers">
              <SellerPayoutsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
