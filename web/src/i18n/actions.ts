"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const VALID_LOCALES = new Set(["id", "en", "ar"]);

export async function setLocale(locale: string) {
  if (!VALID_LOCALES.has(locale)) return;
  const store = await cookies();
  store.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
}
