import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, CreditCard, Wallet, Info } from "lucide-react";
import { updateBankInfoSchema, type UpdateBankInfo } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function BankInfoForm() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const bankForm = useForm<UpdateBankInfo>({
    resolver: zodResolver(updateBankInfoSchema),
    defaultValues: {
      paymentMethod: "bank",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankClabe: "",
      bankEmail: "",
      bankAddress: "",
    },
  });

  // Reset bank form when user data loads
  useEffect(() => {
    if (user) {
      bankForm.reset({
        paymentMethod: (user.paymentMethod as "bank" | "zelle" | "wise") || "bank",
        bankName: user.bankName || "",
        bankAccountName: user.bankAccountName || "",
        bankAccountNumber: user.bankAccountNumber || "",
        bankClabe: user.bankClabe || "",
        bankEmail: user.bankEmail || "",
        bankAddress: user.bankAddress || "",
      });
    }
  }, [user, bankForm]);

  const updateBankInfoMutation = useMutation({
    mutationFn: async (data: UpdateBankInfo) => {
      return await apiRequest("PATCH", "/api/profile/bank-info", data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Información actualizada" : "Information updated",
        description: language === "es"
          ? "Tu información bancaria ha sido actualizada exitosamente"
          : "Your bank information has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo actualizar la información bancaria"
          : "Could not update bank information"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateBankInfo) => {
    updateBankInfoMutation.mutate(data);
  };

  const paymentMethod = bankForm.watch("paymentMethod");
  const hasBankInfo = user?.bankAccountName && user?.bankAccountNumber;

  return (
    <div className="space-y-4">
      {!hasBankInfo && (
        <Alert data-testid="alert-no-bank-info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {language === "es"
              ? "Configure su cuenta bancaria para recibir pagos de comisiones por referidos."
              : "Set up your bank account to receive referral commission payments."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentMethod === "bank" && <Building className="h-5 w-5" />}
            {paymentMethod === "zelle" && <CreditCard className="h-5 w-5" />}
            {paymentMethod === "wise" && <Wallet className="h-5 w-5" />}
            {language === "es" ? "Información Bancaria" : "Bank Information"}
          </CardTitle>
          <CardDescription>
            {language === "es"
              ? "Proporciona tu información bancaria para recibir pagos de comisiones"
              : "Provide your bank information to receive commission payments"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...bankForm}>
            <form onSubmit={bankForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={bankForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Método de pago" : "Payment method"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank">
                          {language === "es" ? "Banco Mexicano" : "Mexican Bank"}
                        </SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="wise">Wise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentMethod === "bank" && (
                <FormField
                  control={bankForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre del banco" : "Bank name"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-bank-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={bankForm.control}
                name="bankAccountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre del titular" : "Account holder name"} *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-account-name" />
                    </FormControl>
                    <FormDescription>
                      {language === "es"
                        ? "Nombre completo tal como aparece en la cuenta"
                        : "Full name as it appears on the account"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bankForm.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {paymentMethod === "bank" && (language === "es" ? "Número de cuenta" : "Account number")}
                      {paymentMethod === "zelle" && (language === "es" ? "Email o teléfono Zelle" : "Zelle email or phone")}
                      {paymentMethod === "wise" && (language === "es" ? "Email de Wise" : "Wise email")}
                      {" *"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-account-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentMethod === "bank" && (
                <FormField
                  control={bankForm.control}
                  name="bankClabe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "CLABE interbancaria" : "Interbank CLABE"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="18 dígitos" data-testid="input-clabe" />
                      </FormControl>
                      <FormDescription>
                        {language === "es" ? "Opcional, pero recomendado para transferencias más rápidas" : "Optional, but recommended for faster transfers"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={bankForm.control}
                name="bankEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Email de contacto" : "Contact email"}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} data-testid="input-bank-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentMethod === "bank" && (
                <FormField
                  control={bankForm.control}
                  name="bankAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Dirección del banco" : "Bank address"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-bank-address" />
                      </FormControl>
                      <FormDescription>
                        {language === "es" ? "Opcional" : "Optional"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                disabled={updateBankInfoMutation.isPending}
                data-testid="button-save-bank-info"
              >
                {updateBankInfoMutation.isPending
                  ? (language === "es" ? "Guardando..." : "Saving...")
                  : (language === "es" ? "Guardar información" : "Save information")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
