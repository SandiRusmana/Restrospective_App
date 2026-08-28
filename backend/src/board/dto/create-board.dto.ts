import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsString({ message: 'Nama board harus berupa string' })
  @IsNotEmpty({ message: 'Nama board wajib diisi' })
  name: string;

  @IsString({ message: 'Template harus berupa string' })
  @IsOptional()
  template?: string;

  @IsBoolean({ message: 'isAnonymous harus berupa boolean' })
  @IsOptional()
  isAnonymous?: boolean;

  @IsInt({ message: 'voteLimit harus berupa angka' })
  @IsOptional()
  voteLimit?: number;
}
