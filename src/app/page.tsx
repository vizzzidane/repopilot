"use client";

import { useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/MermaidDiagram";
import HistoryPanel from "@/components/HistoryPanel";

const ANALYZE_LOADING_STEPS = [
  "Fetching repository tree...",
  "Scoring important files...",
  "Reading selected files...",
  "Mapping architecture...",
  "Generating onboarding guide...",
];

const CHAT_LOADING_STEPS = [
  "Reading selected files...",
  "Finding relevant code paths...",
  "Mapping execution flow...",
  "Checking missing context...",
  "Writing grounded answer...",
];

const MAX_MERMAID_CHARS = 4000;

const LOCAL_ANALYSIS_CACHE_KEY = "repopilot:analysis-cache";
const MAX_LOCAL_ANALYSIS_CACHE_ITEMS = 20;

type CachedAnalysisSnapshot = {
  analysisId: string;
  createdAt: string;
  analysis: any;
};

function readLocalAnalysisCache(): CachedAnalysisSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_ANALYSIS_CACHE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is CachedAnalysisSnapshot =>
        typeof item === "object" &&
        item !== null &&
        typeof item.analysisId === "string" &&
        typeof item.createdAt === "string" &&
        "analysis" in item
    );
  } catch {
    return [];
  }
}

function saveLocalAnalysisSnapshot(analysis: any) {
  if (typeof window === "undefined" || !analysis?.analysisId) {
    return;
  }

  const existing = readLocalAnalysisCache();

  const updated = [
    {
      analysisId: analysis.analysisId,
      createdAt: new Date().toISOString(),
      analysis,
    },
    ...existing.filter((item) => item.analysisId !== analysis.analysisId),
  ].slice(0, MAX_LOCAL_ANALYSIS_CACHE_ITEMS);

  window.localStorage.setItem(
    LOCAL_ANALYSIS_CACHE_KEY,
    JSON.stringify(updated)
  );
}

function getLocalAnalysisSnapshot(analysisId: string) {
  return readLocalAnalysisCache().find(
    (item) => item.analysisId === analysisId
  );
}

function sanitizeMermaidDiagram(input: unknown) {
  if (typeof input !== "string") {
    return "";
  }

  const trimmed = input.trim();

  if (!trimmed.startsWith("graph TD")) {
    return "";
  }

  if (trimmed.length > MAX_MERMAID_CHARS) {
    return "";
  }

  const allowedPattern = /^[A-Za-z0-9\s\-_()[\]{}<>:;"'.,|/&#+=*]+$/;

  if (!allowedPattern.test(trimmed)) {
    return "";
  }

  return trimmed;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLoadingStep, setChatLoadingStep] = useState(0);
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatMermaidDiagram, setChatMermaidDiagram] = useState("");
  const [indexedFilesOpen, setIndexedFilesOpen] = useState(false);
  const [historyLoadingId, setHistoryLoadingId] = useState("");

  const answerRef = useRef<HTMLDivElement | null>(null);

  function goToSignIn() {
    signIn("github", { redirectTo: "/" });
  }

  function getGitHubFileUrl(path: string) {
    if (!analysis?.repoHtmlUrl || !analysis?.defaultBranch) return "#";
    return `${analysis.repoHtmlUrl}/blob/${analysis.defaultBranch}/${path}`;
  }

  function formatNumber(value: number | undefined) {
    if (typeof value !== "number") return "N/A";
    return value.toLocaleString();
  }

  function formatRepoSize(sizeKb: number | undefined) {
    if (typeof sizeKb !== "number") return "N/A";
    if (sizeKb < 1024) return `${sizeKb} KB`;
    return `${(sizeKb / 1024).toFixed(1)} MB`;
  }

  function updateLoadingStage(stage: string) {
    toggleLoadingStage(stage);
  }

  function toggleLoadingStage(stage: string) {
    setLoadingStage(stage);
  }

  async function analyzeRepo() {
    if (!repoUrl.trim()) return;

    setLoading(true);
    updateLoadingStage("Validating repository");
    setLoadingStep(0);
    setError("");
    setAnalysis(null);
    setChatAnswer("");
    setChatMermaidDiagram("");
    setIndexedFilesOpen(false);

    const loadingInterval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < ANALYZE_LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1200);

    try {
      updateLoadingStage("Fetching repository structure");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze repository");
      }

      updateLoadingStage("Generating onboarding guide");

      updateLoadingStage("Building architecture map");
      setAnalysis(data);
      saveLocalAnalysisSnapshot(data);
      updateLoadingStage("Finalizing analysis");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      clearInterval(loadingInterval);
      setLoading(false);
      updateLoadingStage("");
    }
  }

  async function openHistoryAnalysis(analysisId: string) {
    const cached = getLocalAnalysisSnapshot(analysisId);

    setError("");
    setChatAnswer("");
    setChatMermaidDiagram("");
    setQuestion("");
    setIndexedFilesOpen(false);

    if (cached) {
      setAnalysis(cached.analysis);

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);

      return;
    }

    try {
      setHistoryLoadingId(analysisId);

      const res = await fetch(`/api/history/${analysisId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load saved analysis.");
      }

      setAnalysis(data);
      saveLocalAnalysisSnapshot(data);

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved analysis."
      );
    } finally {
      setHistoryLoadingId("");
    }
  }

  async function askQuestion() {
    if (!question.trim() || !analysis?.analysisId) return;

    setChatLoading(true);
    setChatLoadingStep(0);
    setChatAnswer("");
    setChatMermaidDiagram("");

    const chatInterval = setInterval(() => {
      setChatLoadingStep((prev) =>
        prev < CHAT_LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          analysisId: analysis.analysisId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to answer question");
      }

      setChatAnswer(data.answerMarkdown || data.answer || "");
      setChatMermaidDiagram(sanitizeMermaidDiagram(data.mermaidDiagram));

      setTimeout(() => {
        answerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err: any) {
      setChatAnswer(`Error: ${err.message}`);
      setChatMermaidDiagram("");

      setTimeout(() => {
        answerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } finally {
      clearInterval(chatInterval);
      setChatLoading(false);
    }
  }

  function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function buildOnboardingMarkdown() {
    if (!analysis) {
      return "";
    }

    return `# ${analysis.repoOwner}/${analysis.repoNameRaw}

## Repository Summary

${analysis.summary || "No summary available."}

---

## Architecture Overview

${analysis.mermaidDiagram || "No architecture diagram available."}

---

## Repository Risks

${
  Array.isArray(analysis.repositoryRisks) &&
  analysis.repositoryRisks.length > 0
    ? analysis.repositoryRisks
        .map(
          (risk: {
            level: string;
            title: string;
            description: string;
          }) =>
            `- [${risk.level.toUpperCase()}] ${risk.title}: ${risk.description}`
        )
        .join("\n")
    : "No major repository risks detected."
}

---

## Indexed Files

${
  Array.isArray(analysis.indexedFiles)
    ? analysis.indexedFiles
        .map((file: { path: string }) => `- ${file.path}`)
        .join("\n")
    : "No indexed files."
}
`;
  }

  const safeArchitectureDiagram = sanitizeMermaidDiagram(
    analysis?.mermaidDiagram
  );

  const safeChatDiagram = sanitizeMermaidDiagram(chatMermaidDiagram);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              RepoPilot
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              AI onboarding copilot
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isSignedIn && (
              <button
                onClick={goToSignIn}
                className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Sign in
              </button>
            )}

            {isSignedIn && (
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <span className="hidden text-xs text-zinc-400 sm:inline">
                  {session?.user?.email || session?.user?.name || "Signed in"}
                </span>
                <button
                  onClick={() => signOut({ redirectTo: "/" })}
                  className="text-xs text-zinc-300 transition hover:text-white"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-zinc-300 backdrop-blur">
            GitHub repo intelligence
          </div>

          <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Understand any GitHub repository in minutes.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Analyze public GitHub repositories, understand architecture, trace
            execution flow, and generate onboarding guidance.
          </p>

          {isSignedIn ? (
            <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-4 sm:flex-row">
              <input
                type="text"
                placeholder="Paste a GitHub repository URL..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") analyzeRepo();
                }}
                className="flex-1 rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-white outline-none transition focus:border-white/30"
              />

              <button
                onClick={analyzeRepo}
                disabled={loading}
                className="rounded-2xl bg-white px-6 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading
                  ? loadingStage || "Analyzing repository..."
                  : "Analyze Repo"}
              </button>
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm leading-7 text-zinc-300">
                Sign in to analyze repositories, save your history, and ask repo-specific questions.
              </p>

              <button
                onClick={goToSignIn}
                className="mt-4 rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Sign in to continue
              </button>
            </div>
          )}

          {loading && (
            <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="text-sm font-medium text-blue-200">
                RepoPilot is analyzing the repository
              </div>

              <div className="mt-2 text-sm text-zinc-300">
                {loadingStage || "Preparing analysis..."}
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-400" />
              </div>
            </div>
          )}

          {loading && (
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
                <p className="text-sm font-medium text-white">
                  {ANALYZE_LOADING_STEPS[loadingStep]}
                </p>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  1. Fetching repository tree
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  2. Selecting relevant files
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  3. Generating architecture
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}
        </section>

        {analysis && (
          <section className="mt-16 space-y-8">
            {Array.isArray(analysis?.analysisWarnings) &&
              analysis.analysisWarnings.length > 0 && (
                <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <div className="text-sm font-semibold text-yellow-200">
                    Partial Repository Analysis
                  </div>

                  <div className="mt-2 space-y-1">
                    {analysis.analysisWarnings.map(
                      (warning: string, index: number) => (
                        <div
                          key={`${warning}-${index}`}
                          className="text-sm text-yellow-100/90"
                        >
                          • {warning}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {Array.isArray(analysis?.repositoryRisks) &&
              analysis.repositoryRisks.length > 0 && (
                <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Repository Risk Scanner
                      </h3>

                      <div className="mt-1 text-sm text-zinc-400">
                        Automated engineering and repository hygiene observations.
                      </div>
                    </div>

                    <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">
                      Experimental
                    </div>
                  </div>

                  <div className="space-y-3">
                    {analysis.repositoryRisks.map(
                      (
                        risk: {
                          level: string;
                          title: string;
                          description: string;
                        },
                        index: number
                      ) => {
                        const riskStyles =
                          risk.level === "high"
                            ? "border-red-500/20 bg-red-500/10 text-red-200"
                            : risk.level === "medium"
                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-200"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-200";

                        return (
                          <div
                            key={`${risk.title}-${index}`}
                            className={`rounded-xl border p-4 ${riskStyles}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {risk.title}
                                </div>

                                <div className="mt-1 text-sm opacity-90">
                                  {risk.description}
                                </div>
                              </div>

                              <div className="shrink-0 rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-wide">
                                {risk.level}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
              <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                Repository Summary
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {analysis.projectName}
                  </h2>

                  <p className="mt-4 max-w-4xl leading-7 text-zinc-300">
                    {analysis.summary}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        downloadTextFile(
                          `${analysis.repoNameRaw || "repository"}-onboarding.md`,
                          buildOnboardingMarkdown()
                        )
                      }
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-black/30"
                    >
                      Export onboarding.md
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          buildOnboardingMarkdown()
                        );
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-black/30"
                    >
                      Copy Markdown
                    </button>
                  </div>
                </div>

                {analysis.analyzedFileCount && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                    {analysis.analyzedFileCount} files analyzed
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Stars
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatNumber(analysis.repoStars)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Forks
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatNumber(analysis.repoForks)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Language
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {analysis.repoLanguage || "N/A"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Branch
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {analysis.defaultBranch || "N/A"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Repo Size
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatRepoSize(analysis.repoSizeKb)}
                  </p>
                  {typeof analysis?.analyzedFileCount === "number" && (
                    <div className="text-xs text-zinc-500">
                      Analyzed files: {analysis.analyzedFileCount}
                    </div>
                  )}
                </div>
              </div>

              {analysis.techStack?.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-medium">Tech Stack</h3>

                  <div className="flex flex-wrap gap-2">
                    {analysis.techStack.map((tech: string) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analysis.indexedFiles?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                      Indexing Agent
                    </div>

                    <h2 className="text-2xl font-semibold">
                      Indexed Repository Files
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      These are the files RepoPilot selected and used as
                      grounding context for the analysis.
                    </p>
                    {analysis?.indexingStrategy && (
                      <div className="mt-3 text-xs text-zinc-500">
                        {analysis.indexingStrategy}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIndexedFilesOpen((prev) => !prev)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  >
                    {indexedFilesOpen ? "Hide files" : "Show files"}
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Indexed Files
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {analysis.indexedFiles.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Strategy
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-300">
                      Selective scoring
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Grounding
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-300">
                      File-level context
                    </p>
                  </div>
                </div>

                {indexedFilesOpen && (
                  <div className="mt-6 grid gap-3">
                    {analysis.indexedFiles.map((file: any, index: number) => (
                      <a
                        key={file.path}
                        href={getGitHubFileUrl(file.path)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        <div>
                          <p className="font-mono text-sm font-semibold text-white">
                            {file.path}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Selected as grounding file #{index + 1}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                          Open in GitHub
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
              <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                Architecture Agent
              </div>

              <h2 className="text-2xl font-semibold">
                High-level Architecture
              </h2>

              <p className="mt-6 leading-7 text-zinc-300">
                {analysis.architectureExplanation}
              </p>

              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Repository Architecture
                    </h3>

                    <div className="mt-1 text-sm text-zinc-400">
                      High-level execution and dependency flow inferred from the analyzed repository files.
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">
                    AI Generated
                  </div>
                </div>

                {safeArchitectureDiagram ? (
                  <>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020] p-4">
                      <MermaidDiagram chart={safeArchitectureDiagram} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="rounded-full border border-white/10 px-2 py-1">
                        Mermaid Diagram
                      </span>

                      {typeof analysis?.analyzedFileCount === "number" && (
                        <span className="rounded-full border border-white/10 px-2 py-1">
                          {analysis.analyzedFileCount} files analyzed
                        </span>
                      )}

                      {analysis?.partialAnalysis && (
                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-yellow-200">
                          Partial analysis
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-500">
                    RepoPilot could not confidently infer a repository-wide architecture graph from the selected files.
                  </div>
                )}
              </div>
            </div>

            {analysis.keyFiles?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
                <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                  Onboarding Agent
                </div>

                <h2 className="text-2xl font-semibold">
                  Key Files to Inspect
                </h2>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  Start here if you are joining this repository for the first
                  time.
                </p>

                <div className="mt-6 grid gap-4">
                  {analysis.keyFiles.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-black/30 p-5"
                    >
                      <a
                        href={getGitHubFileUrl(file.path)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-sm font-semibold text-white underline decoration-white/20 underline-offset-4 transition hover:text-zinc-300"
                      >
                        {file.path}
                      </a>

                      <p className="mt-3 text-sm leading-7 text-zinc-300">
                        <span className="font-semibold text-white">
                          Why it matters:{" "}
                        </span>
                        {file.importance}
                      </p>

                      <p className="mt-2 text-sm leading-7 text-zinc-400">
                        <span className="font-semibold text-zinc-200">
                          What to inspect:{" "}
                        </span>
                        {file.whatToLookFor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.setupSteps?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
                <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                  Setup Agent
                </div>

                <h2 className="text-2xl font-semibold">Setup Steps</h2>

                <ol className="mt-6 space-y-3 text-zinc-300">
                  {analysis.setupSteps.map((step: string, index: number) => (
                    <li
                      key={index}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 leading-7"
                    >
                      <span className="mr-3 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {analysis.firstContributionTasks?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
                <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                  Contribution Agent
                </div>

                <h2 className="text-2xl font-semibold">
                  First Contribution Tasks
                </h2>

                <div className="mt-6 grid gap-4">
                  {analysis.firstContributionTasks.map(
                    (task: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-white/10 bg-black/30 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-lg font-medium">{task.title}</h3>

                          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                            {task.difficulty}
                          </span>
                        </div>

                        <p className="mt-3 leading-7 text-zinc-400">
                          {task.whyThisMatters}
                        </p>

                        {task.filesToInspect?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {task.filesToInspect.map((file: string) => (
                              <a
                                key={file}
                                href={getGitHubFileUrl(file)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                              >
                                {file}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {analysis.risksOrUnknowns?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
                <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                  Risk Analysis Agent
                </div>

                <h2 className="text-2xl font-semibold">Risks / Unknowns</h2>

                <ul className="mt-6 space-y-3 text-zinc-300">
                  {analysis.risksOrUnknowns.map(
                    (risk: string, index: number) => (
                      <li key={index} className="leading-7">
                        • {risk}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
              <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
                Execution Tracing Agent
              </div>

              <h2 className="text-2xl font-semibold">Ask this repository</h2>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <input
                  type="text"
                  placeholder="Ask a repository-specific engineering question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") askQuestion();
                  }}
                  className="flex-1 rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none transition focus:border-white/30"
                />

                <button
                  onClick={askQuestion}
                  disabled={chatLoading}
                  className="rounded-2xl bg-white px-6 py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {chatLoading ? "Tracing..." : "Ask"}
                </button>
              </div>

              {chatLoading && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
                    <p className="text-sm font-medium text-white">
                      {CHAT_LOADING_STEPS[chatLoadingStep]}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      1. Reading file context
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      2. Mapping control flow
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      3. Generating answer
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Give me the high-level architecture of this repository.",
                  "Trace the lifecycle of an API request.",
                  "If I joined this project today, where should I start?",
                  "Suggest a safe first contribution for a new contributor.",
                  "Which parts of this repo are risky to modify?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setQuestion(prompt)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {chatAnswer && (
                <div
                  ref={answerRef}
                  className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-black/70 p-8 shadow-2xl"
                >
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                        RepoPilot Output
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-white">
                        Engineering Analysis
                      </h3>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                      Grounded in selected files
                    </span>
                  </div>

                  {safeChatDiagram && (
                    <div className="mb-8">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          Execution Flow Diagram
                        </h3>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                          Generated from traced paths
                        </span>
                      </div>

                      <MermaidDiagram chart={safeChatDiagram} />
                    </div>
                  )}

                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-6 text-3xl font-bold tracking-tight text-white">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-4 mt-8 border-t border-white/10 pt-6 text-xl font-semibold text-white first:mt-0 first:border-t-0 first:pt-0">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-3 mt-6 text-lg font-semibold text-zinc-100">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-5 max-w-4xl text-[15px] leading-8 text-zinc-300">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-6 ml-6 list-disc space-y-2 text-zinc-300">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-6 ml-6 list-decimal space-y-4 text-zinc-300">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="max-w-4xl pl-1 text-[15px] leading-8 text-zinc-300">
                          {children}
                        </li>
                      ),
                      code: ({ children }) => (
                        <code className="rounded-md border border-white/10 bg-zinc-950 px-1.5 py-0.5 text-[13px] text-zinc-100">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="mb-6 overflow-x-auto rounded-2xl border border-white/10 bg-black p-5 text-sm leading-7 text-zinc-100">
                          {children}
                        </pre>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">
                          {children}
                        </strong>
                      ),
                      hr: () => <hr className="my-8 border-white/10" />,
                    }}
                  >
                    {chatAnswer}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl">
        {isSignedIn && (
          <HistoryPanel
            activeAnalysisId={analysis?.analysisId}
            loadingAnalysisId={historyLoadingId}
            onSelect={openHistoryAnalysis}
          />
        )}
      </div>
    </main>
  );
}