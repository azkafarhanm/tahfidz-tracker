"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, UserCircle } from "lucide-react";
import { changeUsername } from "./actions";
import CharacterCounter from "@/components/CharacterCounter";
import { backLink } from "@/lib/colors";

export default function ChangeUsernamePage() {
  const t = useTranslations("ChangeUsername");
  const tc = useTranslations("CharacterCounter");
  const [isPending, startTransition] = useTransition();
  const [newUsernameLen, setNewUsernameLen] = useState(0);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link className={backLink} href="/profile">
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backLink")}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <UserCircle aria-hidden="true" size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{t("heading")}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("description")}
              </p>
            </div>
          </div>
        </header>
        <form
          className="mt-5 space-y-4"
          action={(formData) => {
            startTransition(async () => {
              await changeUsername(formData);
            });
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="newUsername">
              {t("newUsername")}
            </label>
            <input
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
              id="newUsername"
              maxLength={50}
              minLength={4}
              name="newUsername"
              onChange={(e) => {
                setNewUsernameLen(e.target.value.length);
              }}
              placeholder=""
              required
              type="text"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("helperText")}
            </p>
            <CharacterCounter current={newUsernameLen} max={50} maxReachedLabel={tc("maxReached")} />
          </div>

          <button
            className="w-full rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-950 disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? t("saving") : t("submit")}
          </button>
        </form>
      </section>
    </main>
  );
}
