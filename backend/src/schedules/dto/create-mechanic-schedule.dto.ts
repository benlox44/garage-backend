import { IsDateString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

import { IsFutureDate } from '../decorators/future-date.decorator.js';
import { IsValidHourSchedule } from '../decorators/valid-hour-schedule.decorator.js';

export class CreateMechanicScheduleDto {
  @IsDateString()
  @IsNotEmpty()
  @IsFutureDate()
  public date: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsValidHourSchedule()
  public availableHours: string[];
}
