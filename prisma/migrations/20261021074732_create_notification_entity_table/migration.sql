/*
  Warnings:

  - You are about to drop the column `type` on the `Notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[notificationEntityId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `notificationEntityId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPLY';

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "type",
ADD COLUMN     "notificationEntityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "NotificationEntity" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "postId" TEXT,
    "commentId" TEXT,
    "type" "NotificationType" NOT NULL,

    CONSTRAINT "NotificationEntity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_notificationEntityId_key" ON "Notification"("notificationEntityId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_notificationEntityId_fkey" FOREIGN KEY ("notificationEntityId") REFERENCES "NotificationEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEntity" ADD CONSTRAINT "NotificationEntity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEntity" ADD CONSTRAINT "NotificationEntity_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEntity" ADD CONSTRAINT "NotificationEntity_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
