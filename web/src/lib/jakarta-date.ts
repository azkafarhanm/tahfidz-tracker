const jakartaDayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Jakarta",
  year: "numeric",
});

export function getJakartaDayKey(date: Date) {
  const parts = new Map(
    jakartaDayFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.get("year")}-${parts.get("month")}-${parts.get("day")}`;
}
