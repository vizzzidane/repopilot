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
  "Reading selected files...",
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
  const [indexedFilesOpen, setIndexedFilesOpen] = useState(false);

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
    setIndexedFilesOpen(false);

    const loadingInterval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < ANALYZE_LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

            {analysis.sourceFiles?.length > 0 && (
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
                      {analysis.sourceFiles.length}
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
                    {analysis.sourceFiles.map((file: any, index: number) => (
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

              {analysis.mermaidDiagram && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-medium text-white">
                    Architecture Diagram
                  </h3>

                  <MermaidDiagram chart={analysis.mermaidDiagram} />
                </div>
              )}
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

                  {chatMermaidDiagram && (
                    <div className="mb-8">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          Execution Flow Diagram
                        </h3>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                          Generated from traced paths
                        </span>
                      </div>

                      <MermaidDiagram chart={chatMermaidDiagram} />
                    </div>
                  )}

                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
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
    </main>
  );
}