import { z } from "zod";

export const AnalyzeResponseSchema = z.object({
  projectName: z.string().min(1),
  summary: z.string().min(1),
  techStack: z.array(z.string()).default([]),
  setupSteps: z.array(z.string()).default([]),
  keyFiles: z
    .array(
      z.object({
        path: z.string().min(1),
        importance: z.string().min(1),
        whatToLookFor: z.string().min(1),
      })
    )
    .default([]),
  architectureExplanation: z.string().min(1),
  mermaidDiagram: z.string().default(""),
  firstContributionTasks: z
    .array(
      z.object({
        title: z.string().min(1),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        filesToInspect: z.array(z.string()).default([]),
        whyThisMatters: z.string().min(1),
      })
    )
    .default([]),
  risksOrUnknowns: z.array(z.string()).default([]),
});

export const ChatResponseSchema = z.object({
  answerMarkdown: z.string().min(1),
  mermaidDiagram: z.string().default(""),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;