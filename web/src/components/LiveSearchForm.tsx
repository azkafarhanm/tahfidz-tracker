"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

type LiveSearchFormProps = {
  action: string;
  buttonLabel: string;
  className: string;
  defaultValue?: string;
  debounceMs?: number;
  inputClassName: string;
  placeholder: string;
};

export default function LiveSearchForm({
  action,
  buttonLabel,
  className,
  defaultValue = "",
  debounceMs = 250,
  inputClassName,
  placeholder,
}: LiveSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const nextQuery = query.trim();
    const currentQuery = defaultValue.trim();

    if (nextQuery === currentQuery) {
      return;
    }

    if (nextQuery.length === 1) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        router.replace(
          nextQuery ? `${action}?q=${encodeURIComponent(nextQuery)}` : action,
          { scroll: false },
        );
      });
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [action, debounceMs, defaultValue, query, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = query.trim();
    startTransition(() => {
      router.replace(
        nextQuery ? `${action}?q=${encodeURIComponent(nextQuery)}` : action,
        { scroll: false },
      );
    });
  };

  return (
    <form
      action={action}
      autoComplete="off"
      className={className}
      onSubmit={handleSubmit}
      role="search"
    >
      <Search aria-hidden="true" size={18} strokeWidth={2.2} />
      <input
        aria-label={placeholder}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className={inputClassName}
        enterKeyHint="search"
        name="q"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        type="search"
        value={query}
      />
      <button
        aria-busy={isPending}
        className="rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
