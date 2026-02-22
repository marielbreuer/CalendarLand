"use client";

import { useEffect, useState } from "react";
import { HOUR_HEIGHT } from "./TimeGutter";
import { isToday } from "@/lib/dates";

interface CurrentTimeLineProps {
  day: Date;
}

export function CurrentTimeLine({ day }: CurrentTimeLineProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isToday(day)) return null;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * HOUR_HEIGHT;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[5px]" />
        <div className="flex-1 h-[2px] bg-red-500" />
      </div>
    </div>
  );
}
