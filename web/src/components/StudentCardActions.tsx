"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { MoreVertical, PencilLine, RotateCcw, UserX } from "lucide-react";
import {
  deactivateTeacherStudent,
  reactivateTeacherStudent,
} from "@/app/students/[id]/edit/actions";
import {
  actionButtonClass,
} from "@/components/action-button-styles";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialogButton";

type StudentCardActionsProps = {
  canManage: boolean;
  isActive: boolean;
  onStatusChanged?: () => void;
  studentId: string;
  studentName: string;
};

type DialogAction = "deactivate" | "reactivate" | null;

export default function StudentCardActions({
  canManage,
  isActive,
  onStatusChanged,
  studentId,
  studentName,
}: StudentCardActionsProps) {
  const t = useTranslations("Students");
  const deactivateT = useTranslations("DeactivateStudent");
  const reactivateT = useTranslations("ReactivateStudent");
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [flipUpward, setFlipUpward] = useState(false);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset offset when menu closes
      setHorizontalOffset(0);
      return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const bottomNavHeight = window.innerWidth < 640 ? 100 : 0;
      setFlipUpward(spaceBelow < 200 + bottomNavHeight);
    }

    // Horizontal viewport edge detection — runs once after render
    const raf = requestAnimationFrame(() => {
      if (dropdownRef.current) {
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        let offset = 0;

        // Check right overflow
        if (dropdownRect.right > viewportWidth - 8) {
          offset = viewportWidth - 8 - dropdownRect.right;
        }

        // Check left overflow
        if (dropdownRect.left + offset < 8) {
          offset = 8 - dropdownRect.left;
        }

        setHorizontalOffset(offset);
      }
    });

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [isOpen]);

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
              setError(null);
            }}
            ref={triggerRef}
            type="button"
          >
            <MoreVertical aria-hidden="true" size={18} strokeWidth={2.2} />
          </button>

          {isOpen ? (
            <div
              ref={dropdownRef}
              className={`absolute right-0 z-[60] w-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none ${flipUpward ? "bottom-full mb-2" : "mt-2"}`}
              style={{ transform: `translateX(${horizontalOffset}px)` }}
            >
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

              <button
                className={`mt-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                    : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                }`}
                onClick={() => {
                  setIsOpen(false);
                  setDialogAction(isActive ? "deactivate" : "reactivate");
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
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmActionDialog
        cancelLabel={deactivateT("buttonCancel")}
        confirmLabel={deactivateT("buttonConfirm")}
        description={deactivateT("confirmMessage")}
        icon={<UserX aria-hidden="true" size={16} strokeWidth={2.2} />}
        onConfirm={async () => {
          const result = await deactivateTeacherStudent(studentId);
          if (result.ok) {
            onStatusChanged?.();
            router.refresh();
          }
          return result;
        }}
        onError={(message) => setError(message)}
        onOpenChange={(open) => {
          if (!open) setDialogAction(null);
        }}
        open={dialogAction === "deactivate"}
        pendingLabel={deactivateT("buttonProcessing")}
        title={t("deactivateStudent")}
        tone="warning"
      />

      <ConfirmActionDialog
        cancelLabel={reactivateT("cancelLabel")}
        confirmLabel={reactivateT("confirmLabel")}
        description={reactivateT("confirmMessage")}
        icon={<RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />}
        onConfirm={async () => {
          const result = await reactivateTeacherStudent(studentId);
          if (result.ok) {
            onStatusChanged?.();
            router.refresh();
          }
          return result;
        }}
        onError={(message) => setError(message)}
        onOpenChange={(open) => {
          if (!open) setDialogAction(null);
        }}
        open={dialogAction === "reactivate"}
        pendingLabel={reactivateT("processing")}
        title={t("reactivateStudent")}
        tone="success"
      />
    </div>
  );
}
