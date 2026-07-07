"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { changeEmail } from "./actions";
import CharacterCounter from "@/components/CharacterCounter";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { markServerActionReturn } from "@/hooks/usePanelScrollRestoration";
import { backLink } from "@/lib/colors";

export default function ChangeEmailPage() {
  const t = useTranslations("ChangeEmail");
  const tc = useTranslations("CharacterCounter");
  const [isPending, startTransition] = useTransition();
  const [newEmailLen, setNewEmailLen] = useState(0);
  const [confirmEmailLen, setConfirmEmailLen] = useState(0);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <WorkflowContextLink
            className={backLink}
            href="/profile"
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backLink")}
          </WorkflowContextLink>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <Mail aria-hidden="true" size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
                {t("heading")}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("description")}
              </p>
            </div>
          </div>
        </header>

        <form
          action={(formData) => {
            markServerActionReturn();
            startTransition(async () => {
              await changeEmail(formData);
            });
          }}
          className="mt-6 space-y-4"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("currentPassword")}
              </span>
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
                id="currentPassword"
                name="currentPassword"
                required
                type="password"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("newEmail")}
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
                id="newEmail"
                maxLength={120}
                name="newEmail"
                onChange={(e) => setNewEmailLen(e.target.value.length)}
                placeholder="guru@tahfidzflow.local"
                required
                type="email"
              />
              <CharacterCounter current={newEmailLen} max={120} maxReachedLabel={tc("maxReached")} />
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("confirmEmail")}
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:shadow-none dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
                id="confirmEmail"
                maxLength={120}
                name="confirmEmail"
                onChange={(e) => setConfirmEmailLen(e.target.value.length)}
                placeholder="guru@tahfidzflow.local"
                required
                type="email"
              />
              <CharacterCounter current={confirmEmailLen} max={120} maxReachedLabel={tc("maxReached")} />
            </label>
          </section>

          <section className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("helper")}
              </p>
            </div>
          </section>

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
