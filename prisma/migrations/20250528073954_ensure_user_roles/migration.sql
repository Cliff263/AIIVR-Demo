/*
  Warnings:

  - The primary key for the `UserActivityLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `action` on the `UserActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `UserActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `UserActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `UserActivityLog` table. All the data in the column will be lost.
  - Added the required column `description` to the `UserActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `UserActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserActivityLog` table without a default value. This is not possible if the table is not empty.

*/
-- First, add new columns with default values
ALTER TABLE "UserActivityLog" 
ADD COLUMN "description" TEXT,
ADD COLUMN "type" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Update existing rows with default values
UPDATE "UserActivityLog"
SET 
    "description" = COALESCE("details", ''),
    "type" = COALESCE("action", 'UNKNOWN'),
    "updatedAt" = CURRENT_TIMESTAMP;

-- Now make the columns NOT NULL
ALTER TABLE "UserActivityLog"
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- Drop old columns
ALTER TABLE "UserActivityLog"
DROP COLUMN "action",
DROP COLUMN "details",
DROP COLUMN "ipAddress",
DROP COLUMN "userAgent";

-- Create MonitoringAction table
CREATE TABLE "MonitoringAction" (
    "id" TEXT NOT NULL,
    "callId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonitoringAction_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "MonitoringAction_callId_idx" ON "MonitoringAction"("callId");
CREATE INDEX "MonitoringAction_supervisorId_idx" ON "MonitoringAction"("supervisorId");

-- Add foreign keys
ALTER TABLE "MonitoringAction" 
ADD CONSTRAINT "MonitoringAction_supervisorId_fkey" 
FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MonitoringAction" 
ADD CONSTRAINT "MonitoringAction_callId_fkey" 
FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
