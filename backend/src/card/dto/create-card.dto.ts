import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCardDto {
  @IsString({ message: 'columnId harus berupa string' })
  @IsNotEmpty({ message: 'columnId wajib diisi' })
  columnId: string;

  @IsString({ message: 'content card harus berupa text' })
  @IsNotEmpty({ message: 'content card tidak boleh kosong' })
  content: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
