import { IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

import { APPOINTMENT_STATUS, type AppointmentStatus } from '../../common/constants/appointment-status.constant.js';

export class UpdateAppointmentDto {
  @IsIn([APPOINTMENT_STATUS.ACCEPTED, APPOINTMENT_STATUS.REJECTED], {
    message: 'Status must be either accepted or rejected'
  })
  public status: AppointmentStatus;

  @ValidateIf((o: UpdateAppointmentDto) => o.status === APPOINTMENT_STATUS.REJECTED)
  @IsNotEmpty({
    message: 'Rejection reason is required when rejecting an appointment'
  })
  @IsString({
    message: 'Rejection reason must be a valid text'
  })
  public rejectionReason?: string;
}
