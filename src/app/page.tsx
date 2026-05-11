"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/MermaidDiagram";

const ANALYZE_LOADING_STEPS = [
  "Fetching repository tree...",
  "Scoring important files...",
  "Reading selected files...",
  "Mapping architecture...",
  "Generating onboarding guide...",
];

const CHAT_LOADING_STEPS = [
  "Reading indexed repository...",
  "Finding relevant code paths...",
  "Mapping execution flow...",
  "Checking missing context...",
  "Writing grounded answer...",
];

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLoadingStep, setChatLoadingStep] = useState(0);
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatMermaidDiagram, setChatMermaidDiagram] = useState("");

  const answerRef = useRef<HTMLDivElement | null>(null);

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

  async function analyzeRepo() {
    if (!repoUrl.trim()) return;

    setLoading(true);
    setLoadingStep(0);
    setError("");
    setAnalysis(null);
    setChatAnswer("");
    setChatMermaidDiagram("");

    const loadingInterval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < ANALYZE_LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze repository");
      }

      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      clearInterval(loadingInterval);
      setLoading(false);
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
        headers: {
          "Content-Type": "application/json",
        },
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
      setChatMermaidDiagram(data.mermaidDiagram || "");

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

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-zinc-300 backdrop-blur">
            AI codebase intelligence platform
          </div>

          <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Understand any GitHub repository in minutes.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            RepoPilot selectively indexes repositories and generates architecture
            insights, execution traces, onboarding guidance, contribution plans,
            and grounded engineering answers.
          </p>

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
              {loading ? "Indexing Repo..." : "Analyze Repo"}
            </button>
          </div>

          {loading && (
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
                <p className="text-sm font-medium text-white">
                  {ANALYZE_LOADING_STEPS[loadingStep]}
                </p>
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
                </div>
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
                </div>
              )}

              {chatAnswer && (
                <div
                  ref={answerRef}
                  className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-black/70 p-8"
                >
                  {chatMermaidDiagram && (
                    <div className="mb-8">
                      <MermaidDiagram chart={chatMermaidDiagram} />
                    </div>
                  )}

                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {chatAnswer}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}