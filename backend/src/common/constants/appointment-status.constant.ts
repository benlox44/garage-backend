export const APPOINTMENT_STATUS = {
  // Client
  PENDING: 'pending',

  // Mechanic
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];
