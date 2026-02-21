/*
  Warnings:

  - You are about to drop the column `access_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `providerAccountId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `session_state` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accountId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CalculatorMode" AS ENUM ('AUTONOMOUS', 'STUDIO_PERCENTAGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BodyLocation" ADD VALUE 'TRAPEZIUS';
ALTER TYPE "BodyLocation" ADD VALUE 'SHIN';
ALTER TYPE "BodyLocation" ADD VALUE 'COLLARBONE';

-- AlterEnum
ALTER TYPE "TattooSize" ADD VALUE 'MICRO';

-- DropIndex
DROP INDEX "Account_provider_providerAccountId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "access_token",
DROP COLUMN "emailVerified",
DROP COLUMN "expires_at",
DROP COLUMN "id_token",
DROP COLUMN "provider",
DROP COLUMN "providerAccountId",
DROP COLUMN "refresh_token",
DROP COLUMN "session_state",
DROP COLUMN "token_type",
DROP COLUMN "type",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "accountId" TEXT NOT NULL,
ADD COLUMN     "idToken" TEXT,
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "instagram" TEXT;

-- AlterTable
ALTER TABLE "TattooSession" ADD COLUMN     "serviceTypeId" TEXT,
ALTER COLUMN "size" DROP NOT NULL,
ALTER COLUMN "complexity" DROP NOT NULL,
ALTER COLUMN "bodyLocation" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "serviceTypeId" TEXT,
ALTER COLUMN "role" SET DEFAULT 'OWNER';

-- AlterTable
ALTER TABLE "WorkSettings" ADD COLUMN     "mode" "CalculatorMode" NOT NULL DEFAULT 'AUTONOMOUS',
ADD COLUMN     "studioPercentage" INTEGER;

-- DropTable
DROP TABLE "VerificationToken";

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedTrainingData" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "size" "TattooSize" NOT NULL,
    "complexity" "TattooComplexity" NOT NULL,
    "bodyLocation" "BodyLocation" NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TattooSizeScale" (
    "size" "TattooSize" NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "TattooSizeScale_pkey" PRIMARY KEY ("size")
);

-- CreateTable
CREATE TABLE "TattooComplexityScale" (
    "complexity" "TattooComplexity" NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "TattooComplexityScale_pkey" PRIMARY KEY ("complexity")
);

-- CreateTable
CREATE TABLE "BodyLocationScale" (
    "bodyLocation" "BodyLocation" NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "BodyLocationScale_pkey" PRIMARY KEY ("bodyLocation")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verification_value_key" ON "Verification"("value");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceType" ADD CONSTRAINT "ServiceType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TattooSession" ADD CONSTRAINT "TattooSession_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedTrainingData" ADD CONSTRAINT "SeedTrainingData_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedTrainingData" ADD CONSTRAINT "SeedTrainingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
