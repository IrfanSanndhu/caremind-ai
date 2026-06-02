import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  allowedRoles,
  children,
  redirectTo = '/dashboard',
}: RoleGuardProps) {
  const { role } = useAuthStore();

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
