/*
  Warnings:

  - You are about to drop the column `postId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `Notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_postId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_profileId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "postId",
DROP COLUMN "profileId";
