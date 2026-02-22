"use client";

import { useState } from "react";
import { useSchedulingPages, useDeleteSchedulingPage } from "@/hooks/useSchedulingPages";
import { SchedulingPageForm } from "@/components/scheduling/SchedulingPageForm";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import type { SchedulingPage } from "@/types/scheduling";

export default function SchedulingPage() {
  const { data: pages, isLoading } = useSchedulingPages();
  const deletePage = useDeleteSchedulingPage();
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<SchedulingPage | null>(null);

  function handleCopyLink(slug: string) {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied!"),
      () => toast.error("Failed to copy link")
    );
  }

  function handleDelete(page: SchedulingPage) {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    deletePage.mutate(page.id, {
      onSuccess: () => toast.success("Scheduling page deleted"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Scheduling Pages</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Create public links that let guests book time with you.
          </p>
        </div>
        <Button
          onClick={() => { setEditingPage(null); setShowForm(true); }}
          size="sm"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Page
        </Button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">
            {editingPage ? `Edit: ${editingPage.title}` : "New Scheduling Page"}
          </h2>
          <SchedulingPageForm
            page={editingPage ?? undefined}
            onClose={() => { setShowForm(false); setEditingPage(null); }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-[var(--text-secondary)]">Loading...</div>
      ) : pages && pages.length > 0 ? (
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{page.title}</h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        page.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {page.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {page.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                      {page.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-[var(--text-secondary)]">
                    <span>
                      {page.durations.map((d) => (d < 60 ? `${d}m` : `${d / 60}h`)).join(", ")}
                    </span>
                    <span>·</span>
                    <span>{page.daysInAdvance} days ahead</span>
                    {page.bufferMinutes > 0 && (
                      <>
                        <span>·</span>
                        <span>{page.bufferMinutes}m buffer</span>
                      </>
                    )}
                    {(page.bookingCount ?? 0) > 0 && (
                      <>
                        <span>·</span>
                        <span>{page.bookingCount} booking{(page.bookingCount ?? 0) !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-[var(--text-tertiary)]">/book/{page.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopyLink(page.slug)}
                    className="px-2.5 py-1.5 rounded-lg text-xs border border-[var(--border-primary)] hover:border-[var(--accent)] transition-colors"
                    title="Copy booking link"
                  >
                    Copy link
                  </button>
                  <button
                    onClick={() => { setEditingPage(page); setShowForm(true); }}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    title="Edit"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M10.5 2.5l2 2L5.5 11.5H3.5v-2L10.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(page)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3 4h9M5 4V3h5v1M5 6v5M10 6v5M4 4l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <p className="text-sm">No scheduling pages yet.</p>
          <p className="text-xs mt-1 opacity-70">Create one to start accepting bookings.</p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            Create your first page
          </Button>
        </div>
      ) : null}
    </div>
  );
}
