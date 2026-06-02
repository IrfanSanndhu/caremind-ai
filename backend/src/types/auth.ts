export type UserRole = 'patient' | 'doctor' | 'admin';

export interface JwtPayload {
  sub: string;
  orgId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthContext {
  userId: string;
  orgId: string;
  role: UserRole;
  patientId?: string;
  doctorId?: string;
}
