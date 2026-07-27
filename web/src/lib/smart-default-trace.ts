let sequence = 0;

export function traceSmartDefault(
  event: string,
  details: Record<string, unknown>,
) {
  if (process.env.NODE_ENV !== "development") return;

  sequence += 1;
  const runtime = typeof window === "undefined" ? "server" : "client";
  console.info(
    `[SmartDefaultTrace #${String(sequence).padStart(3, "0")} ${runtime}] ${event}`,
    { at: new Date().toISOString(), ...details },
  );
}
