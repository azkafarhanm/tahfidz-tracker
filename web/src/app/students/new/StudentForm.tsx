"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Save,
  UserRound,
} from "lucide-react";

type ClassGroupOption = {
  id: string;
  name: string;
  level: string;
  label: string;
};

type AcademicClassOption = {
  id: string;
  name: string;
  label: string;
};

type TeacherStudentFormProps = {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  error?: string;
  options: {
    classGroups: ClassGroupOption[];
    academicClasses: AcademicClassOption[];
  };
  values: {
    fullName: string;
    classGroupId: string;
    academicClassId: string;
    gender: string;
    joinDate: string;
    notes: string;
  };
};

const genderOptions = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
];

const gradeOptions = [
  { value: "7", label: "Kelas 7" },
  { value: "8", label: "Kelas 8" },
  { value: "9", label: "Kelas 9" },
];

const levels = [
  { key: "LOW", label: "Low", desc: "Pemula" },
  { key: "MEDIUM", label: "Medium", desc: "Menengah" },
  { key: "HIGH", label: "High", desc: "Lanjutan" },
];

export default function TeacherStudentForm({
  action,
  backHref,
  error,
  options,
  values,
}: TeacherStudentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  const cgByLevel = new Map(
    options.classGroups.map((cg) => [cg.level, cg]),
  );

  const matchedCg = selectedLevel
    ? cgByLevel.get(selectedLevel) ?? null
    : null;

  function handleSubmit(formData: FormData) {
    formData.set("classGroupId", matchedCg?.id ?? "");
    formData.set("halaqahLevel", selectedLevel);
    formData.set("grade", selectedGrade);
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href={backHref}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Santri
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Tambah Santri
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Tambahkan santri baru ke halaqah Anda.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <UserRound aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {error}
          </div>
        ) : null}

        <form action={handleSubmit} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Data santri</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Nama lengkap
              </span>
              <input
                autoComplete="name"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={values.fullName}
                maxLength={120}
                name="fullName"
                placeholder="Contoh: Afdal Fauzan Nurrohman"
                required
                type="text"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Jenis kelamin
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  defaultValue={values.gender}
                  name="gender"
                >
                  <option value="">Belum dipilih</option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Tanggal bergabung
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <CalendarDays
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                    size={17}
                    strokeWidth={2.2}
                  />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                    defaultValue={values.joinDate}
                    name="joinDate"
                    type="date"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <GraduationCap
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Kelas</h2>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {gradeOptions.map((g) => {
                const isSelected = selectedGrade === g.value;
                return (
                  <button
                    className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition active:scale-[0.97] ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                    key={g.value}
                    onClick={() => setSelectedGrade(g.value)}
                    type="button"
                  >
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-emerald-900" : "text-slate-950"
                      }`}
                    >
                      {g.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <GraduationCap
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Level Halaqah</h2>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {levels.map((lv) => {
                const cg = cgByLevel.get(lv.key);
                const isSelected = selectedLevel === lv.key;
                return (
                  <button
                    className={`flex min-h-[5.5rem] flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition active:scale-[0.97] ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-200"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                    key={lv.key}
                    onClick={() => setSelectedLevel(lv.key)}
                    type="button"
                  >
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-emerald-900" : "text-slate-950"
                      }`}
                    >
                      {lv.label}
                    </span>
                    <span className="mt-1 text-[10px] leading-tight text-slate-500">
                      {cg ? cg.name : lv.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Kelas akademik
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={values.academicClassId}
                name="academicClassId"
              >
                <option value="">Belum dipilih</option>
                {options.academicClasses.map((ac) => (
                  <option key={ac.id} value={ac.id}>
                    {ac.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Catatan
              </span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={values.notes}
                maxLength={1500}
                name="notes"
                placeholder="Opsional, catatan tambahan tentang santri."
                rows={3}
              />
            </label>
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur">
            <Link
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              href={backHref}
            >
              Batal
            </Link>
            <button
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:opacity-60"
              disabled={isPending || !selectedLevel || !selectedGrade}
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              {isPending ? "Menyimpan..." : "Simpan Santri"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
