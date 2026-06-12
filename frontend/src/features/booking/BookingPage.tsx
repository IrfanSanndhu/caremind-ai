import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/types';
import { DoctorBookingPage } from './DoctorBookingPage';
import { PatientBookingPage } from './PatientBookingPage';

export function BookingPage() {
  const { role } = useAuthStore();

  if (role === UserRole.DOCTOR) {
    return <DoctorBookingPage />;
  }

  if (role === UserRole.PATIENT) {
    return <PatientBookingPage />;
  }

  return (
    <div className="p-6">
      <p className="text-muted">Booking settings are available for doctors and patients.</p>
    </div>
  );
}
