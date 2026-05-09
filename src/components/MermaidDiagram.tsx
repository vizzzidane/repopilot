"use client";

import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

type Props = {
  chart: string;
};

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

function sanitizeMermaid(input: string) {
  return input
    .replace(/```mermaid/g, "")
    .replace(/```/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "")
    .replace(/:/g, "")
    .replace(/;/g, "")
    .replace(/\{/g, "")
    .replace(/\}/g, "")
    .trim();
}

export default function MermaidDiagram({ chart }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [rawChart, setRawChart] = useState("");

  useEffect(() => {
    async function renderDiagram() {
      if (!ref.current || !chart) return;

      try {
        setError(false);

        const cleanedChart = sanitizeMermaid(chart);
        setRawChart(cleanedChart);

        const id = `mermaid-${Date.now()}`;
        const result = await mermaid.render(id, cleanedChart);

        ref.current.innerHTML = result.svg;
      } catch (err) {
        console.error("Mermaid render failed:", err);
        setError(true);
      }
    }

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="mb-3 text-sm font-medium text-red-400">
          Diagram render fallback
        </p>

        <pre className="whitespace-pre-wrap text-xs leading-6 text-zinc-300">
          {rawChart}
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