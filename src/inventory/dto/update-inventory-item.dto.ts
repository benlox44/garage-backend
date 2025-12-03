import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInventoryItemDto {
  @IsString()
  @IsOptional()
  public name?: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  public quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  public minStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  public price?: number;
}
