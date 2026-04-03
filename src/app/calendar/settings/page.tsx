"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useCalendars, useUpdateCalendar } from "@/hooks/useCalendars";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const { data: session } = useSession();
  const currentUserId = session?.user?.id as string | undefined;

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteExpiry, setInviteExpiry] = useState(7);
  const [generatedInvite, setGeneratedInvite] = useState<{ id: string; link: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [resetPwdId, setResetPwdId] = useState<string | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState("");

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
      setGeneratedInvite({ id: data.invite.id, link: data.link });
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
    },
    onError: () => toast.error("Failed to create invite"),
  });

  const revokeInvite = useMutation({
    mutationFn: (inviteId: string) =>
      fetch(`/api/invites/${inviteId}`, { method: "DELETE" }),
    onSuccess: (_data, inviteId) => {
      if (generatedInvite?.id === inviteId) setGeneratedInvite(null);
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      toast.success("Invite revoked");
    },
    onError: () => toast.error("Failed to revoke invite"),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) =>
      fetch(`/api/users/${userId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      setConfirmDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const resetPassword = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      setResetPwdId(null);
      setResetPwdValue("");
      toast.success("Password updated");
    },
    onError: () => toast.error("Failed to reset password"),
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
          <div key={u.id} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden">
            {/* User row */}
            <div className="flex items-center justify-between p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{u.name}</span>
                  {u.role === "admin" && (
                    <span className="text-[10px] px-1 py-0.5 rounded font-medium" style={{ background: "var(--pink, #ec4899)", color: "#fff" }}>admin</span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">{u.email} · {u.calendarCount} calendar{u.calendarCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-secondary)]">{new Date(u.createdAt).toLocaleDateString()}</span>
                {/* Reset password button */}
                <button
                  onClick={() => {
                    setResetPwdId(resetPwdId === u.id ? null : u.id);
                    setResetPwdValue("");
                    setConfirmDeleteId(null);
                  }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Reset pwd
                </button>
                {/* Delete button */}
                {u.id !== currentUserId && (
                  confirmDeleteId === u.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red-500">Delete?</span>
                      <button
                        onClick={() => deleteUser.mutate(u.id)}
                        disabled={deleteUser.isPending}
                        className="text-xs px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDeleteId(u.id); setResetPwdId(null); }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Inline reset password panel */}
            {resetPwdId === u.id && (
              <div className="px-3 pb-3 pt-2 border-t border-[var(--border-primary)] space-y-2">
                <label className="text-xs text-[var(--text-secondary)]">New password for {u.email}:</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={resetPwdValue}
                    onChange={(e) => setResetPwdValue(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                  />
                  <button
                    onClick={() => resetPassword.mutate({ userId: u.id, password: resetPwdValue })}
                    disabled={resetPwdValue.length < 6 || resetPassword.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-opacity"
                    style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
                  >
                    {resetPassword.isPending ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setResetPwdId(null); setResetPwdValue(""); }}
                    className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Pending Invites</h3>
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden">
              <div className="flex items-center justify-between p-3">
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
              {generatedInvite?.id === inv.id && (
                <div className="px-3 pb-3 space-y-1 border-t border-[var(--border-primary)] pt-2">
                  <label className="text-xs text-[var(--text-secondary)]">Invite link — copy and share:</label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={generatedInvite.link}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-xs font-mono"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(generatedInvite.link); toast.success("Copied!"); }}
                      className="px-2 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
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
            {createInvite.isPending ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Calendar Sync section
// ---------------------------------------------------------------------------

interface GoogleStatus {
  connected: boolean;
  connection: {
    googleEmail: string;
    googleCalendarId: string;
    calendarId: string | null;
    lastSyncedAt: string | null;
  } | null;
}

function SyncHelpPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-secondary)] flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span className="text-xs font-medium text-[var(--text-secondary)]">How does sync work?</span>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-[var(--text-secondary)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-primary)] pt-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)] flex-shrink-0"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
              <span className="text-xs font-medium">Google Calendar — 2-way sync</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-4">
              Events you create or edit in Calendar Land are instantly pushed to Google. Changes made in Google (new events, edits, deletions) are pulled back when you click <strong>Sync now</strong>. To set it up: click <strong>Connect</strong>, sign in with Google, then choose which Google calendar and which Calendar Land calendar to link.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)] flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span className="text-xs font-medium">iCal Feed — read-only subscription</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-4">
              Copy the feed URL and paste it into any calendar app (Apple Calendar, Google Calendar, Outlook…) as a <em>new calendar subscription</em>. Your events will appear there and stay updated automatically. This is one-way — changes in those apps won&apos;t come back to Calendar Land.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)] flex-shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="text-xs font-medium">Import & Export — one-time .ics transfer</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-4">
              Export a calendar as a <code className="font-mono bg-[var(--bg-tertiary)] px-0.5 rounded">.ics</code> file to back it up or open it in another app. Import a <code className="font-mono bg-[var(--bg-tertiary)] px-0.5 rounded">.ics</code> file to bring in events from Google, Apple, or any other calendar app. This is a snapshot — it doesn&apos;t stay in sync.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarSyncSection({ calendars }: { calendars: Calendar[] }) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? "";

  const { data: statusData, isLoading } = useQuery<GoogleStatus>({
    queryKey: ["google-status"],
    queryFn: () => fetch("/api/google/status").then((r) => r.json()),
  });

  const { data: gcalData } = useQuery<{ calendars: { id: string; summary: string; primary: boolean }[] }>({
    queryKey: ["google-calendars"],
    queryFn: () => fetch("/api/google/calendars").then((r) => r.json()),
    enabled: statusData?.connected === true,
  });

  const disconnect = useMutation({
    mutationFn: () => fetch("/api/google/disconnect", { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-status"] });
      toast.success("Google Calendar disconnected");
    },
  });

  const sync = useMutation({
    mutationFn: () => fetch("/api/google/sync", { method: "POST" }).then((r) => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["google-status"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      if (data.message) { toast.error(data.message); return; }
      toast.success(`Synced — +${data.added} added, ${data.updated} updated, ${data.deleted} deleted`);
    },
    onError: () => toast.error("Sync failed"),
  });

  const updateSettings = useMutation({
    mutationFn: (body: { calendarId?: string | null; googleCalendarId?: string }) =>
      fetch("/api/google/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["google-status"] }),
    onError: () => toast.error("Failed to save sync settings"),
  });

  const conn = statusData?.connection;
  const gcals = gcalData?.calendars ?? [];
  const feedUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/feed/${userId}`
    : "";

  if (isLoading) return <p className="text-xs text-[var(--text-secondary)]">Loading…</p>;

  return (
    <div className="space-y-4">

      <SyncHelpPanel />

      {/* Google Calendar */}
      <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Google G logo */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium">Google Calendar</span>
          </div>
          {statusData?.connected ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 font-medium">Connected</span>
          ) : (
            <a
              href="/api/google/connect"
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
            >
              Connect
            </a>
          )}
        </div>

        {statusData?.connected && conn && (
          <div className="space-y-3 pt-1 border-t border-[var(--border-primary)]">
            <p className="text-xs text-[var(--text-secondary)]">{conn.googleEmail}</p>

            {/* Google calendar selector */}
            {gcals.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-secondary)] w-32 flex-shrink-0">Google calendar</label>
                <select
                  value={conn.googleCalendarId}
                  onChange={(e) => updateSettings.mutate({ googleCalendarId: e.target.value })}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:outline-none"
                >
                  {gcals.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.summary}{c.primary ? " (primary)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Calendar Land calendar selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-secondary)] w-32 flex-shrink-0">Sync into</label>
              <select
                value={conn.calendarId ?? ""}
                onChange={(e) => updateSettings.mutate({ calendarId: e.target.value || null })}
                className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm focus:outline-none"
              >
                <option value="">— not linked —</option>
                {calendars.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sync now + disconnect */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => sync.mutate()}
                  disabled={sync.isPending || !conn.calendarId}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 transition-colors"
                >
                  {sync.isPending ? "Syncing…" : "Sync now"}
                </button>
                {conn.lastSyncedAt && (
                  <span className="text-xs text-[var(--text-secondary)]">
                    Last synced {new Date(conn.lastSyncedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <button
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>

            {!conn.calendarId && (
              <p className="text-xs text-amber-500">Select a &quot;Sync into&quot; calendar to enable sync.</p>
            )}
          </div>
        )}
      </div>

      {/* iCal feed */}
      <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-2">
        <div>
          <h3 className="text-sm font-medium">iCal Feed</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Subscribe to all your calendars in any calendar app (Google, Apple, Outlook…).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={feedUrl}
            className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-xs font-mono"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(feedUrl); toast.success("Copied!"); }}
            className="px-2 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-calendar import / export row
// ---------------------------------------------------------------------------

function CalendarICSRow({ calendar }: { calendar: Calendar }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport(file: File) {
    setImporting(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`/api/calendars/${calendar.id}/import`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message ?? "Import failed"); return; }
      toast.success(`Imported ${data.imported} event(s)${data.skipped ? `, ${data.skipped} skipped` : ""}`);
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: calendar.color }} />
        <span className="text-sm">{calendar.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`/api/calendars/${calendar.id}/export`}
          download
          className="px-2 py-1 rounded-lg border border-[var(--border-primary)] text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          Export .ics
        </a>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="px-2 py-1 rounded-lg border border-[var(--border-primary)] text-xs hover:bg-[var(--bg-tertiary)] disabled:opacity-50 transition-colors"
        >
          {importing ? "Importing…" : "Import .ics"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".ics,text/calendar"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { data: settings, isLoading } = useSettings();
  const { data: calendars, isLoading: calendarsLoading } = useCalendars();
  const updateSettings = useUpdateSettings();
  const searchParams = useSearchParams();

  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [secondaryTimezone, setSecondaryTimezone] = useState<string>("");
  const [tzSearch, setTzSearch] = useState("");
  const [autoStopTimer, setAutoStopTimer] = useState(true);

  // Show toast after Google OAuth redirect
  useEffect(() => {
    if (searchParams.get("sync_connected")) {
      toast.success("Google Calendar connected!");
      window.history.replaceState({}, "", "/calendar/settings");
    }
    const err = searchParams.get("sync_error");
    if (err) {
      const msgs: Record<string, string> = {
        denied: "Google sign-in was cancelled.",
        invalid: "OAuth state invalid. Please try again.",
        no_refresh_token: "No refresh token received. Try disconnecting and reconnecting.",
        token: "Failed to exchange token. Please try again.",
      };
      toast.error(msgs[err] ?? "Google connection failed.");
      window.history.replaceState({}, "", "/calendar/settings");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (settings) {
      setBufferMinutes(settings.bufferMinutes);
      setSecondaryTimezone(settings.secondaryTimezone ?? "");
      setAutoStopTimer(settings.autoStopTimer ?? true);
    }
  }, [settings]);

  async function handleSave() {
    updateSettings.mutate(
      {
        bufferMinutes,
        secondaryTimezone: secondaryTimezone || null,
        autoStopTimer,
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

      {/* Time Tracking */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Time Tracking</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure timer behaviour.
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            role="switch"
            aria-checked={autoStopTimer}
            onClick={() => setAutoStopTimer((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] ${
              autoStopTimer ? "bg-[var(--accent,#ec4899)]" : "bg-[var(--border-primary)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                autoStopTimer ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm">Auto-stop timer when linked event ends</span>
        </label>
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

      {/* Calendar Sync */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Calendar Sync</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Connect Google Calendar for 2-way sync, or subscribe via iCal feed.
          </p>
        </div>
        <CalendarSyncSection calendars={calendars ?? []} />
      </section>

      {/* Import / Export */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Import & Export</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Download your calendars as .ics or import events from any calendar app.
          </p>
        </div>
        {calendarsLoading ? (
          <p className="text-xs text-[var(--text-secondary)]">Loading…</p>
        ) : (
          <div className="space-y-2">
            {(calendars ?? []).map((cal: Calendar) => (
              <CalendarICSRow key={cal.id} calendar={cal} />
            ))}
          </div>
        )}
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
