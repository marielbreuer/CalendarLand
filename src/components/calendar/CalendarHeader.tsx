"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { useUIStore } from "@/stores/uiStore";
import { formatHeaderDate } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { CalendarView } from "@/types/common";

const views: { label: string; value: CalendarView }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "List", value: "list" },
];

const routeTabs = [
  { label: "Calendar", href: "/calendar" },
  { label: "Tasks", href: "/calendar/tasks" },
  { label: "Board", href: "/calendar/board" },
  { label: "Scheduling", href: "/calendar/scheduling" },
];

function formatTzShort(tz: string): string {
  try {
    const short = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return short?.value ?? tz;
  } catch {
    return tz;
  }
}

export function CalendarHeader() {
  const { view, selectedDate, setView, goToToday, goForward, goBackward, timezone } =
    useCalendarViewStore();
  const { data: session } = useSession();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openCreateTaskModal = useUIStore((s) => s.openCreateTaskModal);
  const openSearchModal = useUIStore((s) => s.openSearchModal);
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);
  const toggleTaskPanel = useUIStore((s) => s.toggleTaskPanel);
  const taskPanelOpen = useUIStore((s) => s.taskPanelOpen);
  const pathname = usePathname();

  const isCalendarRoute = pathname === "/calendar";
  const isTaskRoute = pathname === "/calendar/tasks" || pathname === "/calendar/board";
  const isSchedulingRoute = pathname?.startsWith("/calendar/scheduling") || pathname?.startsWith("/calendar/settings");

  function getActiveTab() {
    if (pathname === "/calendar/tasks") return "/calendar/tasks";
    if (pathname === "/calendar/board") return "/calendar/board";
    if (pathname?.startsWith("/calendar/scheduling")) return "/calendar/scheduling";
    return "/calendar";
  }

  const activeTab = getActiveTab();

  return (
    <header className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]" style={{ background: 'var(--grad-hero)' }}>
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors flex-shrink-0"
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <h1 className="text-lg sm:text-xl font-bold select-none hidden sm:block" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--pink)' }}>
        Calendar Land
      </h1>

      {/* Route tabs */}
      <div className="flex items-center bg-white/50 rounded-lg p-0.5 flex-shrink-0 backdrop-blur-sm">
        {routeTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-all ${
              activeTab === tab.href
                ? "bg-white shadow-sm font-medium text-[var(--pink-deep)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Calendar-specific controls */}
      {isCalendarRoute && (
        <>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>

          <div className="flex items-center gap-0.5">
            <button
              onClick={goBackward}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              aria-label="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 3L5 8l5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={goForward}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              aria-label="Next"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <span className="text-sm sm:text-lg font-medium select-none truncate" style={{ color: 'var(--pink-deep)' }}>
            {formatHeaderDate(selectedDate, view)}
          </span>

          <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded select-none hidden sm:inline-block flex-shrink-0" style={{ color: 'var(--pink-deep)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
            {formatTzShort(timezone)}
          </span>
        </>
      )}

      {/* Task route: New Task button */}
      {isTaskRoute && (
        <Button size="sm" onClick={openCreateTaskModal} className="ml-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Task
        </Button>
      )}

      {/* Right-side actions */}
      {(isTaskRoute || isSchedulingRoute) && (
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          {isTaskRoute && (
            <>
              <button
                onClick={openSearchModal}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors"
                aria-label="Search"
                title="Search (/ or Ctrl+K)"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={openQuickCapture}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors"
                aria-label="Quick capture"
                title="Quick capture (N)"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <NotificationBell />
            </>
          )}
          <Link
            href="/calendar/settings"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors"
            aria-label="Settings"
            title="Settings (,)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5L15.5 5.25V12.75L9 16.5L2.5 12.75V5.25L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
          <div className="flex items-center gap-1 flex-shrink-0">
            {session?.user?.name && (
              <span className="text-xs hidden md:block" style={{ color: "var(--text-secondary, #6b7280)" }}>
                {session.user.name}
              </span>
            )}
            {session?.user?.role === "admin" && (
              <span className="text-[10px] px-1 py-0.5 rounded font-medium" style={{ background: "var(--pink, #ec4899)", color: "#fff" }}>
                admin
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors text-xs font-medium px-2"
              aria-label="Sign out"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* View switcher + task panel toggle — only on calendar route */}
      {isCalendarRoute && (
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center bg-white/50 rounded-lg p-0.5 backdrop-blur-sm">
            {views.map((v) => (
              <button
                key={v.value}
                onClick={() => setView(v.value)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-all ${
                  view === v.value
                    ? "bg-white shadow-sm font-medium text-[var(--pink-deep)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={openSearchModal}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors"
            aria-label="Search"
            title="Search (/ or Ctrl+K)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={openQuickCapture}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors"
            aria-label="Quick capture"
            title="Quick capture (N)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <NotificationBell />
          <button
            onClick={toggleTaskPanel}
            className={`p-1.5 rounded-lg transition-colors ${
              taskPanelOpen
                ? "bg-white shadow-sm text-[var(--pink-deep)]"
                : "text-[var(--text-secondary)] hover:bg-white/50"
            }`}
            aria-label="Toggle task panel"
            title="Toggle task panel (P)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 6h2v2H6zM6 10h2v2H6zM10 6h4M10 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <Link
            href="/calendar/settings"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors"
            aria-label="Settings"
            title="Settings (,)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5L15.5 5.25V12.75L9 16.5L2.5 12.75V5.25L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
          <div className="flex items-center gap-1 flex-shrink-0">
            {session?.user?.name && (
              <span className="text-xs hidden md:block" style={{ color: "var(--text-secondary, #6b7280)" }}>
                {session.user.name}
              </span>
            )}
            {session?.user?.role === "admin" && (
              <span className="text-[10px] px-1 py-0.5 rounded font-medium" style={{ background: "var(--pink, #ec4899)", color: "#fff" }}>
                admin
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-white/50 transition-colors text-xs font-medium px-2"
              aria-label="Sign out"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
