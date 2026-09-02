import { IsOptional, IsString } from 'class-validator';

export class UpdateCardDto {
  @IsOptional()
  @IsString({ message: 'content card harus berupa text' })
  content?: string;

  @IsOptional()
  @IsString({ message: 'columnId harus berupa text' })
  columnId?: string;
}
