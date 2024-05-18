/*
  Warnings:

  - You are about to drop the column `ownerId` on the `File` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "ownerId",
ADD COLUMN     "owner" TEXT;
