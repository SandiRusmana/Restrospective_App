import { IsOptional, IsString } from 'class-validator';

export class GroupCardDto {
  @IsOptional()
  @IsString()
  groupId?: string | null;

  @IsOptional()
  @IsString()
  groupTitle?: string | null;
}
