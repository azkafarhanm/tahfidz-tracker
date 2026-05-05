"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  GraduationCap,
  PencilLine,
  Save,
  School,
  ShieldCheck,
  UserRound,
  UserPlus,
  BookOpen,
  Signal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  UserPlus,
  PencilLine,
};

type StudentOption = {
  id: string;
  label: string;
  isActive: boolean;
};

type ClassGroupOption = StudentOption & {
  teacherId: string;
  grade: number;
  gradeLabel: string;
  academicYear: string;
  level: string;
  levelLabel: string;
  name: string;
  teacherName: string;
};

type AcademicClassOption = StudentOption & {
  grade: number;
  name: string;
  academicYear: string;
};

export type StudentFormValues = {
  fullName: string;
  teacherId: string;
  academicYear: string;
  academicClassId: string;
  gender: string;
  joinDate: string;
  isActive: boolean;
  notes: string;
};

type StudentFormProps = {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  backLabel: string;
  description: string;
  error?: string;
  icon: string;
  options: {
    teachers: StudentOption[];
    classGroups: ClassGroupOption[];
    academicClasses: AcademicClassOption[];
    academicYears: string[];
  };
  submitLabel: string;
  title: string;
  values: StudentFormValues;
};

const genderOptions = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
];

export default function StudentForm({
  action,
  backHref,
  backLabel,
  description,
  error,
  icon: iconName,
  options,
  submitLabel,
  title,
  values,
}: StudentFormProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(values.teacherId);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    values.academicYear,
  );
  const [selectedAcademicClassId, setSelectedAcademicClassId] = useState(
    values.academicClassId,
  );
  const [isPending, startTransition] = useTransition();

  const filteredAcademicClasses = useMemo(
    () =>
      options.academicClasses.filter(
        (academicClass) => academicClass.academicYear === selectedAcademicYear,
      ),
    [options.academicClasses, selectedAcademicYear],
  );

  const selectedAcademicClass = useMemo(
    () =>
      options.academicClasses.find(
        (academicClass) => academicClass.id === selectedAcademicClassId,
      ) ?? null,
    [options.academicClasses, selectedAcademicClassId],
  );

  const teacherClassGroups = useMemo(
    () =>
      selectedTeacherId
        ? options.classGroups.filter(
            (classGroup) => classGroup.teacherId === selectedTeacherId,
          )
        : [],
    [options.classGroups, selectedTeacherId],
  );

  const resolvedClassGroup = useMemo(() => {
    if (!selectedTeacherId || !selectedAcademicClass) {
      return null;
    }

    return (
      teacherClassGroups.find(
        (classGroup) =>
          classGroup.academicYear === selectedAcademicClass.academicYear &&
          classGroup.grade === selectedAcademicClass.grade,
      ) ?? null
    );
  }, [selectedAcademicClass, selectedTeacherId, teacherClassGroups]);

  function handleAcademicYearChange(newAcademicYear: string) {
    setSelectedAcademicYear(newAcademicYear);

    const stillMatches = options.academicClasses.some(
      (academicClass) =>
        academicClass.id === selectedAcademicClassId &&
        academicClass.academicYear === newAcademicYear,
    );

    if (!stillMatches) {
      setSelectedAcademicClassId("");
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
    });
  }

  const Icon = iconMap[iconName] ?? UserRound;

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
              {backLabel}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <Icon aria-hidden="true" size={22} strokeWidth={2.3} />
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
                    required
                    type="date"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <School
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Kelas &amp; Halaqah</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Tahun ajaran
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                name="academicYear"
                onChange={(event) => handleAcademicYearChange(event.target.value)}
                value={selectedAcademicYear}
              >
                {options.academicYears.map((academicYear) => (
                  <option key={academicYear} value={academicYear}>
                    {academicYear}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Kelas akademik
              </span>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <GraduationCap
                  aria-hidden="true"
                  className="shrink-0 text-slate-400"
                  size={17}
                  strokeWidth={2.2}
                />
                <select
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                  name="academicClassId"
                  onChange={(event) => setSelectedAcademicClassId(event.target.value)}
                  required
                  value={selectedAcademicClassId}
                >
                  <option value="">Pilih kelas akademik</option>
                  {filteredAcademicClasses.map((academicClass) => (
                    <option key={academicClass.id} value={academicClass.id}>
                      {academicClass.label}
                      {academicClass.isActive ? "" : " - Nonaktif"}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Kelas akademik menunjukkan rombel asal santri seperti 7A, 7B,
                atau 7C.
              </p>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Guru tahfidz
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                name="teacherId"
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                required
                value={selectedTeacherId}
              >
                <option value="">Pilih guru</option>
                {options.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.label}
                    {teacher.isActive ? "" : " - Nonaktif"}
                  </option>
                ))}
              </select>
            </label>

            {selectedTeacherId && selectedAcademicClass && !resolvedClassGroup ? (
              <p className="mt-4 text-sm text-amber-600">
                Guru ini belum memiliki halaqah {selectedAcademicYear} untuk{" "}
                Kelas {selectedAcademicClass.grade}. Atur terlebih dahulu di menu
                Halaqah.
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <BookOpen
                    aria-hidden="true"
                    className="text-emerald-800"
                    size={16}
                    strokeWidth={2.2}
                  />
                  Halaqah terhubung
                </div>
                <p className="mt-2 text-sm text-slate-950">
                  {resolvedClassGroup?.name ?? "Akan terisi setelah kelas dan guru dipilih"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Signal
                    aria-hidden="true"
                    className="text-emerald-800"
                    size={16}
                    strokeWidth={2.2}
                  />
                  Level halaqah
                </div>
                <p className="mt-2 text-sm text-slate-950">
                  {resolvedClassGroup?.levelLabel ?? "Mengikuti halaqah yang dipilih"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Catatan dan status</h2>
            </div>

            <textarea
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              defaultValue={values.notes}
              maxLength={1500}
              name="notes"
              placeholder="Opsional, contoh: butuh perhatian tambahan pada jadwal murojaah."
            />

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-500"
                defaultChecked={values.isActive}
                name="isActive"
                type="checkbox"
              />
              <div>
                <span className="text-sm font-medium text-slate-800">
                  Santri aktif
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  Jika dinonaktifkan, santri tidak muncul pada alur pencatatan
                  guru sampai diaktifkan kembali.
                </p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">Catatan admin</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Santri tetap memakai kelas akademik asal seperti 7A atau 7B,
                  lalu ditempatkan ke halaqah guru berdasarkan kelas 7, 8, atau 9.
                </p>
              </div>
            </div>
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
              disabled={isPending}
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              {isPending ? "Menyimpan..." : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
