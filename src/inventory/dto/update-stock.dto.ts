import { IsNumber } from 'class-validator';

export class UpdateStockDto {
  @IsNumber()
  public delta: number;
}
