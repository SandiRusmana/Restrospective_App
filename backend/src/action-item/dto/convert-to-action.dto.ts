import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ActionItemStatusDto } from './update-action-item.dto';

export class ConvertToActionDto {
  @IsOptional()
  @IsString({ message: 'assigneeId harus berupa string ID user' })
  assigneeId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate harus berupa format tanggal ISO 8601 yang valid' })
  dueDate?: string;

  @IsOptional()
  @IsString({ message: 'title harus berupa string' })
  title?: string;

  @IsOptional()
  @IsEnum(ActionItemStatusDto, { message: 'status harus berupa PENDING, IN_PROGRESS, atau DONE' })
  status?: ActionItemStatusDto;
}
