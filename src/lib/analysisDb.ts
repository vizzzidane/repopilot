import { prisma } from "@/lib/prisma";

type SaveAnalysisParams = {
  id: string;
  userId: string;

  repoOwner: string;
  repoNameRaw: string;
  repoHtmlUrl: string;
  defaultBranch: string;

  sourceFiles: {
    path: string;
    content: string;
  }[];

  createdAt?: string;
};

function sanitizeForJson(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\\/g, "\\\\");
}

export async function saveAnalysisToDb(params: SaveAnalysisParams) {
  return prisma.analysis.create({
    data: {
      id: params.id,
      userId: params.userId,

      repoOwner: params.repoOwner,
      repoNameRaw: params.repoNameRaw,
      repoHtmlUrl: params.repoHtmlUrl,
      defaultBranch: params.defaultBranch,

      sourceFiles: params.sourceFiles.map((file) => ({
        path: sanitizeForJson(file.path),
        contentPreview: sanitizeForJson(file.content.slice(0, 1000)),
        contentLength: file.content.length,
      })),

      createdAt: params.createdAt ? new Date(params.createdAt) : undefined,
    },
  });
}

export async function getUserAnalysesFromDb(userId: string) {
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

export async function getAnalysisFromDb(analysisId: string, userId: string) {
  return prisma.analysis.findFirst({
    where: {
      id: analysisId,
      userId,
    },
  });
}