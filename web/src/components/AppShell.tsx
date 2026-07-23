import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import TimezoneCookie from "@/components/TimezoneCookie";
import MobileUtilityBar from "@/components/MobileUtilityBar";
import FloatingIslamicClockGate from "@/components/FloatingIslamicClockGate";

type AppShellProps = {
  children: React.ReactNode;
  currentPath: string;
  userName: string;
  isAdmin: boolean;
  hideNav?: boolean;
};

export default async function AppShell({
  children,
  currentPath,
  userName,
  isAdmin,
  hideNav,
}: AppShellProps) {
  const showNav = !hideNav;
  const showMobileUtilityBar = showNav && currentPath !== "/profile";

  return (
    <>
      <TimezoneCookie />
      {showNav ? (
        <Sidebar currentPath={currentPath} userName={userName} isAdmin={isAdmin} />
      ) : null}
      {showNav ? <FloatingIslamicClockGate /> : null}
      <main
        className={`min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white ${
          showNav ? "sm:ml-64 rtl:sm:ml-0 rtl:sm:mr-64" : ""
        }`}
      >
        <div
          className={`mx-auto flex min-h-screen w-full min-w-0 max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8 ${
            showNav ? "pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:pb-5" : ""
          }`}
        >
          {showMobileUtilityBar ? (
            <MobileUtilityBar currentPath={currentPath} userName={userName} isAdmin={isAdmin} />
          ) : null}
          {children}
          {showNav ? <BottomNav currentPath={currentPath} isAdmin={isAdmin} /> : null}
        </div>
      </main>
    </>
  );
}
