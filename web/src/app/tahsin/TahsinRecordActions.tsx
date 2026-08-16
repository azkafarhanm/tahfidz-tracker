"use client";

import { useState } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { actionButtonClass } from "@/components/action-button-styles";
import ConfirmActionDialogButton, { ConfirmActionDialog } from "@/components/ConfirmActionDialogButton";
import { deleteTahsinAction, updateTahsinAction } from "./actions";

type EditableRecord = {
  id: string;
  jilid: number;
  startPage: number;
  endPage: number | null;
  score: number | null;
  notes: string | null;
};

export default function TahsinRecordActions({ record }: { record: EditableRecord }) {
  const t = useTranslations("TahsinPanel");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [jilid, setJilid] = useState(String(record.jilid));
  const [startPage, setStartPage] = useState(String(record.startPage));
  const [endPage, setEndPage] = useState(record.endPage === null ? "" : String(record.endPage));
  const [score, setScore] = useState(record.score === null ? "" : String(record.score));
  const [notes, setNotes] = useState(record.notes ?? "");

  function openEditor() {
    setJilid(String(record.jilid));
    setStartPage(String(record.startPage));
    setEndPage(record.endPage === null ? "" : String(record.endPage));
    setScore(record.score === null ? "" : String(record.score));
    setNotes(record.notes ?? "");
    setEditOpen(true);
  }

  async function update() {
    const formData = new FormData();
    formData.set("recordId", record.id);
    formData.set("jilid", jilid);
    formData.set("startPage", startPage);
    formData.set("endPage", endPage);
    formData.set("score", score);
    formData.set("notes", notes);
    return updateTahsinAction(formData);
  }

  return <div className="flex shrink-0 items-center gap-2">
    <button className={actionButtonClass("neutral", "min-h-9 rounded-xl px-2.5 text-xs")} onClick={openEditor} type="button">
      <Pencil aria-hidden="true" size={14} />{t("edit")}
    </button>
    <ConfirmActionDialogButton
      cancelLabel={t("cancel")}
      confirmLabel={t("deleteConfirm")}
      confirmMessage={t("deleteConfirmation")}
      dialogTitle={t("deleteTitle")}
      icon={<Trash2 aria-hidden="true" size={14} />}
      label={t("delete")}
      onAction={() => deleteTahsinAction(record.id)}
      onSuccess={() => router.refresh()}
      pendingLabel={t("deleting")}
      tone="danger"
    />
    <ConfirmActionDialog
      cancelLabel={t("cancel")}
      confirmLabel={t("save")}
      description={t("editDescription")}
      icon={<BookOpen aria-hidden="true" size={20} />}
      onConfirm={update}
      onOpenChange={setEditOpen}
      onSuccess={() => router.refresh()}
      open={editOpen}
      pendingLabel={t("saving")}
      title={t("editTitle")}
      tone="success"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">{t("volume")}<select className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800" onChange={(event) => setJilid(event.target.value)} value={jilid}><option value="1">1</option><option value="2">2</option></select></label>
        <label className="text-sm font-medium">{t("score")}<input className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800" inputMode="numeric" onChange={(event) => setScore(event.target.value)} required type="number" value={score} /></label>
        <label className="text-sm font-medium">{t("startPage")}<input className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800" inputMode="numeric" onChange={(event) => setStartPage(event.target.value)} required type="number" value={startPage} /></label>
        <label className="text-sm font-medium">{t("endPage")}<input className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800" inputMode="numeric" onChange={(event) => setEndPage(event.target.value)} type="number" value={endPage} /></label>
        <label className="text-sm font-medium sm:col-span-2">{t("notes")}<textarea className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" maxLength={1500} onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
      </div>
    </ConfirmActionDialog>
  </div>;
}
