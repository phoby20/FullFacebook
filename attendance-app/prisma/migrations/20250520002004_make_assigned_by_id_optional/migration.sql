-- DropForeignKey
ALTER TABLE "DutyAssignment" DROP CONSTRAINT "DutyAssignment_assignedById_fkey";

-- AlterTable
ALTER TABLE "DutyAssignment" ALTER COLUMN "assignedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
