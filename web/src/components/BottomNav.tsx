import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { adminNavigationItems, teacherNavigationItems } from "@/lib/navigation";

export default async function BottomNav({
  currentPath,
  isAdmin,
}: {
  currentPath: string;
  isAdmin: boolean;
}) {
  const t = await getTranslations("Sidebar");
  const navItems = isAdmin ? adminNavigationItems : teacherNavigationItems;

  return (
    <nav className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mt-6 sm:hidden">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex min-w-max gap-2">
          {navItems.map(({ key, href, icon: Icon }) => {
            const active =
              currentPath === href ||
              (href !== "/" && href !== "/admin" && currentPath.startsWith(href));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl bg-emerald-900 px-3 py-3 text-white dark:bg-emerald-950 dark:text-emerald-400"
                    : "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl px-3 py-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }
                href={href}
                key={key}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                <span className="text-[11px] font-medium leading-tight">{t(key)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
