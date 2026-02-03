-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('AUTONOMO', 'STUDIO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AutonomoType" AS ENUM ('OWN_SPACE', 'GUEST');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('TATTOO', 'MATERIAL', 'FIXED', 'MARKETING', 'PRO_LABORE', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'CASH');

-- CreateEnum
CREATE TYPE "TattooSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', 'XLARGE', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "TattooComplexity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "BodyLocation" AS ENUM ('ARM', 'FOREARM', 'HAND', 'FINGER', 'UPPER_BACK', 'LOWER_BACK', 'FULL_BACK', 'CHEST', 'ABDOMEN', 'SHOULDER', 'NECK', 'FACE', 'HEAD', 'THIGH', 'CALF', 'FOOT', 'RIB', 'INNER_ARM', 'WRIST', 'ANKLE', 'OTHER');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "type" "TenantType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "providerAccountId" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "defaultPercentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TatuadorBenefit" (
    "id" TEXT NOT NULL,
    "studioConfigId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TatuadorBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestLocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linkedTenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "size" "TattooSize" NOT NULL,
    "complexity" "TattooComplexity" NOT NULL,
    "bodyLocation" "BodyLocation" NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TattooSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "procedureId" TEXT,
    "size" "TattooSize" NOT NULL,
    "complexity" "TattooComplexity" NOT NULL,
    "bodyLocation" "BodyLocation" NOT NULL,
    "description" TEXT,
    "finalPrice" INTEGER NOT NULL,
    "guestLocationId" TEXT,
    "studioPercentage" INTEGER,
    "studioFee" INTEGER,
    "tatuadorRevenue" INTEGER,
    "duration" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TattooSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod",
    "clientId" TEXT,
    "sessionId" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariableCost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariableCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hoursPerMonth" INTEGER NOT NULL,
    "profitMargin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLTrainingData" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "size" "TattooSize" NOT NULL,
    "complexity" "TattooComplexity" NOT NULL,
    "bodyLocation" "BodyLocation" NOT NULL,
    "duration" INTEGER NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainedAt" TIMESTAMP(3) NOT NULL,
    "dataPointsUsed" INTEGER NOT NULL,
    "modelPath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "size" "TattooSize" NOT NULL,
    "complexity" "TattooComplexity" NOT NULL,
    "bodyLocation" "BodyLocation" NOT NULL,
    "predictedPrice" INTEGER NOT NULL,
    "acceptedPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_resetToken_key" ON "AuthCredential"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_verificationToken_key" ON "AuthCredential"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_token_key" ON "AuthSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "StudioConfig_tenantId_key" ON "StudioConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_sessionId_key" ON "Transaction"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSettings_tenantId_key" ON "WorkSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MLTrainingData_sessionId_key" ON "MLTrainingData"("sessionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCredential" ADD CONSTRAINT "AuthCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioConfig" ADD CONSTRAINT "StudioConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TatuadorBenefit" ADD CONSTRAINT "TatuadorBenefit_studioConfigId_fkey" FOREIGN KEY ("studioConfigId") REFERENCES "StudioConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TatuadorBenefit" ADD CONSTRAINT "TatuadorBenefit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestLocation" ADD CONSTRAINT "GuestLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestLocation" ADD CONSTRAINT "GuestLocation_linkedTenantId_fkey" FOREIGN KEY ("linkedTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TattooSession" ADD CONSTRAINT "TattooSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TattooSession" ADD CONSTRAINT "TattooSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TattooSession" ADD CONSTRAINT "TattooSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TattooSession" ADD CONSTRAINT "TattooSession_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TattooSession" ADD CONSTRAINT "TattooSession_guestLocationId_fkey" FOREIGN KEY ("guestLocationId") REFERENCES "GuestLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TattooSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedCost" ADD CONSTRAINT "FixedCost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableCost" ADD CONSTRAINT "VariableCost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSettings" ADD CONSTRAINT "WorkSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLTrainingData" ADD CONSTRAINT "MLTrainingData_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TattooSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLTrainingData" ADD CONSTRAINT "MLTrainingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLModel" ADD CONSTRAINT "MLModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLPrediction" ADD CONSTRAINT "MLPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MLPrediction" ADD CONSTRAINT "MLPrediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "MLModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
