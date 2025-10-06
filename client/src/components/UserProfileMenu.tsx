import { useLocation } from "wouter";
import { LogOut, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type User as UserType, type AdminUser } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserProfileMenuProps {
  user: UserType | AdminUser;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export function UserProfileMenu({ user, isAdmin = false, onLogout }: UserProfileMenuProps) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const fullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || ('username' in user ? user.username : undefined) || "Usuario";

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || ('username' in user ? user.username[0]?.toUpperCase() : undefined) || "U";
  
  const profileImageUrl = 'profileImageUrl' in user ? user.profileImageUrl : undefined;

  const handleLogout = () => {
    if (isAdmin && onLogout) {
      onLogout();
    } else {
      window.location.href = "/api/logout";
    }
  };

  const handleProfileClick = () => {
    if (isAdmin) {
      setLocation("/admin/profile");
    } else {
      setLocation("/perfil");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative gap-2"
            data-testid="button-user-menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profileImageUrl || undefined} alt={fullName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block text-sm">{fullName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" data-testid="dropdown-user-menu">
          <DropdownMenuLabel>{t("userMenu.myAccount")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleProfileClick}
            data-testid="menu-item-profile"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span>{t("userMenu.myProfile")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            data-testid="menu-item-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("userMenu.logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
