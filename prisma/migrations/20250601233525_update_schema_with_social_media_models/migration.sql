-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INSTAGRAM');

-- CreateEnum
CREATE TYPE "TypesOfContentSocialMedia" AS ENUM ('INSTAGRAM');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ENABLED', 'DISABLED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountURL" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'INSTAGRAM',
    "status" "Status" NOT NULL DEFAULT 'ENABLED',

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramUserAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "scrapDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numberOfPosts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "followers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "following" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "linksPosts" TEXT[],
    "profilePictureUrl" TEXT,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "InstagramUserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "link" TEXT,
    "media" TEXT[],
    "title" TEXT NOT NULL,
    "numberOfLikes" INTEGER,
    "numberOfComments" INTEGER,
    "scrapDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    "type" "TypesOfContentSocialMedia" NOT NULL DEFAULT 'INSTAGRAM',

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "commentOwnerName" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "likesOfComment" INTEGER NOT NULL DEFAULT 0,
    "scrapDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentDate" TIMESTAMP(3),
    "postId" TEXT NOT NULL,
    "originalCommentId" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "numberOfPosts" INTEGER NOT NULL DEFAULT 0,
    "followers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "following" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userName" TEXT NOT NULL,
    "scrapDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_accountURL_key" ON "Account"("accountURL");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramUserAccount_username_key" ON "InstagramUserAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramUserAccount_accountId_key" ON "InstagramUserAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_link_key" ON "InstagramPost"("link");

-- CreateIndex
CREATE INDEX "Comment_originalCommentId_idx" ON "Comment"("originalCommentId");

-- AddForeignKey
ALTER TABLE "InstagramUserAccount" ADD CONSTRAINT "InstagramUserAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramUserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_originalCommentId_fkey" FOREIGN KEY ("originalCommentId") REFERENCES "Comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
