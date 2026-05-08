"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function playNotificationSound(isSuccess: boolean) {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else {
      oscillator.frequency.value = 330;
      oscillator.type = "square";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Audio not supported, ignore silently
  }
}

export default function ToastMessenger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    if (success) {
      toast.success(success);
      playNotificationSound(true);
      router.replace(pathname);
    } else if (error) {
      toast.error(error);
      playNotificationSound(false);
      router.replace(pathname);
    }
  }, [success, error, pathname, router]);

  return null;
}
