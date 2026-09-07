import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAnonymousDto {
  @IsOptional()
  @IsBoolean({ message: 'isAnonymous harus berupa nilai boolean' })
  isAnonymous?: boolean;
}
