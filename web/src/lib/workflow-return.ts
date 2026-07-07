export function samePageReturnQuery(
  href: string,
  currentHref: string,
  origin: string,
  pathname: string,
): string | null {
  try {
    const destination = new URL(href, currentHref);
    const rawReturnTo = destination.searchParams.get("returnTo");
    if (!rawReturnTo) return null;

    const returnTo = new URL(rawReturnTo, origin);
    if (returnTo.origin !== origin || returnTo.pathname !== pathname) {
      return null;
    }

    return returnTo.search;
  } catch {
    return null;
  }
}

export function normalizeQuery(query: string): string {
  return query.startsWith("?") ? query.slice(1) : query;
}
