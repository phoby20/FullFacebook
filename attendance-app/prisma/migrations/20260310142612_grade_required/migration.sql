/*
  Warnings:

  - Made the column `grade` on table `Child` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Child" ALTER COLUMN "grade" SET NOT NULL;
