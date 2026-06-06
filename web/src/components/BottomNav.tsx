import { getTranslations } from "next-intl/server";
import NavigationLinks from "@/components/NavigationLinks";
import { adminNavigationItems, teacherNavigationItems } from "@/lib/navigation";

export default async function BottomNav({
  isAdmin,
}: {
  currentPath: string;
  isAdmin: boolean;
}) {
  const t = await getTranslations("Sidebar");
  const navItems = isAdmin ? adminNavigationItems : teacherNavigationItems;

  return (
    <nav className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mt-6 sm:hidden">
      <div data-bottom-scroll="" className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex min-w-max gap-2">
          <NavigationLinks
            items={navItems}
            labels={Object.fromEntries(navItems.map(({ key }) => [key, t(key)]))}
            variant="bottom"
          />
        </div>
      </div>
    </nav>
  );
}
