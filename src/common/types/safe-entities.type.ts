import { Appointment } from '../../appointments/entities/appointment.entity.js';
import { MechanicSchedule } from '../../schedules/entities/mechanic-schedule.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';

// Prevents password leaks in API responses
export type SafeUser = Omit<User, 'password'>;

export type SafeMechanic = Pick<User, 'id' | 'name'>;

export type SafeClient = Pick<User, 'id' | 'name'>;

export type SafeVehicle = Pick<Vehicle, 'id' | 'licensePlate' | 'brand' | 'model' | 'year' | 'color'>;

export type SafeSchedule = Omit<MechanicSchedule, 'mechanic'> & {
  mechanic: SafeMechanic;
};

export type SafeAppointment = Omit<Appointment, 'client' | 'mechanic' | 'vehicle' | 'schedule'> & {
  client: SafeUser;
  mechanic: SafeMechanic;
  vehicle: SafeVehicle;
  schedule: Pick<MechanicSchedule, 'id' | 'date' | 'availableHours'>;
};

// Removes redundant IDs to reduce payload size for client-specific views
export type SafeAppointmentForClient = Omit<Appointment, 'client' | 'mechanic' | 'vehicle' | 'schedule' | 'clientId' | 'mechanicId' | 'vehicleId' | 'scheduleId'> & {
  mechanic: SafeMechanic;
  vehicle: SafeVehicle;
};

// Removes redundant IDs to reduce payload size for mechanic-specific views
export type SafeAppointmentForMechanic = Omit<Appointment, 'client' | 'mechanic' | 'vehicle' | 'schedule' | 'clientId' | 'mechanicId' | 'vehicleId' | 'scheduleId'> & {
  client: SafeClient;
  vehicle: SafeVehicle;
};

export type SafeAppointmentWithSimpleClient = Omit<Appointment, 'client' | 'mechanic' | 'vehicle' | 'schedule'> & {
  client: SafeClient;
  mechanic: SafeMechanic;
  vehicle: SafeVehicle;
  schedule: Pick<MechanicSchedule, 'id' | 'date' | 'availableHours'>;
};
