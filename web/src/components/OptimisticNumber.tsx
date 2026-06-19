"use client";

import { useEffect, useRef, useState } from "react";
import {
  OPTIMISTIC_STUDENT_CHANGE,
  type StudentChangeEvent,
} from "@/lib/optimistic-events";

type OptimisticNumberProps = {
  value: number;
  field: "active" | "inactive";
};

export default function OptimisticNumber({ value, field }: OptimisticNumberProps) {
  const [localValue, setLocalValue] = useState(value);
  const serverValueRef = useRef(value);

  useEffect(() => {
    if (serverValueRef.current !== value) {
      serverValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StudentChangeEvent>).detail;
      const delta = field === "active" ? detail.activeDelta : detail.inactiveDelta;
      if (delta !== 0) {
        setLocalValue((v) => Math.max(0, v + delta));
      }
    };
    window.addEventListener(OPTIMISTIC_STUDENT_CHANGE, handler);
    return () => window.removeEventListener(OPTIMISTIC_STUDENT_CHANGE, handler);
  }, [field]);

  return <>{localValue}</>;
}
