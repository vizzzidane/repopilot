import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type SaveAnalysisParams = {
  id: string;
  userId: string;

  repoOwner: string;
  repoNameRaw: string;
  repoHtmlUrl: string;
  defaultBranch: string;

  sourceFiles: Prisma.InputJsonValue;

  createdAt?: string;
};

export async function saveAnalysisToDb(
  params: SaveAnalysisParams
) {
  return prisma.analysis.create({
    data: {
      id: params.id,
      userId: params.userId,

      repoOwner: params.repoOwner,
      repoNameRaw: params.repoNameRaw,
      repoHtmlUrl: params.repoHtmlUrl,
      defaultBranch: params.defaultBranch,

      sourceFiles: params.sourceFiles,

      createdAt: params.createdAt
        ? new Date(params.createdAt)
        : undefined,
    },
  });
}

export async function getUserAnalysesFromDb(
  userId: string
) {
  return prisma.analysis.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 50,
  });
}

export async function getAnalysisFromDb(analysisId: string) {
  return prisma.analysis.findUnique({
    where: {
      id: analysisId,
    },
  });
}