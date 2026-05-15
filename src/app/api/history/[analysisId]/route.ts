import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getAnalysisFromDb } from "@/lib/analysisDb";
import { createRequestId } from "@/lib/requestId";

type RouteContext = {
  params: Promise<{
    analysisId: string;
  }>;
};

const MAX_ANALYSIS_ID_LENGTH = 100;
const MAX_HISTORY_SOURCE_FILES = 50;
const MAX_HISTORY_SOURCE_CHARS_PER_FILE = 2000;

export async function GET(_req: NextRequest, context: RouteContext) {
  const requestId = createRequestId();

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          requestId,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const { analysisId } = await context.params;

    if (
      !analysisId ||
      typeof analysisId !== "string" ||
      analysisId.length > MAX_ANALYSIS_ID_LENGTH
    ) {
      return NextResponse.json(
        {
          requestId,
          error: "Invalid analysisId.",
        },
        { status: 400 },
      );
    }

    const analysis = await getAnalysisFromDb(analysisId, userId);

    if (!analysis) {
      return NextResponse.json(
        {
          requestId,
          error: "Analysis not found.",
        },
        { status: 404 },
      );
    }

    const safeSourceFiles = Array.isArray(analysis.sourceFiles)
      ? analysis.sourceFiles.slice(0, MAX_HISTORY_SOURCE_FILES).map((file) => {
          if (
            typeof file !== "object" ||
            file === null ||
            !("path" in file) ||
            !("content" in file)
          ) {
            return null;
          }

          const path = (file as { path?: unknown }).path;
          const content = (file as { content?: unknown }).content;

          if (typeof path !== "string" || typeof content !== "string") {
            return null;
          }

          return {
            path,
            content: content.slice(0, MAX_HISTORY_SOURCE_CHARS_PER_FILE),
          };
        })
      : [];

    return NextResponse.json(
      {
        requestId,

        analysisId: analysis.id,

        repoOwner: analysis.repoOwner,
        repoNameRaw: analysis.repoNameRaw,
        repoHtmlUrl: analysis.repoHtmlUrl,
        defaultBranch: analysis.defaultBranch,

        sourceFiles: safeSourceFiles.filter(Boolean),

        createdAt: analysis.createdAt.toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error({
      requestId,
      route: "/api/history/[analysisId]",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        requestId,
        error: "Failed to load analysis.",
      },
      { status: 500 },
    );
  }
}