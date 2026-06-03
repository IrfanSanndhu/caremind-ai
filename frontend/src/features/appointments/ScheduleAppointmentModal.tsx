import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button, Input, Select, Modal, ModalFooter } from '@/components/ui';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { patientsApi, patientKeys } from '@/api/patients.api';
import { usersApi, userKeys } from '@/api/users.api';
import { UserRole } from '@/types';

const createSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  doctorId: z.string().min(1, 'Select a doctor'),
  scheduledAt: z.string().min(1, 'Select date and time'),
});
type CreateFormValues = z.infer<typeof createSchema>;

const EMPTY_FORM: CreateFormValues = {
  doctorId: '',
  patientId: '',
  scheduledAt: '',
};

interface ScheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  role: UserRole | null;
}

export function ScheduleAppointmentModal({ open, onClose, role }: ScheduleAppointmentModalProps) {
  const queryClient = useQueryClient();
  const isAdmin = role === UserRole.ADMIN;
  const isDoctor = role === UserRole.DOCTOR;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<CreateFormValues>({
      resolver: zodResolver(createSchema),
      defaultValues: EMPTY_FORM,
    });

  const selectedDoctorId = watch('doctorId');

  useEffect(() => {
    if (open && isAdmin) {
      reset(EMPTY_FORM);
    }
  }, [open, isAdmin, reset]);

  const { data: doctorProfiles, isLoading: doctorsLoading } = useQuery({
    queryKey: userKeys.doctorProfiles(),
    queryFn: () => usersApi.doctorProfiles(),
    enabled: open && (isAdmin || isDoctor),
    retry: 1,
  });

  useEffect(() => {
    if (isDoctor && doctorProfiles?.length === 1) {
      setValue('doctorId', doctorProfiles[0].id);
    }
  }, [isDoctor, doctorProfiles, setValue]);

  const patientsEnabled = open && (isDoctor || (isAdmin && !!selectedDoctorId));
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: patientKeys.list({
      doctorId: isAdmin ? selectedDoctorId : undefined,
      pageSize: 100,
    }),
    queryFn: () =>
      patientsApi.list({
        doctorId: isAdmin ? selectedDoctorId : undefined,
        pageSize: 100,
      }),
    enabled: patientsEnabled,
    retry: 1,
  });

  useEffect(() => {
    if (isAdmin) setValue('patientId', '');
  }, [selectedDoctorId, isAdmin, setValue]);

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      toast.success('Appointment scheduled!');
      handleClose();
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
    onError: () => toast.error('Failed to schedule appointment'),
  });

  function handleClose() {
    onClose();
    reset();
  }

  const doctorOptions = (doctorProfiles ?? []).map((d) => ({
    value: d.id,
    label: d.email
      ? `Dr. ${d.firstName} ${d.lastName} (${d.email})`.trim()
      : `Dr. ${d.firstName} ${d.lastName}`.trim(),
  }));

  const patientOptions = (patientsData?.items ?? []).map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName}`.trim(),
  }));

  const noDoctors = isAdmin && !doctorsLoading && doctorOptions.length === 0;
  const noPatients =
    patientsEnabled && !patientsLoading && patientOptions.length === 0;

  const submitDisabled =
    createMutation.isPending ||
    (isAdmin && (!selectedDoctorId || doctorOptions.length === 0)) ||
    (isDoctor && !selectedDoctorId) ||
    patientOptions.length === 0;

  return (
    <Modal open={open} onClose={handleClose} title="Schedule Appointment">
      <form
        onSubmit={handleSubmit((d) =>
          createMutation.mutate({
            ...d,
            scheduledAt: new Date(d.scheduledAt).toISOString(),
          })
        )}
        className="space-y-4"
      >
        {noDoctors && (
          <p className="text-sm text-muted bg-surface rounded-md p-3">
            No doctors found. Invite a doctor first before scheduling appointments.
          </p>
        )}

        {isAdmin && (
          <Select
            label="Doctor"
            placeholder={doctorsLoading ? 'Loading doctors…' : 'Select doctor'}
            options={doctorOptions}
            error={errors.doctorId?.message}
            disabled={doctorsLoading || doctorOptions.length === 0}
            required
            name="doctorId"
            value={selectedDoctorId ?? ''}
            onChange={(e) => {
              setValue('doctorId', e.target.value, { shouldValidate: true });
              setValue('patientId', '');
            }}
          />
        )}

        <Select
          label="Patient"
          placeholder={
            isAdmin && !selectedDoctorId
              ? 'Select a doctor first'
              : patientsLoading
                ? 'Loading patients…'
                : 'Select patient'
          }
          options={patientOptions}
          error={errors.patientId?.message}
          disabled={isAdmin ? !selectedDoctorId || patientsLoading : patientsLoading}
          required
          value={watch('patientId') ?? ''}
          {...register('patientId')}
        />

        {noPatients && (
          <p className="text-sm text-muted bg-surface rounded-md p-3">
            {isAdmin
              ? 'This doctor has no assigned patients. Invite a patient and assign them to this doctor first.'
              : 'You have no assigned patients yet. Invite a patient before scheduling.'}
          </p>
        )}

        <Input
          label="Date & Time"
          type="datetime-local"
          error={errors.scheduledAt?.message}
          required
          {...register('scheduledAt')}
        />

        <ModalFooter>
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending} disabled={submitDisabled}>
            Schedule
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
