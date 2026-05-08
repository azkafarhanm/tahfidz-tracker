import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

type AppShellProps = {
  children: React.ReactNode;
  currentPath: string;
  userName: string;
  isAdmin: boolean;
  hideNav?: boolean;
};

export default function AppShell({
  children,
  currentPath,
  userName,
  isAdmin,
  hideNav,
}: AppShellProps) {
  const showNav = !hideNav;

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white sm:flex">
      {showNav ? <Sidebar userName={userName} isAdmin={isAdmin} /> : null}
      <main
        className={`flex-1 min-w-0 ${
          showNav ? "sm:ml-64 sm:h-screen sm:overflow-y-auto sm:overscroll-y-contain" : ""
        }`}
      >
        <div
          className={`mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8 ${
            showNav ? "pb-24 sm:min-h-full sm:pb-5" : ""
          }`}
        >
          {children}
          {showNav ? <BottomNav currentPath={currentPath} /> : null}
        </div>
      </main>
    </div>
  );
}
