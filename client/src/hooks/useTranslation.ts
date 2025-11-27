import { useLanguage } from "@/contexts/LanguageContext";

export function useTranslation() {
  const { language, t: translate } = useLanguage();

  const t = (key: string, fallback?: string): string => {
    const translated = translate(key);
    if (translated === key && fallback) {
      return fallback;
    }
    return translated;
  };

  return {
    t,
    locale: language,
    language,
  };
}
