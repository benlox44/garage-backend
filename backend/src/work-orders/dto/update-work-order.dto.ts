import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

import { WORK_ORDER_STATUS, type WorkOrderStatus } from '../../common/constants/work-order-status.constant.js';

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsEnum(WORK_ORDER_STATUS)
  public status?: WorkOrderStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  public finalCost?: number;
}
