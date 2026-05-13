import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getUserAnalysesFromDb } from "@/lib/analysisDb";
import { createRequestId } from "@/lib/requestId";

export async function GET() {
  const requestId = createRequestId();

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const analyses = await getUserAnalysesFromDb(userId);

    const history = analyses.map((analysis) => ({
      analysisId: analysis.id,
      repoOwner: analysis.repoOwner,
      repoNameRaw: analysis.repoNameRaw,
      repoHtmlUrl: analysis.repoHtmlUrl,
      createdAt: analysis.createdAt.toISOString(),
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error({
      requestId,
      route: "/api/history",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        requestId,
        error: "Failed to fetch analysis history.",
      },
      { status: 500 }
    );
  }
}