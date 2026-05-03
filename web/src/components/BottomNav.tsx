import Link from "next/link";
import { getNavigation, type NavItem } from "@/lib/format";

export default function BottomNav({ currentPath }: { currentPath: string }) {
  const navigation = getNavigation(currentPath);

  return (
    <nav className="sticky bottom-4 mt-6 grid grid-cols-4 rounded-3xl border border-slate-200 bg-white/95 p-2 text-center text-xs font-medium text-slate-500 shadow-xl shadow-slate-950/10 backdrop-blur">
      {navigation.map((item: NavItem) => (
        <Link
          className={
            item.active
              ? "flex flex-col items-center gap-1 rounded-2xl bg-emerald-900 px-2 py-3 text-white"
              : "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 transition hover:bg-slate-100 hover:text-slate-900"
          }
          href={item.href}
          key={item.label}
        >
          <item.icon aria-hidden="true" size={18} strokeWidth={2.2} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
