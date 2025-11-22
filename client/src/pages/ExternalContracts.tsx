import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FilePlus, ScrollText } from "lucide-react";
import ExternalOfferLinks from "@/components/ExternalOfferLinks";
import ExternalRentalFormLinks from "@/components/ExternalRentalFormLinks";
import ExternalContractProcesses from "@/components/ExternalContractProcesses";

export default function ExternalContracts() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("offers");

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {language === "es" ? "Contratos" : "Contracts"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es"
            ? "Gestiona ofertas de renta, formatos y procesos de contrato"
            : "Manage rental offers, forms and contract processes"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="offers" className="gap-2">
            <FileText className="h-4 w-4" />
            {language === "es" ? "Ofertas de Renta" : "Rental Offers"}
          </TabsTrigger>
          <TabsTrigger value="forms" className="gap-2">
            <FilePlus className="h-4 w-4" />
            {language === "es" ? "Formatos de Renta" : "Rental Forms"}
          </TabsTrigger>
          <TabsTrigger value="processes" className="gap-2">
            <ScrollText className="h-4 w-4" />
            {language === "es" ? "Procesos de Contrato" : "Contract Processes"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-4">
          <ExternalOfferLinks />
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <ExternalRentalFormLinks />
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <ExternalContractProcesses />
        </TabsContent>
      </Tabs>
    </div>
  );
}
