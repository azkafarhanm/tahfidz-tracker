"use client";

import { useEffect, useLayoutEffect } from "react";
import { traceScrollLifecycle } from "@/lib/scroll-lifecycle-trace";

type StudentDetailLifecycleTraceProps = {
  historyCount: number;
  programType: string;
  studentId: string;
  tasmiCount: number;
};

export default function StudentDetailLifecycleTrace({
  historyCount,
  programType,
  studentId,
  tasmiCount,
}: StudentDetailLifecycleTraceProps) {
  useLayoutEffect(() => {
    traceScrollLifecycle("Student Detail mount (layout)", {
      studentId,
      programType,
    });
  }, [programType, studentId]);

  useEffect(() => {
    traceScrollLifecycle("Student Detail data loaded and hydrated", {
      studentId,
      programType,
      historyCount,
      tasmiCount,
    });
  }, [historyCount, programType, studentId, tasmiCount]);

  return null;
}
