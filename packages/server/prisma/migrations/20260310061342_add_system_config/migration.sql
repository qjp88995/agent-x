-- CreateTable
CREATE TABLE "SystemProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" "ProviderProtocol" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemFeatureConfig" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemProviderId" TEXT,
    "modelId" TEXT,
    "systemPrompt" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemFeatureConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemFeatureConfig_featureKey_key" ON "SystemFeatureConfig"("featureKey");

-- AddForeignKey
ALTER TABLE "SystemFeatureConfig" ADD CONSTRAINT "SystemFeatureConfig_systemProviderId_fkey" FOREIGN KEY ("systemProviderId") REFERENCES "SystemProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
