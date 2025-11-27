import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Home, Key, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useTranslation } from "@/hooks/useTranslation";

const loginSchema = z.object({
  portalId: z.string().min(1, "Portal ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const { login, isLoading: authLoading } = usePortalAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"tenant" | "owner">("tenant");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      portalId: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(data.portalId, data.password, activeTab);
      
      if (result.success) {
        setLocation(activeTab === "tenant" ? "/portal/tenant" : "/portal/owner");
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("portalLogin.title", "Property Portal")}</CardTitle>
          <CardDescription>
            {t("portalLogin.description", "Access your rental property dashboard")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tenant" | "owner")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="tenant" className="gap-2" data-testid="tab-tenant">
                <Home className="h-4 w-4" />
                {t("portalLogin.tenant", "Tenant")}
              </TabsTrigger>
              <TabsTrigger value="owner" className="gap-2" data-testid="tab-owner">
                <Key className="h-4 w-4" />
                {t("portalLogin.owner", "Owner")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="portalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("portalLogin.portalId", "Portal ID")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("portalLogin.portalIdPlaceholder", "Enter your portal ID")}
                            data-testid="input-portal-id"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("portalLogin.password", "Password")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t("portalLogin.passwordPlaceholder", "Enter your password")}
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    data-testid="button-login"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("portalLogin.loggingIn", "Logging in...")}
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        {t("portalLogin.login", "Log In")}
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  {activeTab === "tenant"
                    ? t("portalLogin.tenantHelp", "Your portal credentials were provided when your rental contract was created.")
                    : t("portalLogin.ownerHelp", "Your portal credentials were provided when your property was registered for rental.")}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
