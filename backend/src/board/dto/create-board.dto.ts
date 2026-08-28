import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsString({ message: 'Nama board harus berupa string' })
  @IsNotEmpty({ message: 'Nama board wajib diisi' })
  name: string;

  @IsString({ message: 'Template harus berupa string' })
  @IsOptional()
  template?: string;

  @IsArray({ message: 'customColumns harus berupa array' })
  @IsString({ each: true, message: 'Setiap nama kolom custom harus berupa string' })
  @IsOptional()
  customColumns?: string[];

  @IsBoolean({ message: 'isAnonymous harus berupa boolean' })
  @IsOptional()
  isAnonymous?: boolean;

  @IsInt({ message: 'voteLimit harus berupa angka' })
  @IsOptional()
  voteLimit?: number;
}
