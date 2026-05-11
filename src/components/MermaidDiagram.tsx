"use client";

import mermaid from "mermaid";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  chart: string;
};

const MAX_MERMAID_CHARS = 4000;

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "strict",
});

function sanitizeMermaid(input: string) {
  const cleaned = input
    .replace(/```mermaid/g, "")
    .replace(/```/g, "")
    .trim();

  if (!cleaned.startsWith("graph TD")) {
    return "";
  }

  if (cleaned.length > MAX_MERMAID_CHARS) {
    return "";
  }

  const allowedPattern = /^[A-Za-z0-9\s\-_()[\]{}<>:;"'.,|/&#+=*]+$/;

  if (!allowedPattern.test(cleaned)) {
    return "";
  }

  return cleaned;
}

export default function MermaidDiagram({ chart }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [error, setError] = useState(false);
  const [rawChart, setRawChart] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!ref.current || !chart) return;

      try {
        setError(false);

        const cleanedChart = sanitizeMermaid(chart);
        setRawChart(cleanedChart);

        if (!cleanedChart) {
          setError(true);
          return;
        }

        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9-_]/g, "")}`;
        const result = await mermaid.render(id, cleanedChart);

        if (cancelled || !ref.current) return;

        ref.current.replaceChildren();

        const parser = new DOMParser();
        const doc = parser.parseFromString(result.svg, "image/svg+xml");
        const svg = doc.documentElement;

        if (svg.tagName.toLowerCase() !== "svg") {
          setError(true);
          return;
        }

        ref.current.appendChild(svg);
      } catch {
        setError(true);
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="mb-3 text-sm font-medium text-red-400">
          Diagram render fallback
        </p>

        <pre className="whitespace-pre-wrap text-xs leading-6 text-zinc-300">
          {rawChart || "Diagram could not be rendered safely."}
        </pre>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#020617] p-6">
      <div ref={ref} className="flex min-w-[700px] justify-center" />
    </div>
  );
}