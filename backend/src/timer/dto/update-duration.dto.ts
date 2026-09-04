import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class UpdateDurationDto {
  @IsInt({ message: 'Durasi harus berupa bilangan bulat dalam detik' })
  @Min(10, { message: 'Durasi minimal adalah 10 detik' })
  @Max(7200, { message: 'Durasi maksimal adalah 7200 detik (2 jam)' })
  @IsNotEmpty({ message: 'Durasi tidak boleh kosong' })
  duration: number;
}
