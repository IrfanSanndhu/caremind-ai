-- CreateEnum
CREATE TYPE "PatientGender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN "gender" "PatientGender";
