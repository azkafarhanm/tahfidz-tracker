"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function playNotificationSound(isSuccess: boolean) {
  try {
    const ctx = new AudioContext();

    if (isSuccess) {
      const note1 = ctx.createOscillator();
      const note2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      note1.connect(gain1);
      gain1.connect(ctx.destination);
      note2.connect(gain2);
      gain2.connect(ctx.destination);

      note1.type = "sine";
      note1.frequency.value = 523.25;
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      note1.start(ctx.currentTime);
      note1.stop(ctx.currentTime + 0.25);

      note2.type = "sine";
      note2.frequency.value = 659.25;
      gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      note2.start(ctx.currentTime + 0.15);
      note2.stop(ctx.currentTime + 0.45);
    } else {
      const note1 = ctx.createOscillator();
      const note2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      note1.connect(gain1);
      gain1.connect(ctx.destination);
      note2.connect(gain2);
      gain2.connect(ctx.destination);

      note1.type = "triangle";
      note1.frequency.value = 440;
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      note1.start(ctx.currentTime);
      note1.stop(ctx.currentTime + 0.25);

      note2.type = "triangle";
      note2.frequency.value = 349.23;
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      note2.start(ctx.currentTime + 0.15);
      note2.stop(ctx.currentTime + 0.4);
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
