"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/feedback";

export default function ToastMessenger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("success");
    nextParams.delete("error");
    nextParams.delete("saved");
    nextParams.delete("deleted");
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;

    if (success) {
      toast.success(success);
      playNotificationSound("success");
      router.replace(nextUrl, { scroll: false });
    } else if (error) {
      toast.error(error);
      playNotificationSound("error");
      router.replace(nextUrl, { scroll: false });
    }
  }, [error, pathname, router, searchParams, success]);

  return null;
}
