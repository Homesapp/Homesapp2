import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Mail, Calendar } from "lucide-react";

export type UserApprovalCardProps = {
  id: string;
  name: string;
  email: string;
  role: string;
  requestDate: string;
  avatar?: string;
  onApprove?: () => void;
  onReject?: () => void;
};

export function UserApprovalCard({
  name,
  email,
  role,
  requestDate,
  avatar,
  onApprove,
  onReject,
}: UserApprovalCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Avatar className="h-12 w-12">
          {avatar && <AvatarImage src={avatar} />}
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{name}</h3>
          <Badge variant="outline" className="mt-1">
            {role}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Solicitado: {requestDate}</span>
        </div>
      </CardContent>

      {(onApprove || onReject) && (
        <CardFooter className="flex gap-2">
          {onApprove && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onApprove}
              data-testid="button-approve-user"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
          )}
          {onReject && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={onReject}
              data-testid="button-reject-user"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
