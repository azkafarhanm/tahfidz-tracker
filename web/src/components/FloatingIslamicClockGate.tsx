"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/components/useMediaQuery";

const FloatingIslamicClock = dynamic(
  () => import("@/components/FloatingIslamicClock"),
  {
    loading: () => null,
    ssr: false,
  },
);

export default function FloatingIslamicClockGate() {
  const enabled = useMediaQuery("(min-width: 1280px)", false);

  return enabled ? <FloatingIslamicClock /> : null;
}
