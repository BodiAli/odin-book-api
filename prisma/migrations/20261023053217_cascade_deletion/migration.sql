-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_notificationEntityId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationEntity" DROP CONSTRAINT "NotificationEntity_commentId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationEntity" DROP CONSTRAINT "NotificationEntity_postId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationEntity" DROP CONSTRAINT "NotificationEntity_profileId_fkey";

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_notificationEntityId_fkey" FOREIGN KEY ("notificationEntityId") REFERENCES "NotificationEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEntity" ADD CONSTRAINT "NotificationEntity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEntity" ADD CONSTRAINT "NotificationEntity_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEntity" ADD CONSTRAINT "NotificationEntity_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
