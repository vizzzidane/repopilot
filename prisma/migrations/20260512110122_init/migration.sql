-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoNameRaw" TEXT NOT NULL,
    "repoHtmlUrl" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "sourceFiles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Analysis_repoOwner_repoNameRaw_idx" ON "Analysis"("repoOwner", "repoNameRaw");
