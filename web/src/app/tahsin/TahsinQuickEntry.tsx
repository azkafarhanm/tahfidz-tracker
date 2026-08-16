"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import NumericInput from "@/components/NumericInput";
import NumericScoreInput from "@/components/NumericScoreInput";
import { deriveRecordStatusFromScore, recordStatusDisplay } from "@/lib/record-status";
import { emptyTahsinMaterialDefault, isTahsinSubmitDisabled, resolveTahsinMaterialDefault, type TahsinMaterialDefault } from "@/lib/tahsin-entry-state";
import { createTahsinAction, getTahsinSmartDefaultAction, type TahsinActionResult } from "./actions";

type Student = { id: string; fullName: string; academicClass: { name: string } | null };
type Defaults = TahsinMaterialDefault;

export default function TahsinQuickEntry({ students }: { students: Student[] }) {
  const classes = [...new Set(students.map((student) => student.academicClass?.name).filter((name): name is string => Boolean(name)))].sort();
  const [className, setClassName] = useState(classes[0] ?? "");
  const classStudents = students.filter((student) => student.academicClass?.name === className);
  const [studentId, setStudentId] = useState("");
  const [defaults, setDefaults] = useState<Defaults>(emptyTahsinMaterialDefault);
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoadingDefault, startDefaultTransition] = useTransition();
  const [result, submitAction, isPending] = useActionState(
    async (_: TahsinActionResult, formData: FormData) => createTahsinAction(formData),
    { ok: true, recordId: "", success: "" },
  );

  useEffect(() => { setStudentId(""); setDefaults(emptyTahsinMaterialDefault); setScore(""); setNotes(""); }, [className]);
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    startDefaultTransition(async () => {
      const next = await getTahsinSmartDefaultAction(studentId);
      if (active) { setDefaults(resolveTahsinMaterialDefault(next)); setScore(""); setNotes(""); }
    });
    return () => { active = false; };
  }, [studentId]);
  useEffect(() => {
    if (result.ok && result.success) { toast.success(result.success); setScore(""); setNotes(""); }
    if (!result.ok) toast.error(result.error);
  }, [result]);

  const status = score ? recordStatusDisplay(deriveRecordStatusFromScore(Number.parseInt(score, 10))) : "";
  return <form action={submitAction} className="mt-6 space-y-4">
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Metode: Ilman Wa Ruuhan</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Kelas<select className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800" value={className} onChange={(event) => setClassName(event.target.value)}>{classes.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="block text-sm font-medium">Santri<select className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800" value={studentId} disabled={!className || isLoadingDefault} onChange={(event) => setStudentId(event.target.value)}><option value="">{isLoadingDefault ? "Memuat default…" : "Pilih santri"}</option>{classStudents.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></label>
      </div>
    </section>
    {studentId ? <>
      <input name="studentId" type="hidden" value={studentId} />
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
        <label className="block text-sm font-medium">Jilid<select name="jilid" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800" value={defaults.jilid} onChange={(event) => setDefaults((current) => ({ ...current, jilid: Number(event.target.value) }))}><option value="1">Jilid 1</option><option value="2">Jilid 2</option></select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Halaman mulai<NumericInput required name="startPage" value={defaults.startPage ?? ""} onChange={(event) => setDefaults((current) => ({ ...current, startPage: Number(event.target.value) || null }))} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800" /></label><label className="block text-sm font-medium">Halaman akhir<NumericInput name="endPage" value={defaults.endPage ?? ""} onChange={(event) => setDefaults((current) => ({ ...current, endPage: Number(event.target.value) || null }))} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800" /></label></div>
      </section>
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900"><label className="block text-sm font-medium">Nilai<NumericScoreInput required name="score" value={score} onChange={(event) => setScore(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800" placeholder="75–95" /></label><div><p className="text-sm font-medium">Status</p><p aria-live="polite" className="mt-2 flex min-h-12 items-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold dark:bg-slate-800">{status}</p></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><label className="block text-sm font-medium">Catatan<textarea name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800" /></label></section>
      <button disabled={isTahsinSubmitDisabled(isPending, isLoadingDefault)} className="sticky bottom-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 font-semibold text-white disabled:opacity-60">{isPending ? <><Loader2 className="animate-spin" size={17} />Menyimpan…</> : "Simpan Penilaian"}</button>
    </> : <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Pilih santri untuk mulai menilai.</p>}
  </form>;
}
