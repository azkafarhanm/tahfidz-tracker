"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { MoreVertical, PencilLine, RotateCcw, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  deactivateTeacherStudent,
  reactivateTeacherStudent,
} from "@/app/students/[id]/edit/actions";
import {
  actionButtonClass,
  compactActionButtonClass,
} from "@/components/action-button-styles";
import { playNotificationSound } from "@/lib/feedback";

type StudentCardActionsProps = {
  canManage: boolean;
  isActive: boolean;
  onStatusChanged?: () => void;
  studentId: string;
  studentName: string;
};

export default function StudentCardActions({
  canManage,
  isActive,
  onStatusChanged,
  studentId,
  studentName,
}: StudentCardActionsProps) {
  const t = useTranslations("Students");
  const deactivateT = useTranslations("DeactivateStudent");
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingDeactivate, setIsConfirmingDeactivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsConfirmingDeactivate(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  const handleStatusAction = () => {
    setError(null);
    startTransition(async () => {
      const result = isActive
        ? await deactivateTeacherStudent(studentId)
        : await reactivateTeacherStudent(studentId);

      if (result.ok) {
        if (result.message) {
          toast.success(result.message);
          playNotificationSound("success");
        }
        setIsOpen(false);
        setIsConfirmingDeactivate(false);
        onStatusChanged?.();
        router.refresh();
        return;
      }

      setError(result.error);
      toast.error(result.error);
      playNotificationSound("error");
    });
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        className={actionButtonClass("neutral")}
        href={`/students/${studentId}`}
      >
        {t("detailLink")}
      </Link>

      {canManage ? (
        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={isOpen}
            aria-label={t("actionsLabel", { name: studentName })}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-visible:ring-offset-slate-900"
            onClick={() => {
              setIsOpen((current) => !current);
              setIsConfirmingDeactivate(false);
              setError(null);
            }}
            type="button"
          >
            <MoreVertical aria-hidden="true" size={18} strokeWidth={2.2} />
          </button>

          {isOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
              {error ? (
                <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </p>
              ) : null}

              <Link
                className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                href={`/students/${studentId}/edit`}
              >
                <PencilLine aria-hidden="true" size={15} strokeWidth={2.2} />
                {t("editStudent")}
              </Link>

              {isActive && isConfirmingDeactivate ? (
                <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 p-2 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <p className="px-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {deactivateT("confirmMessage")}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      className={compactActionButtonClass("warning", "flex-1 px-2")}
                      disabled={isPending}
                      onClick={handleStatusAction}
                      type="button"
                    >
                      {isPending
                        ? deactivateT("buttonProcessing")
                        : deactivateT("buttonConfirm")}
                    </button>
                    <button
                      className={compactActionButtonClass("neutral", "px-2")}
                      disabled={isPending}
                      onClick={() => setIsConfirmingDeactivate(false)}
                      type="button"
                    >
                      {deactivateT("buttonCancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={`mt-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                      : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  }`}
                  disabled={isPending}
                  onClick={() => {
                    if (isActive) {
                      setIsConfirmingDeactivate(true);
                      return;
                    }
                    handleStatusAction();
                  }}
                  type="button"
                >
                  {isActive ? (
                    <UserX aria-hidden="true" size={15} strokeWidth={2.2} />
                  ) : (
                    <RotateCcw aria-hidden="true" size={15} strokeWidth={2.2} />
                  )}
                  {isActive ? t("deactivateStudent") : t("reactivateStudent")}
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
