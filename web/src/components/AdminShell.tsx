import Sidebar from "@/components/Sidebar";

type AdminShellProps = {
  children: React.ReactNode;
  userName: string;
};

export default function AdminShell({ children, userName }: AdminShellProps) {
  return (
    <>
      <Sidebar userName={userName} isAdmin />
      <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white sm:ml-64 rtl:sm:ml-0 rtl:sm:mr-64">
        <div className="mx-auto flex w-full max-w-md flex-col px-4 py-5 sm:max-w-6xl sm:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
