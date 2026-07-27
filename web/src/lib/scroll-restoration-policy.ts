const DETAIL_PREFIXES = [
  "/students/",
  "/formative/",
  "/summative/",
  "/admin/students/",
] as const;

function isStudentDetailPanel(pathname: string): boolean {
  if (!pathname.startsWith("/students/")) return false;
  const studentId = pathname.slice("/students/".length);
  return studentId.length > 0 && !studentId.includes("/");
}

export function isSupportedDetailPanel(pathname: string): boolean {
  return DETAIL_PREFIXES.some((prefix) => {
    if (!pathname.startsWith(prefix)) return false;
    const routeParameter = pathname.slice(prefix.length);
    return routeParameter.length > 0 && !routeParameter.includes("/");
  });
}

/**
 * Build the storage identity for a restorable panel.
 *
 * Student Detail data and layout are keyed by the student id in the pathname.
 * Its query string only carries navigation provenance (`grade`, list filters,
 * `returnTo`, `programType`) or one-shot feedback/highlight state. Treating
 * those values as part of the panel identity makes the first list -> detail
 * visit differ from the canonical detail URL used by workflow Cancel links.
 */
export function scrollRouteIdentity(
  pathname: string,
  queryString: string,
): string {
  if (isStudentDetailPanel(pathname)) {
    return pathname;
  }

  const params = new URLSearchParams(queryString);
  params.delete("dashboardShortcut");
  if (pathname === "/") {
    params.delete("programType");
  }
  params.sort();
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function shouldConsumeScrollRestoreFlag(
  viaApprovedNavigation: boolean,
  incomingRouteIsRestorable: boolean,
): boolean {
  return viaApprovedNavigation && incomingRouteIsRestorable;
}
