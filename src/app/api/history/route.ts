import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserAnalysisHistory } from "@/lib/analysisStore";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const history = await getUserAnalysisHistory(userId);

    return NextResponse.json({
      history,
    });
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