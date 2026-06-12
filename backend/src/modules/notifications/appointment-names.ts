export function formatDoctorName(doctor: {
  firstName: string;
  lastName: string;
}): string {
  return `Dr. ${doctor.firstName} ${doctor.lastName}`.trim();
}

export function formatPatientName(patient: {
  firstName: string;
  lastName: string;
}): string {
  return `${patient.firstName} ${patient.lastName}`.trim();
}

export function appointmentNamePayload(
  patientName: string,
  doctorName: string,
  dateStr?: string,
): Record<string, string> {
  return dateStr ? { patientName, doctorName, date: dateStr } : { patientName, doctorName };
}

export function appointmentScheduledMessage(
  patientName: string,
  doctorName: string,
  dateStr: string,
): string {
  return `Appointment scheduled between ${patientName} and ${doctorName} for ${dateStr}.`;
}

export function appointmentConfirmedMessage(
  patientName: string,
  doctorName: string,
  dateStr: string,
): string {
  return `Appointment confirmed between ${patientName} and ${doctorName} on ${dateStr}.`;
}

export function appointmentRequestMessage(
  patientName: string,
  doctorName: string,
  dateStr: string,
): string {
  return `${patientName} requested an appointment with ${doctorName} for ${dateStr}.`;
}

export function appointmentRequestSubmittedMessage(
  patientName: string,
  doctorName: string,
  dateStr: string,
): string {
  return `${patientName}, your appointment request with ${doctorName} for ${dateStr} has been submitted. We will notify you when the doctor confirms.`;
}

export function appointmentDeclinedMessage(
  patientName: string,
  doctorName: string,
  dateStr: string,
): string {
  return `The appointment request between ${patientName} and ${doctorName} on ${dateStr} was declined.`;
}

export function appointmentCancelledMessage(
  patientName: string,
  doctorName: string,
  dateStr: string,
): string {
  return `The appointment between ${patientName} and ${doctorName} on ${dateStr} has been cancelled.`;
}
