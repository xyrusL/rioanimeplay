import { MobileBottomNav } from "@/features/mobile/shared/mobile-bottom-nav";

type MobileAppShellProps = {
  children: React.ReactNode;
  hideBottomNav?: boolean;
};

export function MobileAppShell({
  children,
  hideBottomNav = false
}: MobileAppShellProps) {
  return (
    <main className="relative min-h-screen bg-[linear-gradient(180deg,var(--body-gradient-start)_0%,var(--bg-panel)_28%,var(--body-gradient-end)_100%)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,var(--body-radial-left),transparent_32%),radial-gradient(circle_at_bottom_right,var(--body-radial-right),transparent_36%)]" />
      <div
        className={`relative z-10 mx-auto min-h-screen w-full max-w-[440px] px-4 pt-4 ${
          hideBottomNav ? "pb-4" : "pb-[9.25rem]"
        }`}
      >
        {children}
      </div>
      {hideBottomNav ? null : <MobileBottomNav />}
    </main>
  );
}
