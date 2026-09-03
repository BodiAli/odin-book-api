-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entity_notificationId_key" ON "Entity"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_postId_key" ON "Entity"("postId");

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
