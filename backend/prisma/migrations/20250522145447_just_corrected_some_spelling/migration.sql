/*
  Warnings:

  - You are about to drop the column `contrainst` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `referenceSolutions` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `testCase` on the `Problem` table. All the data in the column will be lost.
  - Added the required column `contraints` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceSolution` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testCases` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "contrainst",
DROP COLUMN "referenceSolutions",
DROP COLUMN "tag",
DROP COLUMN "testCase",
ADD COLUMN     "contraints" TEXT NOT NULL,
ADD COLUMN     "referenceSolution" JSONB NOT NULL,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "testCases" JSONB NOT NULL;
