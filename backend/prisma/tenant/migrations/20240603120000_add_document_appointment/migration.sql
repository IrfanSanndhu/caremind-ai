-- AlterTable
ALTER TABLE "documents" ADD COLUMN "appointmentId" TEXT;

-- CreateIndex
CREATE INDEX "documents_appointmentId_idx" ON "documents"("appointmentId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
