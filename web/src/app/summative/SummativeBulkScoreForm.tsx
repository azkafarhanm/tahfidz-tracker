"use client";

import { CircleCheck, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import DeviceDateTimeFields from "@/components/DeviceDateTimeFields";
import SurahInput from "@/components/SurahInput";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { Semester } from "@/generated/prisma-next/enums";
import { markServerActionReturn } from "@/hooks/usePanelScrollRestoration";
import NumericScoreInput from "@/components/NumericScoreInput";
import type {
  ExistingSummativeScore,
  SummativeInputTargetGroup,
} from "@/lib/summative";

type SummativeBulkScoreFormProps = {
  action: (formData: FormData) => Promise<void>;
  academicYear: string;
  cancelHref: string;
  defaultSemester: Semester;
  enableAdditionalMemorization?: boolean;
  existingScores: ExistingSummativeScore[];
  returnTo?: string;
  studentId: string;
  targetGroups: SummativeInputTargetGroup[];
};

export default function SummativeBulkScoreForm({
  action,
  academicYear,
  cancelHref,
  defaultSemester,
  enableAdditionalMemorization = false,
  existingScores,
  returnTo,
  studentId,
  targetGroups,
}: SummativeBulkScoreFormProps) {
  const t = useTranslations("Summative");
  const [additionalRows, setAdditionalRows] = useState([0]);
  const [enteredScoreKeys, setEnteredScoreKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [changedSurahIds, setChangedSurahIds] = useState<Set<string>>(
    () => new Set(),
  );
  const scoreBySurahId = useMemo(
    () => new Map(existingScores.map((score) => [score.surahId, score.score])),
    [existingScores],
  );
  const savedScoreSurahIds = useMemo(
    () => new Set(existingScores.map((score) => score.surahId)),
    [existingScores],
  );
  const updateEnteredScore = (key: string, value: string) => {
    setEnteredScoreKeys((current) => {
      const next = new Set(current);
      if (value === "") {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  const updateChangedSurahIds = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const next = new Set<string>();

    for (const group of targetGroups) {
      for (const target of group.targets) {
        const input = form.elements.namedItem(`score:${target.surahId}`);
        if (
          input instanceof HTMLInputElement &&
          input.value !== String(scoreBySurahId.get(target.surahId) ?? "")
        ) {
          next.add(target.surahId);
        }
      }

      for (const choice of group.choices ?? []) {
        const initialOption =
          choice.options.find((option) => scoreBySurahId.has(option.surahId)) ??
          choice.options[0];
        const select = form.elements.namedItem(`choice:${choice.id}`);
        const input = form.elements.namedItem(`choiceScore:${choice.id}`);
        if (!(select instanceof HTMLSelectElement) || !(input instanceof HTMLInputElement)) {
          continue;
        }

        const initialSurahId = initialOption?.surahId ?? "";
        const initialScore = String(
          initialOption ? scoreBySurahId.get(initialOption.surahId) ?? "" : "",
        );
        if (
          select.value !== initialSurahId ||
          input.value !== initialScore
        ) {
          next.add(select.value);
        }
      }
    }

    setChangedSurahIds(next);
  };

  return (
    <form
      action={action}
      className="space-y-5"
      onChange={updateChangedSurahIds}
      onSubmit={() => markServerActionReturn()}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="academicYear" value={academicYear} />
      <input type="hidden" name="semester" value={defaultSemester} />
      {[...changedSurahIds].map((surahId) => (
        <input
          key={surahId}
          type="hidden"
          name="changedSurahId"
          value={surahId}
        />
      ))}
      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("semesterLabel")}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
              {defaultSemester === Semester.GANJIL ? t("ganjil") : t("genap")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("academicYearLabel")}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
              {academicYear}
            </p>
          </div>
          <div className="sm:col-span-3">
            <DeviceDateTimeFields
              dateLabel={t("dateLabel")}
              timeLabel={t("timeLabel")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t("targetInputHeading")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("targetInputDescription")}
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {targetGroups.map((group) => (
            <div key={group.label} className="px-5 py-5 sm:px-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-300">
                {group.label}
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.targets.map((target) => {
                  const isHighlighted =
                    savedScoreSurahIds.has(target.surahId) ||
                    enteredScoreKeys.has(target.surahId);

                  return (
                    <label
                      className={`grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-3 rounded-2xl border px-3.5 py-3 ${
                        isHighlighted
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70"
                      }`}
                      key={target.surahId}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-950 dark:text-white">
                          <span className="truncate">{target.name}</span>
                          {isHighlighted ? (
                            <CircleCheck
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                            />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {target.number} - {target.totalAyahs} ayat
                        </span>
                      </span>
                      <NumericScoreInput
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        defaultValue={scoreBySurahId.get(target.surahId) ?? ""}
                        name={`score:${target.surahId}`}
                        onChange={(event) => {
                          updateEnteredScore(target.surahId, event.target.value);
                        }}
                        placeholder={t("scoreInputPlaceholder")}
                      />
                    </label>
                  );
                })}
                {group.choices?.map((choice) => {
                  const selectedOption =
                    choice.options.find((option) => scoreBySurahId.has(option.surahId)) ??
                    choice.options[0];
                  const isHighlighted =
                    choice.options.some((option) =>
                      savedScoreSurahIds.has(option.surahId),
                    ) || enteredScoreKeys.has(choice.id);

                  return (
                    <div
                      className={`grid gap-3 rounded-2xl border px-3.5 py-3 sm:grid-cols-[minmax(0,1fr)_6.5rem] ${
                        isHighlighted
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70"
                      }`}
                      key={choice.id}
                    >
                      <div className="min-w-0">
                        <label
                          className="flex items-center gap-1.5 text-sm font-semibold text-slate-950 dark:text-white"
                          htmlFor={`choice:${choice.id}`}
                        >
                          <span className="truncate">{choice.label}</span>
                          {isHighlighted ? (
                            <CircleCheck
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                            />
                          ) : null}
                        </label>
                        <select
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          defaultValue={selectedOption?.surahId}
                          id={`choice:${choice.id}`}
                          name={`choice:${choice.id}`}
                        >
                          {choice.options.map((option) => (
                            <option key={option.surahId} value={option.surahId}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="self-end">
                        <span className="sr-only">{t("scoreLabel")}</span>
                        <NumericScoreInput
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          defaultValue={
                            selectedOption
                              ? scoreBySurahId.get(selectedOption.surahId) ?? ""
                              : ""
                          }
                          name={`choiceScore:${choice.id}`}
                          onChange={(event) => {
                            updateEnteredScore(choice.id, event.target.value);
                          }}
                          placeholder={t("scoreInputPlaceholder")}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {enableAdditionalMemorization ? (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t("additionalMemorizationHeading")}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("additionalMemorizationDescription")}
              </p>
            </div>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
              onClick={() =>
                setAdditionalRows((rows) => [...rows, Math.max(...rows) + 1])
              }
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t("addAdditionalSurahButton")}
            </button>
          </div>

          <div className="grid gap-3 px-5 py-5 sm:px-6">
            {additionalRows.map((rowId) => (
              <div
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/70 sm:grid-cols-[minmax(0,1fr)_6.5rem_2.75rem]"
                key={rowId}
              >
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    htmlFor={`additional-surah-${rowId}`}
                  >
                    {t("surahLabel")}
                  </label>
                  <SurahInput
                    id={`additional-surah-${rowId}`}
                    name={`additionalSurah:${rowId}`}
                    required={false}
                  />
                </div>
                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("scoreLabel")}
                  </span>
                  <NumericScoreInput
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    name={`additionalScore:${rowId}`}
                    placeholder={t("scoreInputPlaceholder")}
                  />
                </label>
                <button
                  aria-label={t("removeAdditionalSurahButton")}
                  className="inline-grid h-11 w-11 place-items-center self-end rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-red-800 dark:hover:text-red-400"
                  disabled={additionalRows.length === 1}
                  onClick={() =>
                    setAdditionalRows((rows) => rows.filter((id) => id !== rowId))
                  }
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <WorkflowContextLink
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          href={cancelHref}
        >
          {t("cancelButton")}
        </WorkflowContextLink>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("Summative");

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        <Save aria-hidden="true" className="h-4 w-4" />
      )}
      {pending ? t("savingButton") : t("saveAllButton")}
    </button>
  );
}
