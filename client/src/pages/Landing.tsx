import { Button } from "@/components/ui/button";
import { Building2, Calendar, Users, Shield } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Landing() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">HomesApp</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild data-testid="button-login">
              <Link href="/login">{t("landing.login")}</Link>
            </Button>
            <Button asChild data-testid="button-register">
              <Link href="/register">{t("landing.register")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              {t("landing.title")}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("landing.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="p-6 space-y-2 border rounded-lg">
              <Building2 className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">{t("landing.feature1.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.feature1.desc")}
              </p>
            </div>

            <div className="p-6 space-y-2 border rounded-lg">
              <Calendar className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">{t("landing.feature2.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.feature2.desc")}
              </p>
            </div>

            <div className="p-6 space-y-2 border rounded-lg">
              <Users className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">{t("landing.feature3.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.feature3.desc")}
              </p>
            </div>

            <div className="p-6 space-y-2 border rounded-lg">
              <Shield className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">{t("landing.feature4.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.feature4.desc")}
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-4">
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-get-started">
                <Link href="/register">{t("landing.createAccount")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-get-started-login">
                <Link href="/login">{t("landing.loginButton")}</Link>
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">{t("landing.orSignInWith")}</p>
              <Button size="lg" variant="default" asChild data-testid="button-google-login" className="gap-2">
                <a href="/api/login">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t("landing.googleSignIn")}
                </a>
              </Button>
            </div>
          </div>

          <div className="pt-12 mt-12 border-t">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold">¿Quieres trabajar con nosotros?</h3>
              <p className="text-muted-foreground">
                Únete a nuestro equipo como vendedor o proveedor de servicios especializados
              </p>
              <Button size="lg" variant="default" asChild data-testid="button-apply">
                <Link href="/aplicar">Aplicar Ahora</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
