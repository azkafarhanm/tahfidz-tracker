"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  markNavigationContext,
  readNavigationContext,
} from "@/hooks/useNavigationContext";

type LiveSearchFormProps = {
  action: string;
  buttonLabel: string;
  className: string;
  defaultValue?: string;
  debounceMs?: number;
  inputClassName: string;
  placeholder: string;
};

type LocalNavigationIntent = {
  epoch: number;
  query: string;
  revision: number;
  token: number;
};

function normalizeQuery(value: string): string {
  return value.trim();
}

export default function LiveSearchForm({
  action,
  buttonLabel,
  className,
  defaultValue = "",
  debounceMs = 250,
  inputClassName,
  placeholder,
}: LiveSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [draftQuery, setDraftQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const committedQuery = normalizeQuery(defaultValue);
  const committedQueryRef = useRef(committedQuery);
  const debounceTimerRef = useRef<number | null>(null);
  const editRevisionRef = useRef(0);
  const lastSentRevisionRef = useRef(0);
  const lastConfirmedRevisionRef = useRef(0);
  const nextNavigationTokenRef = useRef(0);
  const localIntentsRef = useRef<Map<number, LocalNavigationIntent>>(new Map());
  const navigationEpochRef = useRef(0);
  const externalNavigationPendingRef = useRef(false);
  const externalNavigationQueryRef = useRef<string | null>(null);
  const externalNavigationRevisionRef = useRef(0);
  const lastSeenCommittedQueryRef = useRef(committedQuery);
  const searchOriginCapturedRef = useRef(false);

  const buildHref = useCallback((nextQuery: string) => {
    const url = new URL(action, window.location.origin);
    if (nextQuery) {
      url.searchParams.set("q", nextQuery);
    } else {
      // Keep an explicit empty query so production prefetching uses a
      // query-specific cache entry instead of stale pathname-only search data.
      url.searchParams.set("q", "");
      if (searchOriginCapturedRef.current) {
        const origin = readNavigationContext(pathname);
        const originPage = origin
          ? new URLSearchParams(origin).get("page")
          : null;
        if (originPage) url.searchParams.set("page", originPage);
      }
    }
    const search = url.searchParams.toString();
    return search ? `${url.pathname}?${search}` : url.pathname;
  }, [action, pathname]);

  const sendLocalNavigation = useCallback((
    nextQuery: string,
    revision: number,
    epoch: number,
  ) => {
    if (
      revision !== editRevisionRef.current ||
      epoch !== navigationEpochRef.current
    ) {
      return;
    }

    // A local navigation started after popstate is now the authoritative intent.
    externalNavigationPendingRef.current = false;
    externalNavigationQueryRef.current = null;

    const token = ++nextNavigationTokenRef.current;
    localIntentsRef.current.set(token, {
      epoch,
      query: nextQuery,
      revision,
      token,
    });
    lastSentRevisionRef.current = Math.max(
      lastSentRevisionRef.current,
      revision,
    );

    if (!committedQueryRef.current && nextQuery) {
      const originParams = new URLSearchParams(window.location.search);
      originParams.delete("q");
      markNavigationContext(pathname, originParams.toString());
      searchOriginCapturedRef.current = true;
    }

    const nextHref = buildHref(nextQuery);
    router.prefetch(nextHref);
    startTransition(() => {
      router.replace(nextHref, { scroll: false });
    });
  }, [buildHref, pathname, router]);

  useEffect(() => {
    const handlePopState = () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      navigationEpochRef.current += 1;
      localIntentsRef.current.clear();

      const nextQuery = new URL(window.location.href).searchParams.get("q") ?? "";
      const normalizedQuery = normalizeQuery(nextQuery);
      const nextRevision = editRevisionRef.current + 1;

      editRevisionRef.current = nextRevision;
      lastSentRevisionRef.current = nextRevision;
      lastConfirmedRevisionRef.current = nextRevision;
      externalNavigationRevisionRef.current = nextRevision;
      externalNavigationQueryRef.current = normalizedQuery;
      externalNavigationPendingRef.current =
        normalizedQuery !== committedQueryRef.current;
      committedQueryRef.current = normalizedQuery;
      lastSeenCommittedQueryRef.current = normalizedQuery;
      setDraftQuery(nextQuery);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (externalNavigationPendingRef.current) {
      if (committedQuery !== externalNavigationQueryRef.current) {
        return;
      }

      externalNavigationPendingRef.current = false;
      externalNavigationQueryRef.current = null;
      committedQueryRef.current = committedQuery;
      lastSeenCommittedQueryRef.current = committedQuery;

      if (editRevisionRef.current === externalNavigationRevisionRef.current) {
        setDraftQuery(defaultValue);
      }
      return;
    }

    committedQueryRef.current = committedQuery;
    if (committedQuery === lastSeenCommittedQueryRef.current) {
      return;
    }

    lastSeenCommittedQueryRef.current = committedQuery;

    const matchingIntent = Array.from(localIntentsRef.current.values())
      .filter(
        (intent) =>
          intent.epoch === navigationEpochRef.current &&
          intent.query === committedQuery,
      )
      .sort((left, right) => right.token - left.token)[0];

    if (matchingIntent) {
      lastConfirmedRevisionRef.current = Math.max(
        lastConfirmedRevisionRef.current,
        matchingIntent.revision,
      );

      for (const [token, intent] of localIntentsRef.current) {
        if (
          intent.epoch === matchingIntent.epoch &&
          intent.query === matchingIntent.query &&
          token <= matchingIntent.token
        ) {
          localIntentsRef.current.delete(token);
        }
      }

      // A confirmation may canonicalize the draft only if no newer edit exists.
      if (editRevisionRef.current === matchingIntent.revision) {
        setDraftQuery(defaultValue);
      }
      return;
    }

    // A committed query without a local intent came from outside this search.
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    navigationEpochRef.current += 1;
    localIntentsRef.current.clear();

    const nextRevision = editRevisionRef.current + 1;
    editRevisionRef.current = nextRevision;
    lastSentRevisionRef.current = nextRevision;
    lastConfirmedRevisionRef.current = nextRevision;
    setDraftQuery(defaultValue);
  }, [committedQuery, defaultValue]);

  useEffect(() => {
    const nextQuery = normalizeQuery(draftQuery);
    const capturedRevision = editRevisionRef.current;
    const capturedEpoch = navigationEpochRef.current;

    if (nextQuery === committedQueryRef.current) {
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      if (nextQuery === committedQueryRef.current) {
        return;
      }
      sendLocalNavigation(nextQuery, capturedRevision, capturedEpoch);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [debounceMs, draftQuery, sendLocalNavigation]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    sendLocalNavigation(
      normalizeQuery(draftQuery),
      editRevisionRef.current,
      navigationEpochRef.current,
    );
  };

  return (
    <form
      action={action}
      autoComplete="off"
      className={className}
      onSubmit={handleSubmit}
      role="search"
    >
      <Search aria-hidden="true" size={18} strokeWidth={2.2} />
      <input
        aria-label={placeholder}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className={inputClassName}
        enterKeyHint="search"
        name="q"
        onChange={(event) => {
          editRevisionRef.current += 1;
          setDraftQuery(event.target.value);
        }}
        placeholder={placeholder}
        spellCheck={false}
        type="search"
        value={draftQuery}
      />
      <button
        aria-busy={isPending}
        className="rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
