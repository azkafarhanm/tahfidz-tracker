"use client";

import { useEffect, useState } from "react";

type LocalDateTimeProps = {
  iso: string;
  locale?: string;
  mode?: "date" | "time" | "dateTime";
  fallback?: string;
};

const localeMap: Record<string, string> = {
  id: "id-ID",
  en: "en-US",
  ar: "ar-SA",
};

function formatLocalDateTime(iso: string, locale: string, mode: NonNullable<LocalDateTimeProps["mode"]>) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const localeTag = localeMap[locale] ?? "id-ID";
  const dateText = new Intl.DateTimeFormat(localeTag, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const timeText = new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(date);

  if (mode === "time") return timeText;
  if (mode === "dateTime") return `${dateText} - ${timeText}`;
  return dateText;
}

export default function LocalDateTime({
  iso,
  locale = "id",
  mode = "date",
  fallback = "",
}: LocalDateTimeProps) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    setText(formatLocalDateTime(iso, locale, mode) || fallback);
  }, [fallback, iso, locale, mode]);

  return <time dateTime={iso}>{text}</time>;
}
