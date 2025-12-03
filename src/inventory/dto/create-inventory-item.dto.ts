import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  public sku: string;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNumber()
  @Min(0)
  public quantity: number;

  @IsNumber()
  @Min(0)
  public minStock: number;

  @IsNumber()
  @Min(0)
  public price: number;
}
