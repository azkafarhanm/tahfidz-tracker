"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { setLocale } from "@/i18n/actions";

const languages = [
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(code: string) {
    if (code === locale) return;

    startTransition(async () => {
      await setLocale(code);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Globe aria-hidden="true" size={16} className="text-slate-500 dark:text-slate-400" />
      <div className="flex gap-1">
        {languages.map(({ code, label, flag }) => (
          <button
            aria-label={label}
            aria-pressed={locale === code}
            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
              locale === code
                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
            disabled={pending}
            key={code}
            onClick={() => handleChange(code)}
            type="button"
          >
            {flag} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
