"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export default function ToastMessenger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    if (success) {
      toast.success(success);
      router.replace(pathname);
    } else if (error) {
      toast.error(error);
      router.replace(pathname);
    }
  }, [success, error, pathname, router]);

  return null;
}
