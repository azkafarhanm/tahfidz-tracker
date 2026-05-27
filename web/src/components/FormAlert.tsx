type FormAlertProps = {
  message: string;
  tone?: "warning" | "error" | "success";
};

const toneClasses: Record<NonNullable<FormAlertProps["tone"]>, string> = {
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400",
};

export default function FormAlert({
  message,
  tone = "warning",
}: FormAlertProps) {
  return (
    <div
      className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${toneClasses[tone]}`}
      role="alert"
    >
      {message}
    </div>
  );
}
