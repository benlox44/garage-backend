export const APPOINTMENT_DURATION = {
  MIN_HOURS_BETWEEN_APPOINTMENTS: 60, // minutes
} as const;

export type AppointmentDuration = typeof APPOINTMENT_DURATION[keyof typeof APPOINTMENT_DURATION];
