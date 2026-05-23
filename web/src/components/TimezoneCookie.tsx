"use client";

import { useEffect } from "react";

export default function TimezoneCookie() {
  useEffect(() => {
    document.cookie = `tz-offset=${new Date().getTimezoneOffset()};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  }, []);
  return null;
}
