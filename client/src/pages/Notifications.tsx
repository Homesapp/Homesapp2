import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/notifications/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    
    if (notification.relatedEntityType && notification.relatedEntityId) {
      if (notification.relatedEntityType === "property") {
        setLocation(`/propiedad/${notification.relatedEntityId}`);
      } else if (notification.relatedEntityType === "appointment") {
        setLocation(`/appointments`);
      } else if (notification.relatedEntityType === "offer") {
        setLocation(`/backoffice`);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return "📅";
      case "offer":
        return "💰";
      case "message":
        return "💬";
      case "property_update":
        return "🏠";
      case "rental_update":
        return "🔑";
      default:
        return "📢";
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-notifications">
              Notificaciones
            </h1>
            <p className="text-muted-foreground">
              Mantente al día con todas tus notificaciones
            </p>
          </div>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            Todas
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" data-testid="tab-unread">
            No leídas
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" data-testid="tab-read">
            Leídas
            {readNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {readNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tienes notificaciones</h3>
                <p className="text-muted-foreground">
                  Cuando recibas notificaciones, aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`hover-elevate cursor-pointer transition-all ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-card-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default">Nueva</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">¡Todo al día!</h3>
                <p className="text-muted-foreground">
                  No tienes notificaciones sin leer
                </p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="hover-elevate cursor-pointer transition-all border-l-4 border-l-primary"
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-card-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Badge variant="default">Nueva</Badge>
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-3">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay notificaciones leídas</h3>
                <p className="text-muted-foreground">
                  Las notificaciones que marques como leídas aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-card-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-3xl opacity-60">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold opacity-80">{notification.title}</h3>
                      <p className="text-muted-foreground">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
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
