import { useQuery, useMutation, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkReport, InsertWorkReport } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface WorkReportFilters {
  taskId?: string;
  reportType?: string;
}

export function useWorkReports(filters?: WorkReportFilters): UseQueryResult<WorkReport[], Error> {
  const params = new URLSearchParams();
  if (filters?.taskId) {
    params.append("taskId", filters.taskId);
  }
  if (filters?.reportType) {
    params.append("reportType", filters.reportType);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/work-reports?${queryString}` : "/api/work-reports";

  return useQuery<WorkReport[], Error>({
    queryKey: ["/api/work-reports", filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
  });
}

export function useWorkReport(id: string): UseQueryResult<WorkReport, Error> {
  return useQuery<WorkReport, Error>({
    queryKey: ["/api/work-reports", id],
    enabled: !!id,
  });
}

export function useCreateWorkReport() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertWorkReport) => {
      const res = await apiRequest("POST", "/api/work-reports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Reporte creado",
        description: "El reporte de trabajo ha sido creado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el reporte",
        variant: "destructive",
      });
    },
  });
}
