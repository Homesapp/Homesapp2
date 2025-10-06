import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

type BlockedSlot = {
  id: number;
  conciergeId: number;
  date: string;
  startTime: string;
  endTime: string;
};

export default function ConciergeSchedule() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("11:00");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: blockedSlots = [], isLoading } = useQuery<BlockedSlot[]>({
    queryKey: ["/api/concierge/blocked-slots"],
  });

  const addBlockedSlotMutation = useMutation({
    mutationFn: async (data: { date: string; startTime: string; endTime: string }) => {
      return await apiRequest("/api/concierge/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/concierge/blocked-slots"] });
      toast({
        title: t("concierge.schedule.blockSuccess"),
        description: t("concierge.schedule.blockSuccessDesc"),
      });
      setIsDialogOpen(false);
      setSelectedDate(new Date());
      setStartTime("10:00");
      setEndTime("11:00");
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("concierge.schedule.blockError"),
        variant: "destructive",
      });
    },
  });

  const deleteBlockedSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/concierge/blocked-slots/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/concierge/blocked-slots"] });
      toast({
        title: t("concierge.schedule.unblockSuccess"),
        description: t("concierge.schedule.unblockSuccessDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("concierge.schedule.unblockError"),
        variant: "destructive",
      });
    },
  });

  const handleAddBlockedSlot = () => {
    if (!selectedDate) {
      toast({
        title: t("common.error"),
        description: t("concierge.schedule.selectDateError"),
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: t("common.error"),
        description: t("concierge.schedule.invalidTimeError"),
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    addBlockedSlotMutation.mutate({ date: dateStr, startTime, endTime });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    slots.push("18:00");
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const sortedSlots = [...blockedSlots].sort((a, b) => {
    const dateA = parse(a.date, "yyyy-MM-dd", new Date());
    const dateB = parse(b.date, "yyyy-MM-dd", new Date());
    const dateCompare = dateA.getTime() - dateB.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingSlots = sortedSlots.filter(slot => {
    const slotDate = parse(slot.date, "yyyy-MM-dd", new Date());
    slotDate.setHours(0, 0, 0, 0);
    return slotDate >= today;
  });
  
  const pastSlots = sortedSlots.filter(slot => {
    const slotDate = parse(slot.date, "yyyy-MM-dd", new Date());
    slotDate.setHours(0, 0, 0, 0);
    return slotDate < today;
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t("concierge.schedule.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("concierge.schedule.description")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-blocked-slot">
              <Plus className="h-4 w-4 mr-2" />
              {t("concierge.schedule.addBlock")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("concierge.schedule.addBlockTitle")}</DialogTitle>
              <DialogDescription>{t("concierge.schedule.addBlockDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("concierge.schedule.selectDate")}</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={language === "es" ? es : undefined}
                  className="rounded-md border"
                  data-testid="calendar-select-date"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("concierge.schedule.startTime")}</label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger data-testid="select-start-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("concierge.schedule.endTime")}</label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger data-testid="select-end-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-block"
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleAddBlockedSlot} 
                disabled={addBlockedSlotMutation.isPending}
                data-testid="button-confirm-block"
              >
                {addBlockedSlotMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">{t("common.loading")}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcomingSlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {t("concierge.schedule.upcomingBlocks")}
                </CardTitle>
                <CardDescription>{t("concierge.schedule.upcomingBlocksDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                      data-testid={`blocked-slot-${slot.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(parse(slot.date, "yyyy-MM-dd", new Date()), "EEEE, d 'de' MMMM yyyy", {
                              locale: language === "es" ? es : undefined,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBlockedSlotMutation.mutate(slot.id)}
                        disabled={deleteBlockedSlotMutation.isPending}
                        data-testid={`button-delete-slot-${slot.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pastSlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("concierge.schedule.pastBlocks")}
                </CardTitle>
                <CardDescription>{t("concierge.schedule.pastBlocksDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pastSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 opacity-60"
                      data-testid={`past-slot-${slot.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(parse(slot.date, "yyyy-MM-dd", new Date()), "EEEE, d 'de' MMMM yyyy", {
                              locale: language === "es" ? es : undefined,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBlockedSlotMutation.mutate(slot.id)}
                        disabled={deleteBlockedSlotMutation.isPending}
                        data-testid={`button-delete-past-slot-${slot.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {blockedSlots.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("concierge.schedule.noBlocks")}</h3>
                  <p className="text-muted-foreground">{t("concierge.schedule.noBlocksDesc")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
