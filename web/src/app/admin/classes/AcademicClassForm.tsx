import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Save,
  Hash,
  CalendarRange,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AcademicClassFormValues = {
  grade: string;
  section: string;
  academicYear: string;
  isActive: boolean;
};

type AcademicClassFormProps = {
  action: (formData: FormData) => Promise<void>;
  academicYears: string[];
  backHref: string;
  backLabel: string;
  description: string;
  error?: string;
  icon: LucideIcon;
  submitLabel: string;
  title: string;
  values: AcademicClassFormValues;
};

export default function AcademicClassForm({
  action,
  academicYears,
  backHref,
  backLabel,
  description,
  error,
  icon: Icon,
  submitLabel,
  title,
  values,
}: AcademicClassFormProps) {
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

        <form action={action} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Hash
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Detail kelas</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Tingkat kelas
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={values.grade}
                max={12}
                min={1}
                name="grade"
                placeholder="Contoh: 7"
                required
                type="number"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Ruang kelas
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={values.section}
                maxLength={5}
                name="section"
                placeholder="Contoh: A"
                required
                type="text"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Nama kelas
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Dibuat otomatis dari tingkat dan ruang kelas (contoh: 7A).
              </p>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarRange
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Tahun ajaran</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Tahun ajaran
              </span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={values.academicYear}
                name="academicYear"
                required
              >
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-500"
                defaultChecked={values.isActive}
                name="isActive"
                type="checkbox"
              />
              <div>
                <span className="text-sm font-medium text-slate-800">
                  Kelas aktif
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  Jika dinonaktifkan, kelas tidak akan muncul di pilihan santri.
                </p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                <GraduationCap aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">Catatan admin</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Nama kelas dibuat otomatis dari kombinasi tingkat dan ruang
                  kelas. Pastikan tidak ada duplikat untuk tahun ajaran yang
                  sama.
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
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
