"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useCalendars, useUpdateCalendar } from "@/hooks/useCalendars";
import { toast } from "sonner";
import Link from "next/link";
import type { Calendar } from "@/types/calendar";

const BUFFER_OPTIONS = [
  { label: "None", value: 0 },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Warsaw",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

// Per-calendar working hours editor
function CalendarAvailabilityRow({ calendar }: { calendar: Calendar }) {
  const updateCalendar = useUpdateCalendar();
  const [start, setStart] = useState(calendar.workingHoursStart);
  const [end, setEnd] = useState(calendar.workingHoursEnd);
  const [days, setDays] = useState<number[]>(calendar.workingDays);
  const [alwaysAvailable, setAlwaysAvailable] = useState(calendar.isAlwaysAvailable);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setStart(calendar.workingHoursStart);
    setEnd(calendar.workingHoursEnd);
    setDays(calendar.workingDays);
    setAlwaysAvailable(calendar.isAlwaysAvailable);
    setDirty(false);
  }, [calendar]);

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
    setDirty(true);
  }

  function handleSave() {
    updateCalendar.mutate(
      {
        id: calendar.id,
        data: {
          workingHoursStart: start,
          workingHoursEnd: end,
          workingDays: days,
          isAlwaysAvailable: alwaysAvailable,
        },
      },
      {
        onSuccess: () => { toast.success(`Saved for ${calendar.name}`); setDirty(false); },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  const inputClass =
    "px-2 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] disabled:opacity-40";

  return (
    <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
      {/* Calendar name + always-available toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: calendar.color }} />
          <span className="text-sm font-medium">{calendar.name}</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-[var(--text-secondary)]">Full availability</span>
          <button
            role="switch"
            aria-checked={alwaysAvailable}
            onClick={() => { setAlwaysAvailable((v) => !v); setDirty(true); }}
            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] ${
              alwaysAvailable ? "bg-[var(--accent,#ec4899)]" : "bg-[var(--border-primary)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                alwaysAvailable ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Working hours (disabled when always available) */}
      <div className={`flex items-center gap-2 transition-opacity ${alwaysAvailable ? "opacity-40 pointer-events-none" : ""}`}>
        <label className="text-xs text-[var(--text-secondary)] w-14 flex-shrink-0">Hours</label>
        <input
          type="time"
          value={start}
          disabled={alwaysAvailable}
          onChange={(e) => { setStart(e.target.value); setDirty(true); }}
          className={inputClass}
        />
        <span className="text-xs text-[var(--text-secondary)]">–</span>
        <input
          type="time"
          value={end}
          disabled={alwaysAvailable}
          onChange={(e) => { setEnd(e.target.value); setDirty(true); }}
          className={inputClass}
        />
      </div>

      {/* Working days (disabled when always available) */}
      <div className={`flex items-center gap-2 transition-opacity ${alwaysAvailable ? "opacity-40 pointer-events-none" : ""}`}>
        <label className="text-xs text-[var(--text-secondary)] w-14 flex-shrink-0">Days</label>
        <div className="flex gap-1">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              disabled={alwaysAvailable}
              onClick={() => toggleDay(idx)}
              className={`w-8 h-8 rounded-full text-[10px] font-medium border transition-all disabled:cursor-not-allowed ${
                days.includes(idx)
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                  : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
            >
              {label.slice(0, 2)}
            </button>
          ))}
        </div>
      </div>

      {alwaysAvailable && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          All hours and days are bookable — only blocked by existing events.
        </p>
      )}

      {dirty && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateCalendar.isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
            style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
          >
            {updateCalendar.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

interface UserRow { id: string; email: string; name: string; role: string; createdAt: string; calendarCount: number; }
interface InviteRow { id: string; token: string; email: string | null; expiresAt: string; usedAt: string | null; createdAt: string; }

function AdminUsersSection() {
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteExpiry, setInviteExpiry] = useState(7);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const { data: usersData } = useQuery<{ users: UserRow[] }>({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });

  const { data: invitesData } = useQuery<{ invites: InviteRow[] }>({
    queryKey: ["admin-invites"],
    queryFn: () => fetch("/api/invites").then((r) => r.json()),
  });

  const createInvite = useMutation({
    mutationFn: () =>
      fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail || null, expiresInDays: inviteExpiry }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setGeneratedLink(data.link);
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
    },
    onError: () => toast.error("Failed to create invite"),
  });

  const revokeInvite = useMutation({
    mutationFn: (inviteId: string) =>
      fetch(`/api/invites/${inviteId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      toast.success("Invite revoked");
    },
    onError: () => toast.error("Failed to revoke invite"),
  });

  const pendingInvites = (invitesData?.invites ?? []).filter((inv) => !inv.usedAt && new Date(inv.expiresAt) > new Date());

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Users</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Manage accounts and invite new users.
        </p>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {(usersData?.users ?? []).map((u) => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{u.name}</span>
                {u.role === "admin" && (
                  <span className="text-[10px] px-1 py-0.5 rounded font-medium" style={{ background: "var(--pink, #ec4899)", color: "#fff" }}>admin</span>
                )}
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{u.email} · {u.calendarCount} calendar{u.calendarCount !== 1 ? "s" : ""}</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{new Date(u.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Pending Invites</h3>
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <div>
                <span className="text-sm">{inv.email ?? "Open invite"}</span>
                <div className="text-xs text-[var(--text-secondary)]">
                  Expires {new Date(inv.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => revokeInvite.mutate(inv.id)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create invite */}
      <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
        <h3 className="text-xs font-semibold">Create Invite Link</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
          />
          <select
            value={inviteExpiry}
            onChange={(e) => setInviteExpiry(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:outline-none"
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
          </select>
          <button
            onClick={() => createInvite.mutate()}
            disabled={createInvite.isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
          >
            Generate
          </button>
        </div>
        {generatedLink && (
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">Invite link (copy and share):</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={generatedLink}
                className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-xs font-mono"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success("Copied!"); }}
                className="px-2 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { data: settings, isLoading } = useSettings();
  const { data: calendars, isLoading: calendarsLoading } = useCalendars();
  const updateSettings = useUpdateSettings();

  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [secondaryTimezone, setSecondaryTimezone] = useState<string>("");
  const [tzSearch, setTzSearch] = useState("");

  useEffect(() => {
    if (settings) {
      setBufferMinutes(settings.bufferMinutes);
      setSecondaryTimezone(settings.secondaryTimezone ?? "");
    }
  }, [settings]);

  async function handleSave() {
    updateSettings.mutate(
      {
        bufferMinutes,
        secondaryTimezone: secondaryTimezone || null,
      },
      {
        onSuccess: () => toast.success("Settings saved"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  const filteredTimezones = COMMON_TIMEZONES.filter((tz) =>
    tz.toLowerCase().includes(tzSearch.toLowerCase())
  );

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-[var(--text-secondary)]">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Buffer Time */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Buffer Time</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Add breathing room between events. Conflicts within this buffer show amber warnings.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {BUFFER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBufferMinutes(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                bufferMinutes === opt.value
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] font-medium"
                  : "border-[var(--border-primary)] hover:border-[var(--accent)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Calendar Working Hours */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Calendar Availability</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Set working hours and available days per calendar. Scheduling links inherit these settings.
          </p>
        </div>
        {calendarsLoading ? (
          <p className="text-xs text-[var(--text-secondary)]">Loading calendars…</p>
        ) : !calendars?.length ? (
          <p className="text-xs text-[var(--text-secondary)]">No calendars found.</p>
        ) : (
          <div className="space-y-3">
            {calendars.map((cal: Calendar) => (
              <CalendarAvailabilityRow key={cal.id} calendar={cal} />
            ))}
          </div>
        )}
      </section>

      {/* Secondary Timezone */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Secondary Timezone</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Show a second timezone column in the time grid.
          </p>
        </div>
        {secondaryTimezone ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] text-sm font-medium">
              {secondaryTimezone}
            </span>
            <button
              onClick={() => { setSecondaryTimezone(""); setTzSearch(""); }}
              className="text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={tzSearch}
              onChange={(e) => setTzSearch(e.target.value)}
              placeholder="Search timezones..."
              className={inputClass}
            />
            {tzSearch && (
              <div className="border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] max-h-48 overflow-y-auto">
                {filteredTimezones.length === 0 ? (
                  <p className="p-3 text-xs text-[var(--text-secondary)]">No matches</p>
                ) : (
                  filteredTimezones.map((tz) => (
                    <button
                      key={tz}
                      onClick={() => { setSecondaryTimezone(tz); setTzSearch(""); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      {tz}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Scheduling Links */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Scheduling Links</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Create public booking pages for others to schedule time with you.
          </p>
        </div>
        <Link
          href="/calendar/scheduling"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-sm hover:border-[var(--accent)] transition-colors"
        >
          Manage Scheduling Pages →
        </Link>
      </section>

      {/* Admin: Users & Invites */}
      {isAdmin && (
        <>
          <div className="pt-4 border-t border-[var(--border-primary)]" />
          <AdminUsersSection />
        </>
      )}

      {/* Save (buffer + secondary timezone) */}
      <div className="pt-4 border-t border-[var(--border-primary)]">
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
        >
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
