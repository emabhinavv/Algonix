-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verify" BOOLEAN NOT NULL DEFAULT false;
