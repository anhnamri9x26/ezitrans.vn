-- Docker-first WordPress-like update system foundation.
-- This migration is intentionally additive and non-destructive.

CREATE TYPE "PackageType" AS ENUM ('CORE', 'PLUGIN', 'THEME');
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INSTALLED', 'UPDATE_AVAILABLE', 'BROKEN');
CREATE TYPE "PackageSource" AS ENUM ('BUILT_IN', 'CONTENT', 'REGISTRY', 'DOCKER_IMAGE');
CREATE TYPE "UpdateJobType" AS ENUM ('CORE', 'PLUGIN', 'THEME', 'DATABASE');
CREATE TYPE "UpdateJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLED_BACK');
CREATE TYPE "MigrationStatus" AS ENUM ('PENDING', 'RUNNING', 'APPLIED', 'FAILED');

CREATE TABLE "InstalledPackage" (
  "id" SERIAL NOT NULL,
  "type" "PackageType" NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" "PackageStatus" NOT NULL DEFAULT 'INSTALLED',
  "source" "PackageSource" NOT NULL DEFAULT 'BUILT_IN',
  "manifestJson" TEXT,
  "latestVersion" TEXT,
  "updateUri" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstalledPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PackageMigration" (
  "id" SERIAL NOT NULL,
  "packageId" INTEGER,
  "packageSlug" TEXT NOT NULL,
  "packageType" "PackageType" NOT NULL,
  "version" TEXT NOT NULL,
  "migrationId" TEXT NOT NULL,
  "status" "MigrationStatus" NOT NULL DEFAULT 'PENDING',
  "checksum" TEXT,
  "appliedAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PackageMigration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UpdateJob" (
  "id" TEXT NOT NULL,
  "type" "UpdateJobType" NOT NULL,
  "targetSlug" TEXT NOT NULL,
  "fromVersion" TEXT,
  "toVersion" TEXT,
  "status" "UpdateJobStatus" NOT NULL DEFAULT 'PENDING',
  "log" TEXT,
  "error" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UpdateJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PackageBackup" (
  "id" SERIAL NOT NULL,
  "packageId" INTEGER,
  "packageSlug" TEXT NOT NULL,
  "packageType" "PackageType" NOT NULL,
  "version" TEXT NOT NULL,
  "backupPath" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageBackup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstalledPackage_type_slug_key" ON "InstalledPackage"("type", "slug");
CREATE INDEX "InstalledPackage_type_idx" ON "InstalledPackage"("type");
CREATE INDEX "InstalledPackage_status_idx" ON "InstalledPackage"("status");

CREATE UNIQUE INDEX "PackageMigration_packageType_packageSlug_migrationId_key" ON "PackageMigration"("packageType", "packageSlug", "migrationId");
CREATE INDEX "PackageMigration_status_idx" ON "PackageMigration"("status");

CREATE INDEX "UpdateJob_type_idx" ON "UpdateJob"("type");
CREATE INDEX "UpdateJob_status_idx" ON "UpdateJob"("status");
CREATE INDEX "UpdateJob_createdAt_idx" ON "UpdateJob"("createdAt");

CREATE INDEX "PackageBackup_packageType_packageSlug_idx" ON "PackageBackup"("packageType", "packageSlug");
CREATE INDEX "PackageBackup_createdAt_idx" ON "PackageBackup"("createdAt");

ALTER TABLE "PackageMigration" ADD CONSTRAINT "PackageMigration_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "InstalledPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackageBackup" ADD CONSTRAINT "PackageBackup_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "InstalledPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
