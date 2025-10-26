import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  @IsNotEmpty()
  public mechanicId: number;

  @IsNumber()
  @IsNotEmpty()
  public vehicleId: number;

  @IsNumber()
  @IsNotEmpty()
  public scheduleId: number;

  @IsDateString()
  @IsNotEmpty()
  public date: string;

  @IsString()
  @IsNotEmpty()
  public hour: string;

  @IsString()
  @IsOptional()
  public description?: string;
}
