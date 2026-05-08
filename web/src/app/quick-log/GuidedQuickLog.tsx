"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Hash,
  Loader2,
  PenLine,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import SurahInput from "@/components/SurahInput";

type Student = {
  id: string;
  fullName: string;
  classSummary: string;
};

type GuidedQuickLogProps = {
  action: (formData: FormData) => Promise<void>;
  students: Student[];
  todayDate: string;
  nowTime: string;
  error?: string;
  success?: string;
};

const statusOptions = [
  { value: "LANCAR", label: "Lancar" },
  { value: "CUKUP", label: "Cukup" },
  { value: "PERLU_MUROJAAH", label: "Perlu murojaah" },
];

const typeOptions = [
  { value: "HAFALAN", label: "Hafalan" },
  { value: "MUROJAAH", label: "Murojaah" },
];

export default function GuidedQuickLog({
  action,
  students,
  todayDate,
  nowTime,
  error,
  success,
}: GuidedQuickLogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [recordType, setRecordType] = useState("HAFALAN");
  const [fromAyah, setFromAyah] = useState("");
  const [toAyah, setToAyah] = useState("");
  const [status, setStatus] = useState("LANCAR");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");

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

  function handleSubmit() {
    if (!formRef.current || !canSubmit) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("NEXT_REDIRECT")) {
          router.refresh();
          return;
        }
      }
    });
  }

  function handleCancel() {
    setSelectedStudent(null);
    setRecordType("HAFALAN");
    setFromAyah("");
    setToAyah("");
    setStatus("LANCAR");
    setScore("");
    setNotes("");
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
         <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              Catat Cepat
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Pilih santri, isi data hafalan/murojaah.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <PenLine aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
            {success}
          </div>
        ) : null}

        <form ref={formRef} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <Search
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Pilih Santri</h2>
            </div>

            {selectedStudent ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-3 dark:border-emerald-400 dark:bg-emerald-950">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950 dark:text-white">
                    {selectedStudent.fullName}
                  </p>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                    {selectedStudent.classSummary}
                  </p>
                </div>
                <button
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
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                    name="studentSearch"
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Ketik nama santri..."
                    type="text"
                    value={query}
                  />
                </div>

                {showDropdown && filtered.length > 0 ? (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {filtered.map((s) => (
                      <button
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-emerald-50 dark:hover:bg-slate-800"
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        type="button"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          {s.fullName
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")}
                        </div>
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
                    Tidak ada santri dengan nama &quot;{query}&quot;
                  </div>
                ) : null}
              </div>
            )}

            <input name="studentId" type="hidden" value={selectedStudent?.id ?? ""} />
          </section>

          {selectedStudent ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <h2 className="font-semibold">Jenis Catatan</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {typeOptions.map((t) => (
                    <button
                      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center text-sm font-bold transition active:scale-[0.97] ${
                        recordType === t.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-200 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-900"
                          : "border-slate-200 bg-white text-slate-950 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50"
                      }`}
                      key={t.value}
                      onClick={() => setRecordType(t.value)}
                      type="button"
                    >
                      {t.value === "HAFALAN" ? (
                        <BookOpen aria-hidden="true" size={16} strokeWidth={2.2} />
                      ) : (
                        <RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />
                      )}
                      {t.label}
                    </button>
                  ))}
                </div>
                <input name="type" type="hidden" value={recordType} />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <h2 className="font-semibold">Materi</h2>

                <label className="mt-4 block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Surah
                  </span>
                  <div className="mt-2">
                    <SurahInput />
                  </div>
                </label>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Ayat awal
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
                      Ayat akhir
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
                <h2 className="font-semibold">Penilaian</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
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
                      Nilai
                    </span>
                    <input
                      className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                      max={100}
                      min={0}
                      name="score"
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="Opsional"
                      type="number"
                      value={score}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Catatan
                  </span>
                  <textarea
                    className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900"
                    name="notes"
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opsional"
                    value={notes}
                  />
                </label>
              </section>

              <input name="date" type="hidden" value={todayDate} />
              <input name="time" type="hidden" value={nowTime} />

              <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                <button
                  className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  onClick={handleCancel}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:opacity-60"
                  disabled={isPending || !canSubmit}
                  onClick={handleSubmit}
                  type="button"
                >
                  {isPending ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={17} />
                  ) : null}
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400">
              Pilih santri terlebih dahulu untuk mulai mencatat.
            </div>
          )}
        </form>

        <BottomNav currentPath="/quick-log" />
      </section>
    </main>
  );
}

function BottomNav({ currentPath }: { currentPath: string }) {
  const navItems = [
    { label: "Home", href: "/", Icon: ArrowLeft },
    { label: "Santri", href: "/students", Icon: BookOpen },
    { label: "Catat", href: "/quick-log", Icon: PenLine },
    { label: "Laporan", href: "/reports", Icon: CheckCircle2 },
  ];

  return (
    <nav className="mt-6">
      <div className="flex items-center justify-around rounded-2xl border border-slate-200 bg-white/95 py-2 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        {navItems.map(({ label, href, Icon }) => {
          const active = href === currentPath;
          return (
            <Link
              className={`flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-semibold transition ${
                active
                  ? "text-emerald-800 dark:text-emerald-400"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.3 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
