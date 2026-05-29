"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/components/useMediaQuery";

function MotivationCardSkeleton() {
  return (
    <div className="h-32 rounded-2xl border border-slate-100 bg-slate-50 motion-safe:animate-pulse dark:border-slate-800 dark:bg-slate-800" />
  );
}

const MotivationCard = dynamic(() => import("@/components/MotivationCard"), {
  loading: () => <MotivationCardSkeleton />,
  ssr: false,
});

export default function DesktopMotivationCard() {
  const enabled = useMediaQuery("(min-width: 640px)");

  if (enabled === null) {
    return <MotivationCardSkeleton />;
  }

  return enabled ? <MotivationCard /> : null;
}
