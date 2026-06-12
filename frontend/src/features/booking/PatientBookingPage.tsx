import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, UserRound } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  Select,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { bookingApi, bookingKeys } from '@/api/booking.api';
import { appointmentKeys } from '@/api/appointments.api';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateTime } from '@/utils/formatDate';
import { BookingSlotCalendar, groupSlotsByDate } from './BookingSlotCalendar';

export function PatientBookingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [doctorId, setDoctorId] = useState(user?.primaryDoctorId ?? '');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const doctorsQuery = useQuery({
    queryKey: bookingKeys.doctors(),
    queryFn: bookingApi.listDoctors,
  });

  const slotsQuery = useQuery({
    queryKey: bookingKeys.slots(doctorId),
    queryFn: () => bookingApi.getDoctorSlots(doctorId),
    enabled: Boolean(doctorId),
  });

  const timeZone = slotsQuery.data?.timezone ?? 'UTC';
  const slots = slotsQuery.data?.slots ?? [];

  const slotsByDate = useMemo(() => groupSlotsByDate(slots, timeZone), [slots, timeZone]);

  const firstAvailableDate = useMemo(() => {
    const keys = Array.from(slotsByDate.keys()).sort();
    return keys[0] ?? null;
  }, [slotsByDate]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedSlot(null);
  }, [doctorId]);

  useEffect(() => {
    if (!firstAvailableDate) {
      setSelectedDate(null);
      setSelectedSlot(null);
      return;
    }
    setSelectedDate((prev) => {
      if (prev && slotsByDate.has(prev)) return prev;
      return firstAvailableDate;
    });
  }, [firstAvailableDate, slotsByDate]);

  const bookMutation = useMutation({
    mutationFn: () => {
      if (!doctorId || !selectedSlot) throw new Error('Select a slot');
      return bookingApi.bookAppointment({ doctorId, scheduledAt: selectedSlot });
    },
    onSuccess: () => {
      toast.success('Booking request sent — waiting for doctor approval');
      setSelectedSlot(null);
      void queryClient.invalidateQueries({ queryKey: bookingKeys.slots(doctorId) });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      navigate('/appointments');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Could not book appointment')),
  });

  const doctors = doctorsQuery.data ?? [];
  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const sessionLabel =
    slotsQuery.data?.slotDurationMinutes === 'sixty' ? '1 hour' : '30 min';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Book Appointment"
        subtitle="Choose a doctor, pick a date, then select a time"
      />

      <Card>
        <CardHeader title="Select doctor" />
        <div className="pt-0">
          {doctorsQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : doctors.length === 0 ? (
            <EmptyState
              icon={<UserRound className="w-6 h-6" />}
              title="No doctors available"
              description="Your organization has no doctors to book with yet."
            />
          ) : (
            <Select
              label="Doctor"
              value={doctorId}
              placeholder="Select a doctor…"
              onChange={(e) => setDoctorId(e.target.value)}
              options={doctors.map((d) => ({
                value: d.id,
                label: `${d.fullName}${d.specialty ? ` — ${d.specialty}` : ''}`,
              }))}
            />
          )}
        </div>
      </Card>

      {doctorId && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <h3 className="text-lg font-semibold text-slate-900">Pick a date & time</h3>
            {selectedDoctor && (
              <p className="text-sm text-muted mt-0.5">
                {sessionLabel} sessions · {timeZone}
              </p>
            )}
          </div>

          {slotsQuery.isLoading ? (
            <div className="p-5">
              <Skeleton className="h-72 w-full" />
            </div>
          ) : slots.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Calendar className="w-6 h-6" />}
                title="No open slots"
                description="This doctor has no available times in the booking window. Try another doctor or check back later."
              />
            </div>
          ) : (
            <>
              <BookingSlotCalendar
                slots={slots}
                timeZone={timeZone}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onSelectDate={(dateKey) => {
                  setSelectedDate(dateKey);
                  setSelectedSlot(null);
                }}
                onSelectSlot={setSelectedSlot}
              />

              {selectedSlot && (
                <div className="px-5 py-4 border-t border-border bg-surface/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-muted">
                    <span className="font-medium text-slate-900">
                      {formatDateTime(selectedSlot)}
                    </span>
                    {' · '}
                    Pending until {selectedDoctor?.fullName ?? 'doctor'} approves
                  </p>
                  <Button
                    onClick={() => bookMutation.mutate()}
                    loading={bookMutation.isPending}
                    className="shrink-0"
                  >
                    Request appointment
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
