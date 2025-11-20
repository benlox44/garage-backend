export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  IN_SERVICE: 'in_service',
  READY_FOR_PICKUP: 'ready_for_pickup',
} as const;

export type VehicleStatus = typeof VEHICLE_STATUS[keyof typeof VEHICLE_STATUS];
