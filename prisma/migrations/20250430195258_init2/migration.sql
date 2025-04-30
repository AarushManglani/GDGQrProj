-- DropIndex
DROP INDEX "Events_desc_key";

-- DropIndex
DROP INDEX "Events_event_name_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'Student',
ADD COLUMN     "student_id" TEXT;
