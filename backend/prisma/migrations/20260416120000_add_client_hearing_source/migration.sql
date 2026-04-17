-- CreateEnum
CREATE TYPE "ClientHearingSource" AS ENUM ('INSTAGRAM', 'GOOGLE', 'REFERRAL', 'YOUTUBE', 'OTHER');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "hearingSource" "ClientHearingSource";
