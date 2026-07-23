import { ProgramType } from "@/generated/prisma-next/enums";

type ProgramBadgeProps = {
  programType: ProgramType;
};

const labels: Record<ProgramType, string> = {
  [ProgramType.ACADEMIC]: "AKADEMIK",
  [ProgramType.BOARDING]: "BOARDING",
};

const styles: Record<ProgramType, string> = {
  [ProgramType.ACADEMIC]:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  [ProgramType.BOARDING]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function ProgramBadge({ programType }: ProgramBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-center text-[11px] font-bold leading-tight [overflow-wrap:anywhere] ${styles[programType]}`}
    >
      {labels[programType]}
    </span>
  );
}
