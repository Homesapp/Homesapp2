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

          <div className="pt-8 flex gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <Link href="/register">{t("landing.createAccount")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-get-started-login">
              <Link href="/login">{t("landing.loginButton")}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
