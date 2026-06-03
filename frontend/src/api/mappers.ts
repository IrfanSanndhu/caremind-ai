import type {
  AiOutput,
  Appointment,
  AuditLog,
  DashboardStats,
  Document,
  PaginatedResponse,
  User,
} from '@/types';

export function toPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const safeLimit = limit > 0 ? limit : 20;
  return {
    items,
    total,
    page,
    pageSize: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export function listQueryParams(
  params?: Record<string, string | number | undefined>
): Record<string, string | number> {
  const { pageSize, limit, page, ...rest } = params ?? {};
  const out: Record<string, string | number> = { page: page ?? 1, limit: limit ?? pageSize ?? 20 };
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function mapDashboardStats(raw: {
  totalUsers: number;
  doctors: number;
  patients: number;
  appointments: number;
  documents: number;
}): DashboardStats {
  return {
    totalUsers: raw.totalUsers,
    totalDoctors: raw.doctors,
    totalPatients: raw.patients,
    totalAppointments: raw.appointments,
    totalDocuments: raw.documents,
    pendingAiOutputs: 0,
    appointmentsToday: 0,
  };
}

export function mapAuditLog(raw: {
  id: string;
  orgId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  createdAt: string | Date;
  metadata?: unknown;
}): AuditLog {
  return {
    id: raw.id,
    orgId: raw.orgId,
    userId: raw.userId,
    action: raw.action,
    resourceType: raw.resourceType,
    resourceId: raw.resourceId ?? undefined,
    details: raw.metadata as Record<string, unknown> | undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : raw.createdAt.toISOString(),
  };
}

export function mapCentralUser(raw: {
  id: string;
  email: string;
  role: User['role'];
  mfaEnabled: boolean;
  createdAt: Date | string;
  lastLoginAt?: Date | string | null;
  name?: string | null;
}): User {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    orgId: '',
    name: raw.name ?? undefined,
    mfaEnabled: raw.mfaEnabled,
    lastLogin: raw.lastLoginAt
      ? typeof raw.lastLoginAt === 'string'
        ? raw.lastLoginAt
        : raw.lastLoginAt.toISOString()
      : undefined,
    createdAt:
      typeof raw.createdAt === 'string' ? raw.createdAt : raw.createdAt.toISOString(),
  };
}

function toIsoString(value: unknown, fallback?: unknown): string {
  const v = value ?? fallback;
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return new Date().toISOString();
}

export function mapAppointment(raw: Record<string, unknown>): Appointment {
  const patient = raw.patient as Appointment['patient'] | undefined;
  const doctor = raw.doctor as Appointment['doctor'] | undefined;
  return {
    id: String(raw.id),
    orgId: String(raw.orgId),
    patientId: String(raw.patientId),
    doctorId: String(raw.doctorId),
    scheduledAt: toIsoString(raw.scheduledAt),
    status: raw.status as Appointment['status'],
    consentStatus: raw.consentStatus as Appointment['consentStatus'],
    livekitRoomName: raw.livekitRoomName ? String(raw.livekitRoomName) : undefined,
    patient,
    doctor,
    createdAt: toIsoString(raw.createdAt),
    // Tenant schema has no updatedAt on appointments; fall back to createdAt
    updatedAt: toIsoString(raw.updatedAt, raw.createdAt),
  };
}

export function mapAiOutput(raw: Record<string, unknown>): AiOutput {
  const content = String(raw.content ?? '');
  const originalContent = String(raw.originalContent ?? content);
  return {
    id: String(raw.id),
    appointmentId: String(raw.appointmentId),
    orgId: String(raw.orgId),
    patientId: String(raw.patientId ?? ''),
    type: raw.type as AiOutput['type'],
    status: raw.status as AiOutput['status'],
    originalContent,
    currentContent: content,
    reviewedAt: raw.reviewedAt
      ? typeof raw.reviewedAt === 'string'
        ? raw.reviewedAt
        : (raw.reviewedAt as Date).toISOString()
      : undefined,
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : (raw.createdAt as Date).toISOString(),
    updatedAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : (raw.createdAt as Date).toISOString(),
  };
}

export function mapDocument(raw: Record<string, unknown>): Document {
  return {
    id: String(raw.id),
    orgId: String(raw.orgId),
    patientId: String(raw.patientId),
    uploadedBy: String(raw.uploadedBy),
    fileName: String(raw.fileName),
    fileType: String(raw.mimeType ?? raw.fileType ?? ''),
    fileSize: Number(raw.fileSize ?? 0),
    mimeType: String(raw.mimeType ?? ''),
    storagePath: String(raw.storageKey ?? raw.storagePath ?? ''),
    processingStatus: (raw.processingStatus ?? raw.status ?? 'pending') as Document['processingStatus'],
    documentType: raw.documentType ? String(raw.documentType) : undefined,
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : (raw.createdAt as Date).toISOString(),
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : (raw.updatedAt as Date).toISOString(),
  };
}
