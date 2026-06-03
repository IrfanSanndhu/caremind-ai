import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button, Modal, ModalFooter, Select } from '@/components/ui';
import { patientsApi } from '@/api/patients.api';
import type { User } from '@/types';

const schema = z.object({
  doctorId: z.string().uuid('Select a doctor'),
});
type FormValues = z.infer<typeof schema>;

interface DoctorOption {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface ReassignPatientDoctorModalProps {
  patient: User | null;
  doctors: DoctorOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ReassignPatientDoctorModal({
  patient,
  doctors,
  onClose,
  onSuccess,
}: ReassignPatientDoctorModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { doctorId: '' },
  });

  useEffect(() => {
    if (patient) {
      reset({ doctorId: patient.primaryDoctorId ?? '' });
    }
  }, [patient, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      patientsApi.reassignPrimaryDoctor(patient!.patientProfileId!, values.doctorId),
    onSuccess: () => {
      toast.success('Patient reassigned successfully');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Failed to reassign patient'),
  });

  const doctorOptions = doctors.map((d) => ({
    value: d.id,
    label: d.email
      ? `Dr. ${d.firstName} ${d.lastName} (${d.email})`.trim()
      : `Dr. ${d.firstName} ${d.lastName}`.trim(),
  }));

  return (
    <Modal
      open={!!patient}
      onClose={onClose}
      title="Reassign Patient"
      size="sm"
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <p className="text-sm text-slate-700">
          Assign <span className="font-medium">{patient?.name ?? patient?.email}</span> to a
          different doctor.
        </p>
        <Select
          label="Doctor"
          placeholder="Select doctor"
          options={doctorOptions}
          error={errors.doctorId?.message}
          required
          {...register('doctorId')}
        />
        <ModalFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Save
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
