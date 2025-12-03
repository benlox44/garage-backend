import { IsEnum } from 'class-validator';

import { VEHICLE_STATUS, type VehicleStatus } from '../../common/constants/vehicle-status.constant.js';

export class UpdateVehicleStatusDto {
  @IsEnum(VEHICLE_STATUS)
  public status: VehicleStatus;
}
