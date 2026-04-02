"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    label: "Calendar",
    href: "/calendar",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 8h16M8 2v4M14 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/calendar/tasks",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M5 11l4 4L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/calendar/analytics",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 17l4-5 4 3 5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function MobileBottomTabBar() {
  const pathname = usePathname();

  function getActive() {
    if (pathname?.startsWith("/calendar/tasks")) return "/calendar/tasks";
    if (pathname?.startsWith("/calendar/analytics")) return "/calendar/analytics";
    return "/calendar";
  }

  const active = getActive();

  return (
    <nav
      className="flex items-center justify-around border-t border-[var(--border-primary)] flex-shrink-0 py-1 safe-area-bottom"
      style={{ background: "var(--bg-primary)" }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-colors ${
              isActive ? "text-[var(--pink-deep)]" : "text-[var(--text-tertiary)]"
            }`}
          >
            {tab.icon}
            <span className={`text-[10px] font-medium ${isActive ? "text-[var(--pink-deep)]" : ""}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
