import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Trash2, Save, Upload, X, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { ChatConversation } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileSchema, type UpdateUserProfile } from "@shared/schema";
import { useEffect, useRef, useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageChanged, setImageChanged] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>("");

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      bio: "",
      profileImageUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      const userImage = user.profileImageUrl || "";
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        bio: user.bio || "",
        profileImageUrl: userImage,
      });
      setImagePreview(userImage);
      setOriginalImage(userImage);
      setImageChanged(false);
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const payload = { ...data };
      
      // Solo incluir profileImageUrl si cambió
      if (!imageChanged) {
        delete payload.profileImageUrl;
      }
      
      return await apiRequest("PATCH", "/api/profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setImageChanged(false);
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/profile");
    },
    onSuccess: () => {
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada exitosamente",
      });
      setTimeout(() => {
        setLocation("/");
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 2MB",
        variant: "destructive",
      });
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      form.setValue("profileImageUrl", base64String, { shouldDirty: true });
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    form.setValue("profileImageUrl", "", { shouldDirty: true });
    setImageChanged(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: UpdateUserProfile) => {
    updateProfileMutation.mutate(data);
  };

  const getInitials = () => {
    const firstName = form.watch("firstName");
    const lastName = form.watch("lastName");
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const { data: conversations = [] } = useQuery<ChatConversation[]>({
    queryKey: ["/api/chat/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
  });

  const recentConversations = conversations.slice(0, 5);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal" data-testid="tab-personal">
            Información Personal
          </TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Conversaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image Upload Section */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={imagePreview} alt={`${form.watch("firstName")} ${form.watch("lastName")}`} />
                  <AvatarFallback className="text-3xl">{getInitials()}</AvatarFallback>
                </Avatar>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-image"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Foto
                  </Button>
                  
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveImage}
                      data-testid="button-remove-image"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Quitar Foto
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-image-file"
                />

                <p className="text-sm text-muted-foreground text-center">
                  Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 2MB
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Juan"
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Pérez"
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-email"
                  />
                </FormControl>
                <FormDescription>
                  El email no se puede cambiar
                </FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+52 123 456 7890"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Cuéntanos un poco sobre ti..."
                        rows={4}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteAccountMutation.isPending ? "Eliminando..." : "Eliminar Cuenta"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta
                      y todos tus datos asociados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAccountMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-confirm-delete"
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Conversaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes conversaciones aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConversations.map((conversation) => (
                    <Card
                      key={conversation.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setLocation("/chat")}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {conversation.isBot ? "🤖" : "👤"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm">
                                  {conversation.title}
                                </h4>
                                {conversation.isBot && (
                                  <Badge variant="secondary" className="text-xs">
                                    Bot
                                  </Badge>
                                )}
                              </div>
                              {conversation.lastMessageAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                    addSuffix: true,
                                    locale: es,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/chat")}
                  data-testid="button-view-all-chats"
                >
                  Ver Todas las Conversaciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
