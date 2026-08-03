-- AlterTable
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("followedById", "followingId");

-- DropIndex
DROP INDEX "UserFollow_followedById_followingId_key";
