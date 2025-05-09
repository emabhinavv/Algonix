/*
  Warnings:

  - You are about to drop the column `verify` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "verify",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
