import { IsArray, ArrayNotEmpty } from 'class-validator';

import { IsValidHourSchedule } from '../decorators/valid-hour-schedule.decorator.js';

export class UpdateMechanicScheduleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsValidHourSchedule()
  public availableHours: string[];
}
