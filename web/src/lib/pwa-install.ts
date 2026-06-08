export type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function setDeferredPrompt(
  prompt: BeforeInstallPromptEvent | null,
): void {
  deferredPrompt = prompt;
}

export async function triggerInstall(): Promise<{
  outcome: string;
}> {
  if (!deferredPrompt) return { outcome: "unavailable" };
  const prompt = deferredPrompt;
  deferredPrompt = null;
  await prompt.prompt();
  const result = await prompt.userChoice;
  return { outcome: result.outcome };
}
