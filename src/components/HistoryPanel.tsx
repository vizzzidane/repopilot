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
  onSelect?: (analysisId: string) => void;
};

export default function HistoryPanel({ onSelect }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);

        const res = await fetch("/api/history");

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load history");
        }

        setHistory(data.history || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load history"
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Recent Analyses
        </h2>

        <span className="text-xs text-zinc-500">
          {history.length} saved
        </span>
      </div>

      {loading && (
        <div className="text-sm text-zinc-400">
          Loading history...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="text-sm text-zinc-500">
          No analyses yet.
        </div>
      )}

      <div className="space-y-3">
        {history.map((item) => (
          <button
            key={item.analysisId}
            onClick={() => onSelect?.(item.analysisId)}
            className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20 hover:bg-black/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-white">
                  {item.repoOwner}/{item.repoNameRaw}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="text-xs text-zinc-400">
                Open
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}