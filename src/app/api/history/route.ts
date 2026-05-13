import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getUserAnalysesFromDb } from "@/lib/analysisDb";

export async function GET() {
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

    const history = analyses.map(
      (analysis: {
        id: string;
        repoOwner: string;
        repoNameRaw: string;
        repoHtmlUrl: string;
        createdAt: Date;
      }) => ({
        analysisId: analysis.id,
        repoOwner: analysis.repoOwner,
        repoNameRaw: analysis.repoNameRaw,
        repoHtmlUrl: analysis.repoHtmlUrl,
        createdAt: analysis.createdAt.toISOString(),
      })
    );

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch analysis history",
      },
      { status: 500 }
    );
  }
}