"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { markPrimaryNavigation } from "@/hooks/usePanelScrollRestoration";
import {
  markNavigationContext,
  markScopedNavigationContext,
  mergeVisibleSearchFormContext,
  readScopedNavigationContext,
} from "@/hooks/useNavigationContext";

type StudentStatus = "active" | "inactive";

type StudentsStatusTabsProps = {
  activeLabel: string;
  currentStatus: StudentStatus;
  dashboardShortcut?: string;
  inactiveLabel: string;
  programType: string;
  returnToProfile?: boolean;
};

const WORKSPACE_SCOPE_KEY = "studentsWorkspace";
const WORKSPACE_PARAMS = ["q", "page", "grade"];

function workspaceValue(programType: string, status: StudentStatus) {
  return `${programType}:${status}`;
}

function tabClassName(isActive: boolean) {
  return `inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
    isActive
      ? "bg-emerald-900 text-white"
      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;
}

export default function StudentsStatusTabs({
  activeLabel,
  currentStatus,
  dashboardShortcut,
  inactiveLabel,
  programType,
  returnToProfile = false,
}: StudentsStatusTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();

  const buildHref = useCallback((status: StudentStatus) => {
    const params = new URLSearchParams();
    if (status === "inactive") params.set("status", "inactive");
    if (programType) params.set("programType", programType);
    if (dashboardShortcut) params.set("dashboardShortcut", dashboardShortcut);
    if (returnToProfile) params.set("returnTo", "profile");

    const storedContext = readScopedNavigationContext(
      pathname,
      WORKSPACE_SCOPE_KEY,
      workspaceValue(programType, status),
    );
    const storedParams = storedContext
      ? new URLSearchParams(storedContext)
      : null;

    for (const key of WORKSPACE_PARAMS) {
      const value = storedParams?.get(key);
      if (value) params.set(key, value);
    }

    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [dashboardShortcut, pathname, programType, returnToProfile]);

  const activeHref = buildHref("active");
  const inactiveHref = buildHref("inactive");
  const prefetchHrefs = useMemo(
    () => [activeHref, inactiveHref],
    [activeHref, inactiveHref],
  );

  useEffect(() => {
    for (const href of prefetchHrefs) {
      router.prefetch(href);
    }
  }, [prefetchHrefs, router]);

  function saveCurrentWorkspace() {
    const outgoingParams = new URLSearchParams(
      mergeVisibleSearchFormContext(searchParamString),
    );
    const scopedParams = new URLSearchParams();
    for (const key of WORKSPACE_PARAMS) {
      const value = outgoingParams.get(key);
      if (value) scopedParams.set(key, value);
    }

    markScopedNavigationContext(
      pathname,
      WORKSPACE_SCOPE_KEY,
      workspaceValue(programType, currentStatus),
      scopedParams.toString(),
    );
    markPrimaryNavigation(pathname, outgoingParams.toString());
    markNavigationContext(pathname, outgoingParams.toString());
  }

  return (
    <div className="mt-5 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <Link
        className={tabClassName(currentStatus === "active")}
        href={activeHref}
        onClick={saveCurrentWorkspace}
        scroll={false}
      >
        {activeLabel}
      </Link>
      <Link
        className={tabClassName(currentStatus === "inactive")}
        href={inactiveHref}
        onClick={saveCurrentWorkspace}
        scroll={false}
      >
        {inactiveLabel}
      </Link>
    </div>
  );
}
