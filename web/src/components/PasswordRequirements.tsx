"use client";

import { CheckCircle2, Circle } from "lucide-react";
import {
  getPasswordChecks,
  MIN_PASSWORD_LENGTH,
} from "@/lib/password-rules";

type PasswordRequirementsProps = {
  password: string;
  confirmPassword?: string;
  labels: {
    minLength: string;
    hasLetter: string;
    hasNumber: string;
    matches?: string;
  };
};

function RequirementRow({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <li
      className={`flex items-center gap-2 text-xs ${
        met
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-slate-500 dark:text-slate-400"
      }`}
    >
      {met ? (
        <CheckCircle2 aria-hidden="true" size={14} strokeWidth={2.2} />
      ) : (
        <Circle aria-hidden="true" size={14} strokeWidth={2.2} />
      )}
      <span>{label}</span>
    </li>
  );
}

export default function PasswordRequirements({
  password,
  confirmPassword,
  labels,
}: PasswordRequirementsProps) {
  const checks = getPasswordChecks(password);
  const hasConfirm = typeof confirmPassword === "string";
  const matches = hasConfirm && confirmPassword.length > 0
    ? password === confirmPassword
    : false;

  return (
    <ul className="mt-2 space-y-1" aria-live="polite">
      <RequirementRow
        label={labels.minLength.replace("{min}", String(MIN_PASSWORD_LENGTH))}
        met={checks.minLength}
      />
      <RequirementRow label={labels.hasLetter} met={checks.hasLetter} />
      <RequirementRow label={labels.hasNumber} met={checks.hasNumber} />
      {hasConfirm && labels.matches ? (
        <RequirementRow label={labels.matches} met={matches} />
      ) : null}
    </ul>
  );
}
