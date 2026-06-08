import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["id", "en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get("locale")?.value;
  const locale = raw && locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
