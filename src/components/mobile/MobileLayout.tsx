"use client";

import { usePathname } from "next/navigation";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomTabBar } from "./MobileBottomTabBar";
import { MobileFAB } from "./MobileFAB";
import { MobileWeekStrip } from "./MobileWeekStrip";
import { AgendaView } from "./AgendaView";
import { MobileTasksPage } from "./MobileTasksPage";

interface Props {
  children: React.ReactNode;
}

export function MobileLayout({ children }: Props) {
  const pathname = usePathname();

  const isCalendar = pathname === "/calendar";
  const isTasks =
    pathname === "/calendar/tasks" || pathname === "/calendar/board";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <MobileHeader />

      {/* Calendar-specific: week strip + agenda */}
      {isCalendar ? (
        <>
          <MobileWeekStrip />
          <AgendaView />
        </>
      ) : isTasks ? (
        <MobileTasksPage />
      ) : (
        <main className="flex-1 overflow-auto">{children}</main>
      )}

      <MobileBottomTabBar />
      <MobileFAB />
    </div>
  );
}
