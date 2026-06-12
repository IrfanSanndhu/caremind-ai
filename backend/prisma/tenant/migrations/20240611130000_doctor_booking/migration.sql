-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'pending_approval';

-- CreateEnum
CREATE TYPE "SlotDurationMinutes" AS ENUM ('thirty', 'sixty');

-- CreateTable
CREATE TABLE "doctor_booking_settings" (
    "doctorId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "slotDurationMinutes" "SlotDurationMinutes" NOT NULL DEFAULT 'thirty',
    "minLeadTimeHours" INTEGER NOT NULL DEFAULT 2,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_booking_settings_pkey" PRIMARY KEY ("doctorId")
);

-- CreateTable
CREATE TABLE "doctor_availability_rules" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "doctor_availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_booking_settings_orgId_idx" ON "doctor_booking_settings"("orgId");

-- CreateIndex
CREATE INDEX "doctor_availability_rules_orgId_idx" ON "doctor_availability_rules"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_availability_rules_doctorId_dayOfWeek_key" ON "doctor_availability_rules"("doctorId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "doctor_booking_settings" ADD CONSTRAINT "doctor_booking_settings_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability_rules" ADD CONSTRAINT "doctor_availability_rules_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
