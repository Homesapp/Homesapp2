import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Phone, Mail, Users, MapPin, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, subDays, startOfMonth, startOfWeek } from "date-fns";
import { es, enUS } from "date-fns/locale";

type SellerReportData = {
  period: string;
  totalActivities: number;
  activitiesByType: Record<string, number>;
  totalShowings: number;
  showingsByOutcome: Record<string, number>;
  leadsContacted: number;
  leadsConverted: number;
  conversionRate: number;
  dailyActivity: Array<{ date: string; count: number }>;
};

const ACTIVITY_TYPE_LABELS: Record<string, Record<string, string>> = {
  es: {
    call: "Llamadas",
    email: "Emails",
    meeting: "Reuniones",
    whatsapp: "WhatsApp",
    showing: "Visitas",
    note: "Notas",
  },
  en: {
    call: "Calls",
    email: "Emails",
    meeting: "Meetings",
    whatsapp: "WhatsApp",
    showing: "Showings",
    note: "Notes",
  },
};

const OUTCOME_LABELS: Record<string, Record<string, string>> = {
  es: {
    interested: "Interesado",
    not_interested: "No interesado",
    offer_made: "Oferta hecha",
    reschedule: "Reagendar",
    no_show: "No asistió",
  },
  en: {
    interested: "Interested",
    not_interested: "Not interested",
    offer_made: "Offer made",
    reschedule: "Reschedule",
    no_show: "No show",
  },
};

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  whatsapp: Phone,
  showing: MapPin,
};

export default function SellerReports() {
  const { language } = useLanguage();
  const dateLocale = language === "es" ? es : enUS;
  const [period, setPeriod] = useState("week");

  const { data: reportData, isLoading } = useQuery<SellerReportData>({
    queryKey: ['/api/external-dashboard/seller-reports', period],
  });

  const stats = reportData || {
    period,
    totalActivities: 0,
    activitiesByType: {},
    totalShowings: 0,
    showingsByOutcome: {},
    leadsContacted: 0,
    leadsConverted: 0,
    conversionRate: 0,
    dailyActivity: [],
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return language === "es" ? "Hoy" : "Today";
      case "week":
        return language === "es" ? "Esta semana" : "This week";
      case "month":
        return language === "es" ? "Este mes" : "This month";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Mis Reportes de Actividad" : "My Activity Reports"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Resumen de tus actividades, llamadas, visitas y conversiones"
              : "Summary of your activities, calls, showings and conversions"}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]" data-testid="select-period">
            <SelectValue placeholder={language === "es" ? "Período" : "Period"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{language === "es" ? "Hoy" : "Today"}</SelectItem>
            <SelectItem value="week">{language === "es" ? "Esta semana" : "This week"}</SelectItem>
            <SelectItem value="month">{language === "es" ? "Este mes" : "This month"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-activities">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Total Actividades" : "Total Activities"}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-activities">
                {stats.totalActivities}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-showings">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Visitas Realizadas" : "Showings Done"}
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-showings">
                {stats.totalShowings}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-contacts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Leads Contactados" : "Leads Contacted"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-leads-contacted">
                {stats.leadsContacted}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Tasa de Conversión" : "Conversion Rate"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" data-testid="text-conversion-rate">
                  {stats.conversionRate}%
                </span>
                {stats.conversionRate > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats.leadsConverted} {language === "es" ? "convertidos" : "converted"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList>
          <TabsTrigger value="activities">{language === "es" ? "Actividades" : "Activities"}</TabsTrigger>
          <TabsTrigger value="showings">{language === "es" ? "Visitas" : "Showings"}</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Actividades por Tipo" : "Activities by Type"}</CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Distribución de tus actividades por categoría"
                  : "Distribution of your activities by category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : Object.keys(stats.activitiesByType).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {language === "es" ? "No hay actividades en este período" : "No activities in this period"}
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.activitiesByType).map(([type, count]) => {
                    const Icon = ACTIVITY_ICONS[type] || BarChart3;
                    const percentage = stats.totalActivities > 0 
                      ? Math.round((count / stats.totalActivities) * 100) 
                      : 0;
                    
                    return (
                      <div key={type} className="flex items-center gap-3" data-testid={`activity-type-${type}`}>
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {ACTIVITY_TYPE_LABELS[language]?.[type] || type}
                            </span>
                            <span className="text-sm font-semibold">{count}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">{percentage}%</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="showings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Resultados de Visitas" : "Showing Outcomes"}</CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Resultados de las visitas realizadas"
                  : "Outcomes from completed showings"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : Object.keys(stats.showingsByOutcome).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {language === "es" ? "No hay visitas completadas en este período" : "No showings completed in this period"}
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(stats.showingsByOutcome).map(([outcome, count]) => (
                    <div 
                      key={outcome} 
                      className="p-4 rounded-lg border flex items-center justify-between"
                      data-testid={`outcome-${outcome}`}
                    >
                      <span className="font-medium">
                        {OUTCOME_LABELS[language]?.[outcome] || outcome}
                      </span>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
