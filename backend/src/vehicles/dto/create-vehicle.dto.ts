import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  public licensePlate: string;

  @IsString()
  @IsNotEmpty()
  public brand: string;

  @IsString()
  @IsNotEmpty()
  public model: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  public year: number;

  @IsString()
  @IsNotEmpty()
  public color: string;
}
