import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { useLocation } from "wouter";

interface ImpersonationStatus {
  isImpersonating: boolean;
  impersonatedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  originalAdmin?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function ImpersonationBanner() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  
  const { data: impersonationStatus, isLoading } = useQuery<ImpersonationStatus>({
    queryKey: ['/api/external/impersonation-status'],
    refetchInterval: 30000,
  });

  const endImpersonationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/external/end-impersonation", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/impersonation-status'] });
      setLocation('/external/accounts');
    },
  });

  if (isLoading || !impersonationStatus?.isImpersonating) {
    return null;
  }

  const { impersonatedUser, originalAdmin } = impersonationStatus;

  return (
    <div 
      className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between gap-4 shadow-lg flex-shrink-0"
      data-testid="impersonation-banner"
    >
      <div className="flex items-center gap-3">
        <Eye className="h-5 w-5" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-medium">
            {language === "es" 
              ? "Estás viendo como:" 
              : "You are viewing as:"}
          </span>
          <span className="text-blue-100">
            {impersonatedUser?.firstName} {impersonatedUser?.lastName} ({impersonatedUser?.email})
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {originalAdmin && (
          <span className="hidden md:inline text-blue-200 text-sm">
            {language === "es" 
              ? `Admin: ${originalAdmin.firstName} ${originalAdmin.lastName}` 
              : `Admin: ${originalAdmin.firstName} ${originalAdmin.lastName}`}
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => endImpersonationMutation.mutate()}
          disabled={endImpersonationMutation.isPending}
          className="bg-white text-blue-600 hover:bg-blue-50"
          data-testid="button-end-impersonation"
        >
          <X className="h-4 w-4 mr-1" />
          {language === "es" ? "Salir" : "Exit"}
        </Button>
      </div>
    </div>
  );
}
