import { IsNotEmpty, IsString } from 'class-validator';

export class RejectAppointmentDto {
  @IsNotEmpty({
    message: 'Rejection reason is required'
  })
  @IsString({
    message: 'Rejection reason must be a valid text'
  })
  public rejectionReason: string;
}
