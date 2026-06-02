-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "ConsentStatus" AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE "RecordingStatus" AS ENUM ('uploaded', 'processing', 'ready', 'failed');
CREATE TYPE "AiOutputType" AS ENUM ('soap_note', 'clinical_summary', 'patient_summary', 'follow_up_instructions');
CREATE TYPE "AiOutputStatus" AS ENUM ('pending_review', 'approved', 'rejected', 'edited');
CREATE TYPE "DocumentProcessingStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'sms');
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable patients
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable doctors
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialty" TEXT,
    "licenseNumber" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable appointments
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "livekitRoomName" TEXT,
    "noRecording" BOOLEAN NOT NULL DEFAULT false,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'pending',
    "consentTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable consultation_recordings
CREATE TABLE "consultation_recordings" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "status" "RecordingStatus" NOT NULL DEFAULT 'uploaded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consultation_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable transcripts
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable ai_outputs
CREATE TABLE "ai_outputs" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "AiOutputType" NOT NULL,
    "content" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "status" "AiOutputStatus" NOT NULL DEFAULT 'pending_review',
    "reviewedByDoctorId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable documents
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "extractedText" TEXT,
    "processingStatus" "DocumentProcessingStatus" NOT NULL DEFAULT 'pending',
    "documentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable vector_chunks
CREATE TABLE "vector_chunks" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "documentId" TEXT,
    "appointmentId" TEXT,
    "documentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1024),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vector_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "patients_orgId_idx" ON "patients"("orgId");
CREATE INDEX "patients_userId_idx" ON "patients"("userId");
CREATE INDEX "doctors_orgId_idx" ON "doctors"("orgId");
CREATE INDEX "doctors_userId_idx" ON "doctors"("userId");
CREATE INDEX "appointments_orgId_idx" ON "appointments"("orgId");
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");
CREATE INDEX "appointments_doctorId_idx" ON "appointments"("doctorId");
CREATE INDEX "consultation_recordings_appointmentId_idx" ON "consultation_recordings"("appointmentId");
CREATE INDEX "transcripts_appointmentId_idx" ON "transcripts"("appointmentId");
CREATE INDEX "ai_outputs_appointmentId_idx" ON "ai_outputs"("appointmentId");
CREATE INDEX "ai_outputs_orgId_status_idx" ON "ai_outputs"("orgId", "status");
CREATE INDEX "documents_orgId_idx" ON "documents"("orgId");
CREATE INDEX "documents_patientId_idx" ON "documents"("patientId");
CREATE INDEX "vector_chunks_orgId_patientId_idx" ON "vector_chunks"("orgId", "patientId");
CREATE INDEX "notifications_orgId_userId_idx" ON "notifications"("orgId", "userId");
CREATE INDEX "audit_logs_orgId_userId_idx" ON "audit_logs"("orgId", "userId");
CREATE INDEX "audit_logs_orgId_resourceType_resourceId_idx" ON "audit_logs"("orgId", "resourceType", "resourceId");

-- IVFFlat index for vector similarity search
CREATE INDEX "vector_chunks_embedding_idx" ON "vector_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- Foreign keys
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_recordings" ADD CONSTRAINT "consultation_recordings_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_outputs" ADD CONSTRAINT "ai_outputs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vector_chunks" ADD CONSTRAINT "vector_chunks_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vector_chunks" ADD CONSTRAINT "vector_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "doctors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consultation_recordings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transcripts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_outputs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vector_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- RLS Policies — org isolation
CREATE POLICY "patient_org_isolation" ON "patients"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "doctor_org_isolation" ON "doctors"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "appointment_org_isolation" ON "appointments"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "recording_org_isolation" ON "consultation_recordings"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "transcript_org_isolation" ON "transcripts"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "ai_output_org_isolation" ON "ai_outputs"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "document_org_isolation" ON "documents"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "vector_chunk_org_isolation" ON "vector_chunks"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "notification_org_isolation" ON "notifications"
    USING (("orgId")::text = current_setting('app.current_org_id', true));

CREATE POLICY "audit_log_org_isolation" ON "audit_logs"
    USING (("orgId")::text = current_setting('app.current_org_id', true));
