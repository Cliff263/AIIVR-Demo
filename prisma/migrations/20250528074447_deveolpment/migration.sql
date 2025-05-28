/*
  Warnings:

  - The primary key for the `UserActivityLog` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "UserActivityLog" DROP CONSTRAINT "UserActivityLog_pkey",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserActivityLog_id_seq";
