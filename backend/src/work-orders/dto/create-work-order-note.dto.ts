import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderNoteDto {
  @IsString()
  @IsNotEmpty()
  public content: string;

  @IsOptional()
  @IsString()
  public imageUrl?: string;
}
