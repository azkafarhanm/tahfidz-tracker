type SkeletonKind = "dashboard" | "detail" | "directory" | "form" | "table";

type PanelSkeletonProps = {
  kind?: SkeletonKind;
  reveal?: boolean;
  wide?: boolean;
};

const block = "rounded-2xl bg-slate-200 dark:bg-slate-800";
const softBlock = "rounded-2xl bg-slate-100 dark:bg-slate-800";

function HeaderSkeleton() {
  return (
    <header className="flex min-h-[4.5rem] items-start justify-between gap-4">
      <div className="min-w-0 space-y-3">
        <div className={`h-4 w-28 ${block}`} />
        <div className={`h-8 w-48 ${block}`} />
        <div className={`h-4 w-64 max-w-full ${block}`} />
      </div>
      <div className={`h-12 w-12 shrink-0 ${block}`} />
    </header>
  );
}

function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
      {Array.from({ length: count }).map((_, index) => (
        <div className={`h-20 ${block}`} key={index} />
      ))}
    </section>
  );
}

function TableSkeleton() {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex min-h-10 items-center justify-between gap-3">
        <div className={`h-5 w-40 ${softBlock}`} />
        <div className={`h-10 w-28 ${softBlock}`} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className={`h-14 ${softBlock}`} key={index} />
        ))}
      </div>
    </section>
  );
}

function DirectorySkeleton() {
  return (
    <>
      <div className={`h-36 rounded-[1.75rem] bg-slate-200 dark:bg-slate-800`} />
      <div className={`h-12 ${block}`} />
      <section className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className={`h-48 ${block}`} key={index} />
        ))}
      </section>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className={`h-28 ${block}`} />
      <CardsSkeleton count={2} />
      <div className={`h-14 ${block}`} />
      <TableSkeleton />
    </>
  );
}

function FormSkeleton() {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className={`h-12 ${softBlock}`} key={index} />
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <div className={`h-11 w-28 ${softBlock}`} />
        <div className={`h-11 w-32 ${softBlock}`} />
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="h-44 rounded-[1.75rem] bg-slate-200 dark:bg-slate-800" />
      <CardsSkeleton count={6} />
      <section className="space-y-3">
        <div className={`h-5 w-36 ${block}`} />
        {Array.from({ length: 3 }).map((_, index) => (
          <div className={`h-24 ${block}`} key={index} />
        ))}
      </section>
    </>
  );
}

export function PanelTransitionSkeleton({
  kind = "dashboard",
  reveal = true,
  wide = false,
}: PanelSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-admin-transition-part={reveal ? undefined : "panel"}
      className={`${reveal ? "route-transition-skeleton" : ""} min-h-[70vh] space-y-6 motion-safe:animate-pulse ${
        wide ? "sm:max-w-none" : ""
      }`}
    >
      <HeaderSkeleton />
      {kind === "dashboard" ? <DashboardSkeleton /> : null}
      {kind === "directory" ? <DirectorySkeleton /> : null}
      {kind === "detail" ? <DetailSkeleton /> : null}
      {kind === "form" ? <FormSkeleton /> : null}
      {kind === "table" ? <TableSkeleton /> : null}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside
      aria-hidden="true"
      className="hidden border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:fixed sm:inset-y-0 sm:left-0 rtl:sm:left-auto rtl:sm:right-0 sm:z-50 sm:flex sm:h-[100dvh] sm:w-64 sm:flex-col sm:overflow-hidden"
    >
      <div className="shrink-0 border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1.5 p-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" key={index} />
        ))}
      </nav>
      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </aside>
  );
}

export function AdminChromeSkeletonOverlay({
  reveal = true,
}: {
  reveal?: boolean;
}) {
  return (
    <div
      className={`${reveal ? "route-transition-skeleton" : ""} pointer-events-none fixed inset-0 z-50`}
      data-admin-transition-part={reveal ? undefined : "chrome"}
    >
      <SidebarSkeleton />
      <div
        aria-hidden="true"
        className="fixed left-4 right-4 top-5 z-50 mx-auto max-w-md sm:hidden"
      >
        <MobileUtilitySkeleton />
      </div>
      <div
        aria-hidden="true"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto max-w-md sm:hidden"
      >
        <BottomNavSkeleton />
      </div>
    </div>
  );
}

function MobileUtilitySkeleton() {
  return (
    <div className="mb-5 flex min-h-12 items-center justify-between gap-3 sm:hidden">
      <div className="h-10 w-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-10 w-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function BottomNavSkeleton() {
  return (
    <nav aria-hidden="true" className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mt-6 sm:hidden">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-[4.25rem] min-w-[84px] rounded-2xl bg-slate-100 dark:bg-slate-800" key={index} />
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function AppRouteTransitionSkeleton({
  kind = "dashboard",
  wide = false,
}: PanelSkeletonProps) {
  return (
    <>
      <SidebarSkeleton />
      <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white sm:ml-64 rtl:sm:ml-0 rtl:sm:mr-64">
        <div
          className={`mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:px-8 sm:pb-5 ${
            wide ? "sm:max-w-5xl" : "sm:max-w-3xl"
          }`}
        >
          <MobileUtilitySkeleton />
          <PanelTransitionSkeleton kind={kind} wide={wide} />
          <BottomNavSkeleton />
        </div>
      </main>
    </>
  );
}

export function BarePageTransitionSkeleton({
  kind = "form",
  wide = false,
}: PanelSkeletonProps) {
  return (
    <main
      aria-hidden="true"
      className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white"
    >
      <section
        className={`mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:px-8 ${
          wide ? "sm:max-w-5xl" : "sm:max-w-3xl"
        }`}
      >
        <PanelTransitionSkeleton kind={kind} wide={wide} />
      </section>
    </main>
  );
}

export function AdminRouteTransitionSkeleton({
  kind = "dashboard",
  wide = true,
}: PanelSkeletonProps) {
  return (
    <div data-admin-loading-transition="">
      <AdminChromeSkeletonOverlay reveal={false} />
      <PanelTransitionSkeleton kind={kind} reveal={false} wide={wide} />
    </div>
  );
}
