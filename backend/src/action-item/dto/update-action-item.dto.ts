import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ActionItemStatusDto {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export class UpdateActionItemDto {
  @IsOptional()
  @IsEnum(ActionItemStatusDto, { message: 'status harus berupa PENDING, IN_PROGRESS, atau DONE' })
  status?: ActionItemStatusDto;

  @IsOptional()
  @IsString({ message: 'assigneeId harus berupa ID user' })
  assigneeId?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate harus berupa format tanggal ISO 8601 yang valid' })
  dueDate?: string | null;

  @IsOptional()
  @IsString({ message: 'title harus berupa string' })
  title?: string;
}
