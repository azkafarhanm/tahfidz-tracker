"use client";

import { useEffect } from "react";

type FilterPreferenceSyncProps = {
  cookieName: string;
  value: string;
};

export default function FilterPreferenceSync({
  cookieName,
  value,
}: FilterPreferenceSyncProps) {
  useEffect(() => {
    document.cookie = `${cookieName}=${encodeURIComponent(
      value,
    )}; Path=/; Max-Age=2592000; SameSite=Lax`;
  }, [cookieName, value]);

  return null;
}
