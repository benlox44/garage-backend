import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateWorkOrderItemDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsOptional()
  @IsNumber()
  public inventoryItemId?: number;

  @IsString()
  @IsNotEmpty()
  public type: 'spare_part' | 'tool' | 'service';

  @IsInt()
  @Min(1)
  public quantity: number;

  @IsNumber()
  @Min(0)
  public unitPrice: number;

  @IsOptional()
  public requiresApproval?: boolean;
}

export class CreateWorkOrderDto {
  @IsInt()
  @IsOptional()
  public vehicleId?: number;

  @IsString()
  @IsOptional()
  public licensePlate?: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsArray()
  @IsString({ each: true })
  public requestedServices: string[];

  @IsNumber()
  @Min(0)
  public estimatedCost: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderItemDto)
  public items: CreateWorkOrderItemDto[];
}
