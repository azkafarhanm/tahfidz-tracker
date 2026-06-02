"use client";

type CharacterCounterProps = {
  current: number;
  max: number;
  maxReachedLabel: string;
};

export default function CharacterCounter({
  current,
  max,
  maxReachedLabel,
}: CharacterCounterProps) {
  const remaining = max - current;
  const isMaxReached = remaining <= 0;
  const isWarning = !isMaxReached && remaining < max * 0.1;

  return (
    <div className="mt-1.5 flex items-center justify-end gap-2">
      {isMaxReached ? (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {maxReachedLabel}
        </span>
      ) : null}
      <span
        className={`text-xs tabular-nums ${
          isMaxReached
            ? "font-semibold text-red-600 dark:text-red-400"
            : isWarning
              ? "font-medium text-amber-600 dark:text-amber-400"
              : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {current} / {max}
      </span>
    </div>
  );
}
