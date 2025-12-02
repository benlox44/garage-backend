import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AddWorkOrderItemDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsOptional()
  @IsNumber()
  public inventoryItemId?: number;

  @IsString()
  @IsNotEmpty()
  public type: 'spare_part' | 'tool' | 'service';

  @IsNumber()
  @Min(1)
  public quantity: number;

  @IsNumber()
  @Min(0)
  public unitPrice: number;

  @IsOptional()
  public requiresApproval?: boolean;
}

export class AddWorkOrderItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddWorkOrderItemDto)
  public items: AddWorkOrderItemDto[];
}
