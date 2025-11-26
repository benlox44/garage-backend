import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  public licensePlate?: string;

  @IsOptional()
  @IsString()
  public brand?: string;

  @IsOptional()
  @IsString()
  public model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  public year?: number;

  @IsOptional()
  @IsString()
  public color?: string;
}
