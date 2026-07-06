"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Hash,
  Loader2,
  PenLine,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import SurahInput from "@/components/SurahInput";
import InitialsAvatar from "@/components/InitialsAvatar";
import { DeviceDateTimeHiddenFields } from "@/components/DeviceDateTimeFields";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { RecentActivityItem } from "@/lib/quick-log";
import { badge, backLink } from "@/lib/colors";
import PanelScrollLink from "@/components/PanelScrollLink";

type Student = {
  id: string;
  fullName: string;
  classSummary: string;
};

type ActionResult =
  | { ok: true; success: string }
  | { ok: false; error: string };

type GuidedQuickLogProps = {
  action: (formData: FormData) => Promise<ActionResult>;
  students: Student[];
  recentItems: RecentActivityItem[];
  programBadge?: React.ReactNode;
  programSelector?: React.ReactNode;
};

function formatRelativeTime(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "justNow";
  if (diffMin < 60) return diffMin === 1 ? "1m" : `${diffMin}m`;
  if (diffHour < 24) return diffHour === 1 ? "1h" : `${diffHour}h`;
  return diffDay === 1 ? "1d" : `${diffDay}d`;
}

function formatAyahRange(from: number, to: number): string {
  return from === to ? `${from}` : `${from}-${to}`;
}

export default function GuidedQuickLog({
  action,
  students,
  recentItems,
  programBadge,
  programSelector,
}: GuidedQuickLogProps) {
  const t = useTranslations("QuickLog");
  const searchParams = useSearchParams();
  const programType = searchParams.get("programType");
  const dashboardHref = programType ? `/?programType=${programType}` : "/";

  const statusOptions = [
    { value: "LANCAR", label: t("statusLancar") },
    { value: "CUKUP", label: t("statusCukup") },
    { value: "PERLU_MUROJAAH", label: t("statusPerluMurojaah") },
  ];

  const typeOptions = [
    { value: "HAFALAN", label: t("typeHafalan") },
    { value: "MUROJAAH", label: t("typeMurojaah") },
  ];

  const [result, submitAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    { ok: true, success: "" },
  );
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [recordType, setRecordType] = useState("HAFALAN");
  const [fromAyah, setFromAyah] = useState("");
  const [toAyah, setToAyah] = useState("");
  const [status, setStatus] = useState("CUKUP");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [surahInputKey, setSurahInputKey] = useState(0);
  const studentListboxId = "quick-log-student-listbox";

  const [activityExpanded, setActivityExpanded] = useState(false);
  const [expandTrigger, setExpandTrigger] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (result.ok && result.success) {
      toast.success(result.success);
      handleReset();
      setExpandTrigger((n) => n + 1);
    }
    if (!result.ok && result.error) {
      toast.error(result.error);
    }
  }, [result]);

  useEffect(() => {
    if (expandTrigger > 0) {
      setActivityExpanded(true);
    }
  }, [expandTrigger]);

  const filtered = query.length > 0
    ? students.filter((s) =>
        s.fullName.toLowerCase().includes(query.toLowerCase()),
      )
    : students;

  const canSubmit =
    selectedStudent &&
    fromAyah &&
    toAyah &&
    Number(fromAyah) > 0 &&
    Number(toAyah) >= Number(fromAyah);

  function handleSelectStudent(student: Student) {
    setSelectedStudent(student);
    setQuery("");
    setShowDropdown(false);
  }

  function handleClearStudent() {
    setSelectedStudent(null);
    setQuery("");
  }

  function handleReset() {
    formRef.current?.reset();
    setSelectedStudent(null);
    setQuery("");
    setShowDropdown(false);
    setRecordType("HAFALAN");
    setFromAyah("");
    setToAyah("");
    setStatus("CUKUP");
    setScore("");
    setNotes("");
    setSurahInputKey((value) => value + 1);
  }

  const now = new Date();

  return (
    <>
     <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
             <PanelScrollLink
               className={backLink}
               href={dashboardHref}
             >
               <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
               {t("backLink")}
             </PanelScrollLink>
             <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
               {t("heading")}
             </h1>
             <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
               {t("description")}
             </p>
              {programBadge && (
                <div className="mt-2">
                  {programBadge}
                </div>
              )}
              {programSelector && (
                <div className="mt-2">
                  {programSelector}
                </div>
              )}
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <PenLine aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>
        <form action={submitAction} ref={formRef} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <Search
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("studentSection")}</h2>
            </div>

            {selectedStudent ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-3 dark:border-emerald-400 dark:bg-emerald-950">
                <div className="flex items-center gap-3 min-w-0">
                   <InitialsAvatar name={selectedStudent.fullName} />
                   <div className="min-w-0">
                     <p className="truncate font-semibold text-slate-950 dark:text-white">
                       {selectedStudent.fullName}
                     </p>
                     <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                       {selectedStudent.classSummary}
                     </p>
                   </div>
                 </div>
                <button
                  aria-label={t("clearSelectedStudent")}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-emerald-100 hover:text-slate-700 dark:hover:bg-emerald-900 dark:hover:text-slate-300"
                  onClick={handleClearStudent}
                  type="button"
                >
                  <X aria-hidden="true" size={16} strokeWidth={2.2} />
                </button>
              </div>
            ) : (
              <div className="relative mt-4" ref={wrapperRef}>
                <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900">
                  <Search
                    aria-hidden="true"
                    className="shrink-0 text-slate-400 dark:text-slate-500"
                    size={17}
                    strokeWidth={2.2}
                  />
                  <input
                    autoComplete="off"
                    aria-label={t("searchStudentPlaceholder")}
                    aria-autocomplete="list"
                    aria-controls={studentListboxId}
                    aria-expanded={showDropdown}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                    name="studentSearch"
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={t("searchStudentPlaceholder")}
                    role="combobox"
                    type="text"
                    value={query}
                  />
                </div>

                {showDropdown && filtered.length > 0 ? (
                  <div
                    className="absolute inset-x-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                    id={studentListboxId}
                    role="listbox"
                  >
                    {filtered.map((s) => (
                       <button
                         aria-selected={false}
                         className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-emerald-50 dark:hover:bg-slate-800"
                         key={s.id}
                         onClick={() => handleSelectStudent(s)}
                         role="option"
                         type="button"
                       >
                         <InitialsAvatar name={s.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                            {s.fullName}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {s.classSummary}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : showDropdown && query.length > 0 && filtered.length === 0 ? (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    {t("noStudentFound")} &quot;{query}&quot;
                  </div>
                ) : null}
              </div>
            )}

            <input name="studentId" type="hidden" value={selectedStudent?.id ?? ""} />
          </section>

          {selectedStudent ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <h2 className="font-semibold">{t("recordTypeSection")}</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      aria-pressed={recordType === opt.value}
                      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center text-sm font-bold transition active:scale-[0.97] ${
                        recordType === opt.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-200 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-900"
                          : "border-slate-200 bg-white text-slate-950 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50"
                      }`}
                      key={opt.value}
                      onClick={() => setRecordType(opt.value)}
                      type="button"
                    >
                      {opt.value === "HAFALAN" ? (
                        <BookOpen aria-hidden="true" size={16} strokeWidth={2.2} />
                      ) : (
                        <RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input name="type" type="hidden" value={recordType} />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <h2 className="font-semibold">{t("materialSection")}</h2>

                <label className="mt-4 block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("surahLabel")}
                  </span>
                  <div className="mt-2">
                    <SurahInput key={surahInputKey} />
                  </div>
                </label>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("fromAyahLabel")}
                    </span>
                    <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900">
                      <Hash
                        aria-hidden="true"
                        className="shrink-0 text-slate-400 dark:text-slate-500"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                        max={286}
                        min={1}
                        name="fromAyah"
                        onChange={(e) => setFromAyah(e.target.value)}
                        placeholder="1"
                        required
                        type="number"
                        value={fromAyah}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("toAyahLabel")}
                    </span>
                    <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900">
                      <Hash
                        aria-hidden="true"
                        className="shrink-0 text-slate-400 dark:text-slate-500"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                        max={286}
                        min={1}
                        name="toAyah"
                        onChange={(e) => setToAyah(e.target.value)}
                        placeholder="10"
                        required
                        type="number"
                        value={toAyah}
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <h2 className="font-semibold">{t("assessmentSection")}</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("statusLabel")}
                    </span>
                    <select
                      className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                      name="status"
                      onChange={(e) => setStatus(e.target.value)}
                      value={status}
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("scoreLabel")}
                    </span>
                    <input
                      className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                      max={100}
                      min={0}
                      name="score"
                      onChange={(e) => setScore(e.target.value)}
                      placeholder={t("optionalPlaceholder")}
                      type="number"
                      value={score}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("notesLabel")}
                  </span>
                  <textarea
                    className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                    name="notes"
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("optionalPlaceholder")}
                    value={notes}
                  />
                </label>
              </section>

              <DeviceDateTimeHiddenFields />

              <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                <button
                  className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  onClick={handleReset}
                  type="button"
                >
                  {t("cancelButton")}
                </button>
                <QuickLogSubmitButton
                  canSubmit={Boolean(canSubmit)}
                  idleLabel={t("saveButton")}
                  pendingLabel={t("savingButton")}
                  isPending={isPending}
                />
              </div>
            </>
          ) : (
            <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400">
              {t("selectStudentPrompt")}
            </div>
          )}
        </form>

        {recentItems.length > 0 ? (
          <section className="mt-6">
            <button
              className="flex w-full items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"
              onClick={() => setActivityExpanded((v) => !v)}
              type="button"
            >
              <span>{t("recentActivityTitle")}</span>
              <span className={`rounded-full ${badge.neutral} px-2 py-0.5 text-[11px] font-medium`}>
                {recentItems.length}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`ml-auto text-slate-400 transition-transform duration-200 dark:text-slate-500 ${activityExpanded ? "rotate-180" : ""}`}
                size={16}
                strokeWidth={2.2}
              />
            </button>
            {activityExpanded ? (
              <ul className="mt-3 space-y-2">
                {recentItems.map((item) => (
                  <RecentActivityItemRow key={`${item.type}-${item.recordId}`} item={item} now={now} />
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
    </>
   );
}

function RecentActivityItemRow({ item, now }: { item: RecentActivityItem; now: Date }) {
  const t = useTranslations("QuickLog");
  const Icon = item.type === "HAFALAN" ? BookOpen : RotateCcw;
  const typeLabel = item.type === "HAFALAN" ? t("typeHafalan") : t("typeMurojaah");
  const relativeKey = formatRelativeTime(item.date, now);
  const relativeLabel = relativeKey === "justNow"
    ? t("relativeJustNow")
    : relativeKey.endsWith("m")
      ? t("relativeMinutesAgo", { count: parseInt(relativeKey) })
      : relativeKey.endsWith("h")
        ? t("relativeHoursAgo", { count: parseInt(relativeKey) })
        : t("relativeDaysAgo", { count: parseInt(relativeKey) });
  const href = `/students/${item.studentId}?highlight=${item.recordId}`;

  return (
    <li>
      <Link
        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 active:bg-black/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50 dark:active:bg-white/10"
        href={href}
        scroll={false}
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${badge.success}`}>
          <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            {item.studentName}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {typeLabel} &middot; {item.surah} {formatAyahRange(item.fromAyah, item.toAyah)}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`rounded-full ${badge.success} px-2 py-0.5 text-[11px] font-semibold leading-tight`}>
              {item.status}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {relativeLabel}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function QuickLogSubmitButton({
  canSubmit,
  idleLabel,
  pendingLabel,
  isPending,
}: {
  canSubmit: boolean;
  idleLabel: string;
  pendingLabel: string;
  isPending: boolean;
}) {
  return (
    <button
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:opacity-60"
      disabled={!canSubmit || isPending}
      type="submit"
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="animate-spin" size={17} />
      ) : null}
      {isPending ? pendingLabel : idleLabel}
    </button>
  );
}
