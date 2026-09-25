"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import NumericInput from "@/components/NumericInput";
import NumericScoreInput from "@/components/NumericScoreInput";
import { deriveRecordStatusFromScore, recordStatusDisplay } from "@/lib/record-status";
import { statusLabels } from "@/lib/format";
import { emptyTahsinMaterialDefault, isTahsinSubmitDisabled, resolveTahsinMaterialDefault, type TahsinMaterialDefault } from "@/lib/tahsin-entry-state";
import { formatTahsinRange, tahsinMaterialForGrade } from "@/lib/tahsin-material";
import type { TahsinSurahOption } from "@/lib/tahsin-quran";
import {
  createTahsinAction,
  getTahsinQuranEntryDefaultAction,
  getTahsinSmartDefaultAction,
  type TahsinActionResult,
  type TahsinQuranEntryDefault,
} from "./actions";
import { stickyActionBar } from "@/lib/sticky-action-bar";

type Student = {
  id: string;
  fullName: string;
  academicClass: { name: string } | null;
  classGroup: { grade: number };
};
type QuranReading = { surahId: string; startAyah: string; endAyah: string };

const emptyQuranReading: QuranReading = { surahId: "", startAyah: "", endAyah: "" };
const fieldClass = "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800";

export default function TahsinQuickEntry({ students, surahs }: { students: Student[]; surahs: TahsinSurahOption[] }) {
  const classes = [...new Set(students.map((student) => student.academicClass?.name).filter((name): name is string => Boolean(name)))].sort();
  const [className, setClassName] = useState("");
  const classStudents = students.filter((student) => student.academicClass?.name === className);
  const [studentId, setStudentId] = useState("");
  const selectedStudent = students.find((student) => student.id === studentId);
  // Grade decides what is read: jilid pages for grade 7, surah and ayat for 8 and 9.
  const classGrade = classStudents[0]?.classGroup.grade;
  const material = tahsinMaterialForGrade(selectedStudent?.classGroup.grade ?? classGrade ?? 7) ?? "JILID";
  const [defaults, setDefaults] = useState<TahsinMaterialDefault>(emptyTahsinMaterialDefault);
  const [reading, setReading] = useState<QuranReading>(emptyQuranReading);
  const [lastReading, setLastReading] = useState<TahsinQuranEntryDefault["last"]>(null);
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoadingDefault, startDefaultTransition] = useTransition();
  const [result, submitAction, isPending] = useActionState(
    async (_: TahsinActionResult, formData: FormData) => createTahsinAction(formData),
    { ok: true, recordId: "", success: "" },
  );

  function clearMaterial() {
    setDefaults(emptyTahsinMaterialDefault);
    setReading(emptyQuranReading);
    setLastReading(null);
    setScore("");
    setNotes("");
  }

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    startDefaultTransition(async () => {
      if (material === "QURAN") {
        const next = await getTahsinQuranEntryDefaultAction(studentId);
        if (!active) return;
        setReading(next.next
          ? { surahId: next.next.surahId, startAyah: String(next.next.startAyah), endAyah: next.next.endAyah === null ? "" : String(next.next.endAyah) }
          : emptyQuranReading);
        setLastReading(next.last);
      } else {
        const next = await getTahsinSmartDefaultAction(studentId);
        if (!active) return;
        setDefaults(resolveTahsinMaterialDefault(next));
      }
      // Score and notes always start empty: a pre-filled score would let last
      // week's result be saved against this week's reading without anyone noticing.
      setScore("");
      setNotes("");
    });
    return () => { active = false; };
  }, [studentId, material]);

  useEffect(() => {
    if (result.ok && result.success) {
      toast.success(result.success);
      setClassName(""); setStudentId(""); clearMaterial();
      window.dispatchEvent(new CustomEvent("tahsin-record-created", { detail: { recordId: result.recordId } }));
    }
    if (!result.ok) toast.error(result.error);
  }, [result]);

  const status = score ? recordStatusDisplay(deriveRecordStatusFromScore(Number.parseInt(score, 10))) : "";
  const selectedSurah = surahs.find((surah) => surah.id === reading.surahId);
  const methodLabel = className ? (material === "QURAN" ? "Bacaan Al-Qur'an" : "Metode: Ilman Wa Ruuhan") : "Tahsin";

  return <form action={submitAction} className="mt-6 space-y-4">
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">{methodLabel}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Kelas<select className={fieldClass} value={className} onChange={(event) => { setClassName(event.target.value); setStudentId(""); clearMaterial(); }}><option value="">Pilih Kelas</option>{classes.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="block text-sm font-medium">Santri<select className={`${fieldClass} disabled:opacity-60`} value={studentId} disabled={!className || isLoadingDefault} onChange={(event) => { clearMaterial(); setStudentId(event.target.value); }}><option value="">{isLoadingDefault ? "Memuat default…" : "Pilih santri"}</option>{classStudents.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></label>
      </div>
    </section>
    {studentId ? isLoadingDefault ? <section aria-live="polite" className="flex min-h-32 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Loader2 className="animate-spin" size={18} />Memuat default penilaian…</section> : <>
      <input name="studentId" type="hidden" value={studentId} />
      <input name="material" type="hidden" value={material} />
      {material === "QURAN" ? <>
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300"><History aria-hidden="true" size={14} />Setoran terakhir</p>
          {lastReading ? <>
            <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">
              {lastReading.meetingNumber ? `Pertemuan ${lastReading.meetingNumber} · ` : ""}{new Date(lastReading.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              QS. {lastReading.surahName}: {formatTahsinRange(lastReading.startAyah, lastReading.endAyah)} · Nilai {lastReading.score ?? "-"} · {statusLabels[lastReading.status as keyof typeof statusLabels] ?? lastReading.status}
            </p>
          </> : <p className="mt-2 text-slate-600 dark:text-slate-400">Belum ada setoran. Dimulai dari awal Al-Baqarah.</p>}
        </section>
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
          <label className="block text-sm font-medium sm:col-span-2">Surah
            <select name="surahId" className={fieldClass} value={reading.surahId} onChange={(event) => setReading({ surahId: event.target.value, startAyah: "1", endAyah: "" })}>
              {surahs.map((surah) => <option key={surah.id} value={surah.id}>{surah.number}. {surah.name}</option>)}
            </select>
            {selectedSurah ? <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">{selectedSurah.totalAyahs} ayat</span> : null}
          </label>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <label className="block text-sm font-medium">Ayat awal<NumericInput required name="startAyah" value={reading.startAyah} onChange={(event) => setReading((current) => ({ ...current, startAyah: event.target.value }))} className={fieldClass} /></label>
            <label className="block text-sm font-medium">Ayat akhir<NumericInput name="endAyah" value={reading.endAyah} onChange={(event) => setReading((current) => ({ ...current, endAyah: event.target.value }))} className={fieldClass} /></label>
          </div>
        </section>
      </> : <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
        <label className="block text-sm font-medium">Jilid<select name="jilid" className={fieldClass} value={defaults.jilid} onChange={(event) => setDefaults((current) => ({ ...current, jilid: Number(event.target.value) }))}><option value="1">Jilid 1</option><option value="2">Jilid 2</option></select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Halaman mulai<NumericInput required name="startPage" value={defaults.startPage ?? ""} onChange={(event) => setDefaults((current) => ({ ...current, startPage: Number(event.target.value) || null }))} className={fieldClass} /></label><label className="block text-sm font-medium">Halaman akhir<NumericInput name="endPage" value={defaults.endPage ?? ""} onChange={(event) => setDefaults((current) => ({ ...current, endPage: Number(event.target.value) || null }))} className={fieldClass} /></label></div>
      </section>}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900"><label className="block text-sm font-medium">Nilai<NumericScoreInput required name="score" value={score} onChange={(event) => setScore(event.target.value)} className={fieldClass} placeholder="75–95" /></label><div><p className="text-sm font-medium">Status</p><p aria-live="polite" className="mt-2 flex min-h-12 items-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold dark:bg-slate-800">{status}</p></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><label className="block text-sm font-medium">Catatan<textarea name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" /></label></section>
      <button disabled={isTahsinSubmitDisabled(isPending, isLoadingDefault)} className={`${stickyActionBar} flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 font-semibold text-white disabled:opacity-60`}>{isPending ? <><Loader2 className="animate-spin" size={17} />Menyimpan…</> : "Simpan Penilaian"}</button>
    </> : <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Pilih santri untuk mulai menilai.</p>}
  </form>;
}
