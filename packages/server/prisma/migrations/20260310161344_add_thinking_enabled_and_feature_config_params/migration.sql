-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "thinkingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AgentVersion" ADD COLUMN     "thinkingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SystemFeatureConfig" ADD COLUMN     "maxTokens" INTEGER,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "thinkingEnabled" BOOLEAN NOT NULL DEFAULT false;
