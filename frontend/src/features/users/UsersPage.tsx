import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Button, Card, Input, Modal, ModalFooter,
  Pagination, EmptyState, Skeleton, Select,
} from '@/components/ui';
import { GENDER_OPTIONS } from '@/api/patients.api';
import { PatientGender } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { usersApi, userKeys } from '@/api/users.api';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types';
import { formatDate, formatRelative } from '@/utils';
import { cn } from '@/utils/cn';

type RoleFilter = 'all' | 'doctor' | 'patient' | 'admin';

const inviteDoctorSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const invitePatientSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  doctorId: z.string().uuid().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
});

type InviteDoctorValues = z.infer<typeof inviteDoctorSchema>;
type InvitePatientValues = z.infer<typeof invitePatientSchema>;

export function UsersPage() {
  const { role: currentRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [inviteDoctorOpen, setInviteDoctorOpen] = useState(false);
  const [invitePatientOpen, setInvitePatientOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const params = {
    role: roleFilter !== 'all' ? (roleFilter as 'admin' | 'doctor' | 'patient') : undefined,
    search: search || undefined,
    page,
    pageSize: 15,
  };

  const { data, isLoading } = useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
    retry: 1,
  });

  const doctorForm = useForm<InviteDoctorValues>({ resolver: zodResolver(inviteDoctorSchema) });
  const patientForm = useForm<InvitePatientValues>({
    resolver: zodResolver(invitePatientSchema),
    defaultValues: { gender: PatientGender.MALE },
  });

  const { data: doctorProfiles } = useQuery({
    queryKey: ['doctor-profiles'],
    queryFn: () => usersApi.doctorProfiles(),
    enabled: currentRole === 'admin',
    retry: 1,
  });

  const inviteDoctorMutation = useMutation({
    mutationFn: usersApi.inviteDoctor,
    onSuccess: () => {
      toast.success('Doctor invitation sent!');
      setInviteDoctorOpen(false);
      doctorForm.reset();
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Failed to send invitation'),
  });

  const invitePatientMutation = useMutation({
    mutationFn: usersApi.invitePatient,
    onSuccess: () => {
      toast.success('Patient invitation sent!');
      setInvitePatientOpen(false);
      patientForm.reset();
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Failed to send invitation'),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      toast.success('User removed');
      setDeleteUserId(null);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const tabs: { label: string; value: RoleFilter }[] = [
    { label: 'All Users', value: 'all' },
    { label: 'Doctors', value: 'doctor' },
    { label: 'Patients', value: 'patient' },
  ];

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-secondary-100 text-secondary-700',
    doctor: 'bg-primary-100 text-primary-700',
    patient: 'bg-success-100 text-success-700',
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Users"
        subtitle="Manage doctors, patients, and administrators"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setInvitePatientOpen(true)}
            >
              Invite Patient
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setInviteDoctorOpen(true)}
            >
              Invite Doctor
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-white border border-border rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setRoleFilter(t.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap min-h-[36px]',
                roleFilter === t.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-slate-700 hover:bg-surface'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search users..."
            leadingIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">MFA</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Last Login</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState title="No users found" />
                    </td>
                  </tr>
                ) : (
                  data?.items.map((user) => (
                    <tr key={user.id} className="hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name ?? user.email} size="xs" />
                          <div>
                            <p className="font-medium text-slate-900">{user.name ?? user.email}</p>
                            <p className="text-xs text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', roleColors[user.role])}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.mfaEnabled ? (
                          <div className="flex items-center gap-1 text-success-600 text-xs">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Active
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Disabled</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm">
                        {user.lastLogin ? formatRelative(user.lastLogin) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm">
                        {user.createdAt ? formatDate(user.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteUserId(user.id)}
                          className="p-2 text-muted hover:text-danger hover:bg-danger-50 rounded-md transition-colors"
                          aria-label={`Delete ${user.email}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          data?.items.map((user) => (
            <Card key={user.id} padding="md">
              <div className="flex items-center gap-3">
                <Avatar name={user.name ?? user.email} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{user.name ?? user.email}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium capitalize', roleColors[user.role])}>
                      {user.role}
                    </span>
                    {user.mfaEnabled && <ShieldCheck className="w-3.5 h-3.5 text-success" />}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteUserId(user.id)}
                  className="p-2 text-muted hover:text-danger"
                  aria-label="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      {/* Invite Doctor Modal */}
      <Modal open={inviteDoctorOpen} onClose={() => { setInviteDoctorOpen(false); doctorForm.reset(); }} title="Invite Doctor">
        <form onSubmit={doctorForm.handleSubmit((v) => inviteDoctorMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" required error={doctorForm.formState.errors.firstName?.message} {...doctorForm.register('firstName')} />
            <Input label="Last Name" required error={doctorForm.formState.errors.lastName?.message} {...doctorForm.register('lastName')} />
          </div>
          <Input label="Email" type="email" required error={doctorForm.formState.errors.email?.message} {...doctorForm.register('email')} />
          <Input label="Specialty" placeholder="e.g. Cardiology" {...doctorForm.register('specialty')} />
          <Input label="License Number" placeholder="e.g. MD-12345" {...doctorForm.register('licenseNumber')} />
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => { setInviteDoctorOpen(false); doctorForm.reset(); }}>Cancel</Button>
            <Button type="submit" loading={inviteDoctorMutation.isPending}>Send Invitation</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Invite Patient Modal */}
      <Modal open={invitePatientOpen} onClose={() => { setInvitePatientOpen(false); patientForm.reset(); }} title="Invite Patient">
        <form onSubmit={patientForm.handleSubmit((v) => invitePatientMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" required error={patientForm.formState.errors.firstName?.message} {...patientForm.register('firstName')} />
            <Input label="Last Name" required error={patientForm.formState.errors.lastName?.message} {...patientForm.register('lastName')} />
          </div>
          <Input label="Email" type="email" required error={patientForm.formState.errors.email?.message} {...patientForm.register('email')} />

          {currentRole === 'admin' && (
            <Select
              label="Assign to doctor"
              placeholder="Select doctor"
              options={(doctorProfiles ?? []).map((d) => ({
                value: d.id,
                label: `Dr. ${d.firstName} ${d.lastName}`.trim(),
              }))}
              error={patientForm.formState.errors.doctorId?.message}
              required
              {...patientForm.register('doctorId')}
            />
          )}

          <Select
            label="Gender"
            options={[...GENDER_OPTIONS]}
            error={patientForm.formState.errors.gender?.message}
            {...patientForm.register('gender')}
          />
          <Input label="Date of Birth" type="date" {...patientForm.register('dateOfBirth')} />
          <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" {...patientForm.register('phone')} />
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => { setInvitePatientOpen(false); patientForm.reset(); }}>Cancel</Button>
            <Button type="submit" loading={invitePatientMutation.isPending}>Send Invitation</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteUserId} onClose={() => setDeleteUserId(null)} title="Remove User" size="sm">
        <p className="text-slate-700">Are you sure you want to remove this user? They will lose access immediately.</p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteUserId(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
          >
            Remove User
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
