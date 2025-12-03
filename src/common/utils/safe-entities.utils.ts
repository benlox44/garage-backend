import { Appointment } from '../../appointments/entities/appointment.entity.js';
import { MechanicSchedule } from '../../schedules/entities/mechanic-schedule.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { SafeAppointment, SafeAppointmentForClient, SafeAppointmentForMechanic, SafeAppointmentWithSimpleClient, SafeClient, SafeMechanic, SafeSchedule, SafeUser, SafeVehicle } from '../types/safe-entities.type.js';

// Transforms entities to prevent sensitive data exposure in API responses
export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function toSafeMechanic(user: User): SafeMechanic {
  return {
    id: user.id,
    name: user.name
  };
}

export function toSafeClient(user: User): SafeClient {
  return {
    id: user.id,
    name: user.name
  };
}


export function toSafeVehicle(vehicle: Vehicle): SafeVehicle {
  return {
    id: vehicle.id,
    licensePlate: vehicle.licensePlate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color
  };
}

export function toSafeSchedule(schedule: MechanicSchedule): SafeSchedule {
  const { mechanic, ...scheduleData } = schedule;
  
  return {
    ...scheduleData,
    mechanic: toSafeMechanic(mechanic)
  };
}

export function toSafeAppointment(appointment: Appointment): SafeAppointment {
  const { client, mechanic, vehicle, schedule, ...appointmentData } = appointment;
  
  return {
    ...appointmentData,
    client: toSafeUser(client),
    mechanic: toSafeMechanic(mechanic),
    vehicle: toSafeVehicle(vehicle),
    schedule: {
      id: schedule.id,
      date: schedule.date,
      availableHours: schedule.availableHours
    }
  };
}

export function toSafeAppointmentForClient(appointment: Appointment): SafeAppointmentForClient {
  const { client: _client, mechanic, vehicle, schedule: _schedule, clientId: _clientId, mechanicId: _mechanicId, vehicleId: _vehicleId, scheduleId: _scheduleId, ...appointmentData } = appointment;
  
  return {
    ...appointmentData,
    mechanic: toSafeMechanic(mechanic),
    vehicle: toSafeVehicle(vehicle)
  };
}

export function toSafeAppointmentForMechanic(appointment: Appointment): SafeAppointmentForMechanic {
  const { client, mechanic: _mechanic, vehicle, schedule: _schedule, clientId: _clientId, mechanicId: _mechanicId, vehicleId: _vehicleId, scheduleId: _scheduleId, ...appointmentData } = appointment;
  
  return {
    ...appointmentData,
    client: toSafeClient(client),
    vehicle: toSafeVehicle(vehicle)
  };
}

export function toSafeAppointmentWithSimpleClient(appointment: Appointment): SafeAppointmentWithSimpleClient {
  const { client, mechanic, vehicle, schedule, ...appointmentData } = appointment;
  
  return {
    ...appointmentData,
    client: toSafeClient(client),
    mechanic: toSafeMechanic(mechanic),
    vehicle: toSafeVehicle(vehicle),
    schedule: {
      id: schedule.id,
      date: schedule.date,
      availableHours: schedule.availableHours
    }
  };
}
