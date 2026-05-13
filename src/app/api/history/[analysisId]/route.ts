import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getAnalysisFromDb } from "@/lib/analysisDb";
import { createRequestId } from "@/lib/requestId";

type RouteContext = {
  params: Promise<{
    analysisId: string;
  }>;
};

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  const requestId = createRequestId();

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const { analysisId } = await context.params;

    if (
      !analysisId ||
      typeof analysisId !== "string" ||
      analysisId.length > 100
    ) {
      return NextResponse.json(
        {
          error: "Invalid analysisId.",
        },
        { status: 400 }
      );
    }

    const analysis = await getAnalysisFromDb(
      analysisId,
      userId
    );

    if (!analysis) {
      return NextResponse.json(
        {
          error: "Analysis not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysisId: analysis.id,

      repoOwner: analysis.repoOwner,
      repoNameRaw: analysis.repoNameRaw,
      repoHtmlUrl: analysis.repoHtmlUrl,
      defaultBranch: analysis.defaultBranch,

      sourceFiles: analysis.sourceFiles,

      createdAt: analysis.createdAt.toISOString(),
    });
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
      { status: 500 }
    );
  }
}