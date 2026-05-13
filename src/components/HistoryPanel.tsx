"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  analysisId: string;
  repoOwner: string;
  repoNameRaw: string;
  repoHtmlUrl: string;
  createdAt: string;
};

type Props = {
  activeAnalysisId?: string;
  loadingAnalysisId?: string;
  onSelect?: (analysisId: string) => void;
};

function formatHistoryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

export default function HistoryPanel({
  activeAnalysisId,
  loadingAnalysisId,
  onSelect,
}: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/history", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load history.");
        }

        if (!cancelled) {
          setHistory(Array.isArray(data.history) ? data.history : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recent Analyses</h2>

        <span className="text-xs text-zinc-500">
          {loading ? "Loading" : `${history.length} saved`}
        </span>
      </div>

      {loading && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          Loading history...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
          No analyses yet.
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => {
            const isActive = item.analysisId === activeAnalysisId;
            const isLoading = item.analysisId === loadingAnalysisId;

            return (
              <button
                key={item.analysisId}
                type="button"
                disabled={isLoading}
                onClick={() => onSelect?.(item.analysisId)}
                className={[
                  "w-full rounded-xl border p-4 text-left transition",
                  isLoading ? "cursor-wait opacity-80" : "",
                  isActive
                    ? "border-blue-400/50 bg-blue-500/10"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">
                      {item.repoOwner}/{item.repoNameRaw}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      {formatHistoryDate(item.createdAt)}
                    </div>
                  </div>

                  <div className="shrink-0 text-xs text-zinc-400">
                    {isLoading ? "Loading..." : isActive ? "Current" : "Open"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}