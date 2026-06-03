-- AlterTable
ALTER TABLE "patients" ADD COLUMN "primaryDoctorId" TEXT;

-- CreateIndex
CREATE INDEX "patients_primaryDoctorId_idx" ON "patients"("primaryDoctorId");

-- AddForeignKey
ALTER TABLE "patients"
  ADD CONSTRAINT "patients_primaryDoctorId_fkey"
  FOREIGN KEY ("primaryDoctorId") REFERENCES "doctors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

