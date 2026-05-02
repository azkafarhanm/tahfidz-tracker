import React from "react";

interface RecordFormSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export function RecordFormSection({
  icon,
  title,
  children,
}: RecordFormSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
