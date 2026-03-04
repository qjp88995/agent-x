-- CreateTable: AgentVersion (must exist before data migration)
CREATE TABLE "AgentVersion" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "skillsSnapshot" JSONB NOT NULL DEFAULT '[]',
    "mcpServersSnapshot" JSONB NOT NULL DEFAULT '[]',
    "changelog" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ShareToken
CREATE TABLE "ShareToken" (
    "id" TEXT NOT NULL,
    "agentVersionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxConversations" INTEGER,
    "usedConversations" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentVersion_agentId_version_key" ON "AgentVersion"("agentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ShareToken_token_key" ON "ShareToken"("token");

-- DataMigration: Create version snapshots for PUBLISHED agents
INSERT INTO "AgentVersion" ("id", "agentId", "version", "providerId", "modelId", "systemPrompt", "temperature", "maxTokens", "skillsSnapshot", "mcpServersSnapshot", "changelog", "publishedAt", "createdAt")
SELECT
    gen_random_uuid()::text,
    a."id",
    a."version",
    a."providerId",
    a."modelId",
    a."systemPrompt",
    a."temperature",
    a."maxTokens",
    '[]'::jsonb,
    '[]'::jsonb,
    'Migrated from published agent',
    COALESCE(a."publishedAt", a."createdAt"),
    COALESCE(a."publishedAt", a."createdAt")
FROM "Agent" a
WHERE a."status" = 'PUBLISHED';

-- DataMigration: Update PUBLISHED agents to DRAFT
UPDATE "Agent" SET "status" = 'DRAFT' WHERE "status" = 'PUBLISHED';

-- AlterEnum: Remove PUBLISHED from AgentStatus
ALTER TYPE "AgentStatus" RENAME TO "AgentStatus_old";
CREATE TYPE "AgentStatus" AS ENUM ('DRAFT', 'ARCHIVED');
ALTER TABLE "Agent" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Agent" ALTER COLUMN "status" TYPE "AgentStatus" USING ("status"::text::"AgentStatus");
ALTER TABLE "Agent" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "AgentStatus_old";

-- AlterTable: Drop old columns from Agent
ALTER TABLE "Agent" DROP COLUMN "publishedAt";
ALTER TABLE "Agent" DROP COLUMN "version";

-- AlterTable: Make Conversation.userId optional and add new columns
ALTER TABLE "Conversation" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Conversation" ADD COLUMN "agentVersionId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "shareTokenId" TEXT;

-- DropForeignKey: Change Conversation.userId from RESTRICT to SET NULL
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- AddForeignKey: Conversation.userId (now optional, SET NULL on delete)
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: AgentVersion.agentId
ALTER TABLE "AgentVersion" ADD CONSTRAINT "AgentVersion_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AgentVersion.providerId
ALTER TABLE "AgentVersion" ADD CONSTRAINT "AgentVersion_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ShareToken.agentVersionId
ALTER TABLE "ShareToken" ADD CONSTRAINT "ShareToken_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "AgentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Conversation.agentVersionId
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "AgentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Conversation.shareTokenId
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_shareTokenId_fkey" FOREIGN KEY ("shareTokenId") REFERENCES "ShareToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
