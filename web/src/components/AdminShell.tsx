import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import MobileUtilityBar from "@/components/MobileUtilityBar";
import TimezoneCookie from "@/components/TimezoneCookie";

type AdminShellProps = {
  children: React.ReactNode;
  currentPath?: string;
  userName: string;
};

export default async function AdminShell({
  children,
  currentPath = "/admin",
  userName,
}: AdminShellProps) {
  return (
    <>
      <TimezoneCookie />
      <Sidebar currentPath={currentPath} isAdmin />
      <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white sm:ml-64 rtl:sm:ml-0 rtl:sm:mr-64">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:max-w-6xl sm:px-8 sm:pb-5">
          <MobileUtilityBar
            currentPath={currentPath}
            isAdmin
            userName={userName}
          />
          {children}
          <BottomNav currentPath={currentPath} isAdmin />
        </div>
      </main>
    </>
  );
}
