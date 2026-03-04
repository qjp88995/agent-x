/*
  Warnings:

  - A unique constraint covering the columns `[providerId,modelId]` on the table `ProviderModel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProviderProtocol" ADD VALUE 'DEEPSEEK';
ALTER TYPE "ProviderProtocol" ADD VALUE 'QWEN';
ALTER TYPE "ProviderProtocol" ADD VALUE 'ZHIPU';
ALTER TYPE "ProviderProtocol" ADD VALUE 'MOONSHOT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "ProviderModel_providerId_modelId_key" ON "ProviderModel"("providerId", "modelId");
