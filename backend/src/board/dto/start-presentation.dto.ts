import { IsOptional, IsString } from 'class-validator';

export class StartPresentationDto {
  @IsOptional()
  @IsString({ message: 'cardId harus berupa string UUID' })
  cardId?: string;
}
