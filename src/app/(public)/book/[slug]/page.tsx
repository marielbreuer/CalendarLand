"use client";

import { useState, useEffect, use } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isPast, startOfDay } from "date-fns";

interface PageInfo {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durations: number[];
  daysInAdvance: number;
  timezone: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

type Step = "duration" | "date" | "time" | "confirm" | "success";

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>("duration");
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<{ startTime: string; guestName: string } | null>(null);

  // Load page info
  useEffect(() => {
    fetch(`/api/book/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.page) {
          setPageInfo(data.page);
          if (data.page.durations.length === 1) {
            setSelectedDuration(data.page.durations[0]);
            setStep("date");
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  // Load slots when date + duration selected
  useEffect(() => {
    if (!selectedDate || !selectedDuration) return;
    setLoadingSlots(true);
    setSlots([]);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    fetch(`/api/book/${slug}?date=${dateStr}&duration=${selectedDuration}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setLoadingSlots(false);
      })
      .catch(() => setLoadingSlots(false));
  }, [selectedDate, selectedDuration, slug]);

  async function handleBook() {
    if (!selectedSlot || !guestName.trim() || !guestEmail.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/book/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestMessage: guestMessage.trim() || undefined,
        startTime: selectedSlot.startTime,
        duration: selectedDuration,
      }),
    });

    if (res.ok) {
      setBooking({ startTime: selectedSlot.startTime, guestName: guestName.trim() });
      setStep("success");
    } else {
      const data = await res.json();
      alert(data.message || "Failed to book. Please try again.");
    }
    setSubmitting(false);
  }

  const today = startOfDay(new Date());
  const maxDate = pageInfo
    ? addDays(today, pageInfo.daysInAdvance)
    : addDays(today, 14);

  function getCalendarDays(): (Date | null)[] {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const startPad = getDay(start); // 0 = Sun
    const result: (Date | null)[] = Array(startPad).fill(null);
    return result.concat(days);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">Scheduling page not found</h1>
          <p className="text-sm text-gray-500 mt-2">This booking link may have been deactivated.</p>
        </div>
      </div>
    );
  }

  if (!pageInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
          {pageInfo.description && (
            <p className="text-sm text-gray-500 mt-1">{pageInfo.description}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Step: Duration */}
          {step === "duration" && (
            <div className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Choose a duration</h2>
              <div className="grid grid-cols-2 gap-2">
                {pageInfo.durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDuration(d);
                      setStep("date");
                    }}
                    className="py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-pink-400 hover:bg-pink-50 transition-all text-sm font-medium text-gray-700"
                  >
                    {d < 60 ? `${d} minutes` : `${d / 60} hour${d > 60 ? "s" : ""}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Date */}
          {step === "date" && (
            <div className="p-6 space-y-4">
              {pageInfo.durations.length > 1 && (
                <button
                  onClick={() => setStep("duration")}
                  className="text-xs text-pink-500 hover:underline"
                >
                  ← Change duration
                </button>
              )}
              <h2 className="text-sm font-semibold text-gray-700">Select a date</h2>

              {/* Month nav */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  ‹
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {format(calendarMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  ›
                </button>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 font-medium">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const disabled = isPast(day) && !isToday(day) || day > maxDate;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                        setStep("time");
                      }}
                      className={`
                        p-2 text-sm rounded-lg transition-all
                        ${disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-800 hover:bg-pink-50 hover:text-pink-600 cursor-pointer"}
                        ${isSelected ? "bg-pink-500 text-white hover:bg-pink-500 hover:text-white" : ""}
                        ${isToday(day) && !isSelected ? "font-bold text-pink-500" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Time + Details */}
          {step === "time" && selectedDate && (
            <div className="p-6 space-y-4">
              <button
                onClick={() => { setStep("date"); setSelectedSlot(null); }}
                className="text-xs text-pink-500 hover:underline"
              >
                ← Change date
              </button>
              <h2 className="text-sm font-semibold text-gray-700">
                {format(selectedDate, "EEEE, MMM d")}
              </h2>

              {loadingSlots ? (
                <p className="text-xs text-gray-400">Loading available times...</p>
              ) : slots.length === 0 ? (
                <p className="text-xs text-gray-500">No available times on this day. Try another date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          py-2 px-3 rounded-lg text-xs font-medium border transition-all
                          ${isSelected
                            ? "bg-pink-500 border-pink-500 text-white"
                            : "border-gray-200 hover:border-pink-400 hover:bg-pink-50 text-gray-700"
                          }
                        `}
                      >
                        {format(new Date(slot.startTime), "h:mm a")}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlot && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700">Your details</h3>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name *"
                    required
                    className={inputClass}
                  />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Your email *"
                    required
                    className={inputClass}
                  />
                  <textarea
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    placeholder="Any notes or agenda? (optional)"
                    rows={2}
                    className={inputClass}
                  />
                  <button
                    onClick={handleBook}
                    disabled={submitting || !guestName.trim() || !guestEmail.trim()}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Booking..." : `Confirm ${selectedDuration}m at ${format(new Date(selectedSlot.startTime), "h:mm a")}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && booking && (
            <div className="p-8 text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <h2 className="text-lg font-bold text-gray-900">You&apos;re booked!</h2>
              <p className="text-sm text-gray-600">
                {format(new Date(booking.startTime), "EEEE, MMMM d")} at{" "}
                {format(new Date(booking.startTime), "h:mm a")}
              </p>
              <p className="text-xs text-gray-400">
                A confirmation has been noted. Add this to your calendar manually if needed.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by Calendar Land
        </p>
      </div>
    </div>
  );
}
