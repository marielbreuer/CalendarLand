"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { SearchModal } from "@/components/search/SearchModal";
import { QuickCaptureModal } from "@/components/capture/QuickCaptureModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { NotificationChecker } from "@/components/notifications/NotificationChecker";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { useUIStore } from "@/stores/uiStore";

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { goForward, goBackward, goToToday, setView } = useCalendarViewStore();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const toggleTaskPanel = useUIStore((s) => s.toggleTaskPanel);
  const openSearchModal = useUIStore((s) => s.openSearchModal);
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);
  const toggleNotificationPanel = useUIStore((s) => s.toggleNotificationPanel);
  const router = useRouter();

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goBackward();
          break;
        case "ArrowRight":
          e.preventDefault();
          goForward();
          break;
        case "t":
          if (!e.metaKey && !e.ctrlKey) goToToday();
          break;
        case "d":
          if (!e.metaKey && !e.ctrlKey) setView("day");
          break;
        case "w":
          if (!e.metaKey && !e.ctrlKey) setView("week");
          break;
        case "m":
          if (!e.metaKey && !e.ctrlKey) setView("month");
          break;
        case "b":
          if (!e.metaKey && !e.ctrlKey) router.push("/calendar/board");
          break;
        case "k":
          if (!e.metaKey && !e.ctrlKey) router.push("/calendar/tasks");
          break;
        case "p":
          if (!e.metaKey && !e.ctrlKey) toggleTaskPanel();
          break;
        case "/":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            openSearchModal();
          }
          break;
        case "n":
          if (!e.metaKey && !e.ctrlKey) openQuickCapture();
          break;
        case "r":
          if (!e.metaKey && !e.ctrlKey) toggleNotificationPanel();
          break;
        case "s":
          if (!e.metaKey && !e.ctrlKey) router.push("/calendar/scheduling");
          break;
        case ",":
          if (!e.metaKey && !e.ctrlKey) router.push("/calendar/settings");
          break;
      }
      // Cmd+K / Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearchModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goForward, goBackward, goToToday, setView, router, toggleTaskPanel, openSearchModal, openQuickCapture, toggleNotificationPanel]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <CalendarHeader />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar: fixed overlay on mobile, static on desktop */}
        <div
          className={`
            fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out
            md:relative md:translate-x-0 md:z-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-full"}
          `}
        >
          {sidebarOpen && <Sidebar />}
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <NotificationPanel />
      <NotificationChecker />
      <SearchModal />
      <QuickCaptureModal />
      <TaskModal />
    </div>
  );
}
