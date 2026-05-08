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
  return (
    <>
      {!hideNav && <Sidebar userName={userName} isAdmin={isAdmin} />}
      <main className={`min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white ${!hideNav ? "sm:ml-64" : ""}`}>
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
          {children}
          {!hideNav && <BottomNav currentPath={currentPath} />}
        </div>
      </main>
    </>
  );
}
