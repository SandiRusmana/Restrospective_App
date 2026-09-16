import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateBoardDto {
  @IsString({ message: 'Nama board harus berupa string' })
  @IsNotEmpty({ message: 'Nama board wajib diisi' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Judul board harus berupa string' })
  @IsOptional()
  title?: string;
}
