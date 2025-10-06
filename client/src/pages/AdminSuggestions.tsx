import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, X, Building2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Colony, Condominium } from "@shared/schema";

export default function AdminSuggestions() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("colonies");

  // Fetch pending colonies
  const { data: colonies = [], isLoading: loadingColonies } = useQuery<Colony[]>({
    queryKey: ["/api/colonies"],
  });

  // Fetch pending condominiums
  const { data: condominiums = [], isLoading: loadingCondos } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums"],
  });

  const pendingColonies = colonies.filter((c) => c.approvalStatus === "pending");
  const pendingCondos = condominiums.filter((c) => c.approvalStatus === "pending");

  // Colony approval/rejection mutations
  const approveColonyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/colonies/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: t("admin.suggestions.approveSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies/approved"] });
    },
    onError: () => {
      toast({
        title: t("admin.suggestions.approveError"),
        variant: "destructive",
      });
    },
  });

  const rejectColonyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/colonies/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: t("admin.suggestions.rejectSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies/approved"] });
    },
    onError: () => {
      toast({
        title: t("admin.suggestions.rejectError"),
        variant: "destructive",
      });
    },
  });

  // Condominium approval/rejection mutations
  const approveCondoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/condominiums/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: t("admin.suggestions.approveSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums/approved"] });
    },
    onError: () => {
      toast({
        title: t("admin.suggestions.approveError"),
        variant: "destructive",
      });
    },
  });

  const rejectCondoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/condominiums/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: t("admin.suggestions.rejectSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums/approved"] });
    },
    onError: () => {
      toast({
        title: t("admin.suggestions.rejectError"),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {t("admin.suggestions.title")}
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-description">
          {t("admin.suggestions.description")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-suggestions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="colonies" data-testid="tab-colonies">
            <MapPin className="w-4 h-4 mr-2" />
            {t("admin.suggestions.coloniesTab")} ({pendingColonies.length})
          </TabsTrigger>
          <TabsTrigger value="condominiums" data-testid="tab-condominiums">
            <Building2 className="w-4 h-4 mr-2" />
            {t("admin.suggestions.condominiumsTab")} ({pendingCondos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colonies" className="space-y-4">
          {loadingColonies ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">{t("common.loading")}</p>
              </CardContent>
            </Card>
          ) : pendingColonies.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center" data-testid="text-no-colonies">
                  {t("admin.suggestions.noColonies")}
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingColonies.map((colony) => (
              <Card key={colony.id} data-testid={`card-colony-${colony.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`text-colony-name-${colony.id}`}>
                        {colony.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <span className="text-sm">
                          {t("admin.suggestions.requestedBy")}{" "}
                          <span className="font-medium">{colony.requestedBy || "N/A"}</span>
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-status-${colony.id}`}>
                      {t("common.pending")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => rejectColonyMutation.mutate(colony.id)}
                      disabled={rejectColonyMutation.isPending}
                      data-testid={`button-reject-colony-${colony.id}`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.rejectButton")}
                    </Button>
                    <Button
                      onClick={() => approveColonyMutation.mutate(colony.id)}
                      disabled={approveColonyMutation.isPending}
                      data-testid={`button-approve-colony-${colony.id}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.approveButton")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="condominiums" className="space-y-4">
          {loadingCondos ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">{t("common.loading")}</p>
              </CardContent>
            </Card>
          ) : pendingCondos.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center" data-testid="text-no-condominiums">
                  {t("admin.suggestions.noCondominiums")}
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingCondos.map((condo) => (
              <Card key={condo.id} data-testid={`card-condo-${condo.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl" data-testid={`text-condo-name-${condo.id}`}>
                        {condo.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <span className="text-sm">
                          {t("admin.suggestions.requestedBy")}{" "}
                          <span className="font-medium">{condo.requestedBy || "N/A"}</span>
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-status-${condo.id}`}>
                      {t("common.pending")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => rejectCondoMutation.mutate(condo.id)}
                      disabled={rejectCondoMutation.isPending}
                      data-testid={`button-reject-condo-${condo.id}`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.rejectButton")}
                    </Button>
                    <Button
                      onClick={() => approveCondoMutation.mutate(condo.id)}
                      disabled={approveCondoMutation.isPending}
                      data-testid={`button-approve-condo-${condo.id}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.approveButton")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
