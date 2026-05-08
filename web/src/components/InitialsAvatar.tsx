const palette = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-400",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400",
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-400",
  "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400",
  "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function InitialsAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${sizeClasses[size]} ${getColor(name)}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
