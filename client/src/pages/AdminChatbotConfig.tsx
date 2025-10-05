import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateChatbotConfigSchema, type UpdateChatbotConfig, type ChatbotConfig } from "@shared/schema";
import { Bot, Save, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminChatbotConfig() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<ChatbotConfig>({
    queryKey: ["/api/chatbot/config"],
  });

  const form = useForm<UpdateChatbotConfig>({
    resolver: zodResolver(updateChatbotConfigSchema),
    defaultValues: {
      name: "",
      systemPrompt: "",
      isActive: true,
      welcomeMessage: "",
      conversationalMode: true,
      canSuggestPresentationCards: true,
      canScheduleAppointments: true,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        systemPrompt: config.systemPrompt,
        isActive: config.isActive,
        welcomeMessage: config.welcomeMessage,
        conversationalMode: config.conversationalMode,
        canSuggestPresentationCards: config.canSuggestPresentationCards,
        canScheduleAppointments: config.canScheduleAppointments,
      });
    }
  }, [config, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateChatbotConfig) => {
      return await apiRequest("PUT", "/api/chatbot/config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/config"] });
      toast({
        title: "Configuración actualizada",
        description: "La configuración del chatbot se ha actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateChatbotConfig) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Configuración del Chatbot
          </h1>
          <p className="text-muted-foreground mt-2">
            Configura el comportamiento y los mensajes del asistente virtual MARCO
          </p>
        </div>
        {config && (
          <Badge variant={config.isActive ? "default" : "secondary"} data-testid="badge-chatbot-status">
            {config.isActive ? "Activo" : "Inactivo"}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Configura el nombre y el estado del asistente virtual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Chatbot</FormLabel>
                    <FormControl>
                      <Input placeholder="MARCO" {...field} data-testid="input-chatbot-name" />
                    </FormControl>
                    <FormDescription>
                      El nombre que se mostrará al cliente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado del Chatbot</FormLabel>
                      <FormDescription>
                        Activa o desactiva el asistente virtual para todos los clientes
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-chatbot-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensajes</CardTitle>
              <CardDescription>
                Personaliza los mensajes del asistente virtual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje de Bienvenida</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="¡Hola! Soy MARCO..."
                        className="min-h-24"
                        {...field}
                        data-testid="textarea-welcome-message"
                      />
                    </FormControl>
                    <FormDescription>
                      El mensaje que el cliente recibirá al iniciar la conversación
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt del Sistema</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Eres MARCO, el asistente virtual de HomesApp..."
                        className="min-h-48 font-mono text-sm"
                        {...field}
                        data-testid="textarea-system-prompt"
                      />
                    </FormControl>
                    <FormDescription>
                      Las instrucciones que guían el comportamiento del chatbot. Define su personalidad, objetivos y cómo debe interactuar con los clientes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacidades</CardTitle>
              <CardDescription>
                Habilita o deshabilita funciones específicas del chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="conversationalMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Modo Conversacional</FormLabel>
                      <FormDescription>
                        El chatbot hará preguntas paso a paso de manera natural
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-conversational-mode"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="canSuggestPresentationCards"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sugerir Tarjetas de Presentación</FormLabel>
                      <FormDescription>
                        Permitir que el chatbot sugiera usar tarjetas de presentación existentes
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-suggest-cards"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="canScheduleAppointments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Coordinar Citas</FormLabel>
                      <FormDescription>
                        Permitir que el chatbot ayude a coordinar citas para ver propiedades
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-schedule-appointments"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={updateMutation.isPending}
              data-testid="button-reset"
            >
              Restablecer
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              {updateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
