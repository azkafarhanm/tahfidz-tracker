import { Lightbulb } from "lucide-react";

type CrossSurahNoteGuidanceProps = {
  title: string;
  description: string;
  exampleLabel: string;
  example: string;
};

export default function CrossSurahNoteGuidance({
  title,
  description,
  exampleLabel,
  example,
}: CrossSurahNoteGuidanceProps) {
  return (
    <aside className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
      <div className="flex items-start gap-3">
        <Lightbulb aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" size={18} strokeWidth={2.2} />
        <div className="space-y-1.5">
          <p className="font-semibold">{title}</p>
          <p className="leading-relaxed text-blue-900/90 dark:text-blue-100/90">{description}</p>
          <p className="leading-relaxed">
            <span className="font-medium">{exampleLabel}</span>
            <br />
            {example}
          </p>
        </div>
      </div>
    </aside>
  );
}
