import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'Konten komentar harus berupa teks' })
  @IsNotEmpty({ message: 'Konten komentar tidak boleh kosong' })
  content: string;
}
