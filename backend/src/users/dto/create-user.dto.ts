import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  tradeName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsEnum(['ROOT', 'CREATOR'])
  role?: 'ROOT' | 'CREATOR';

  @IsOptional()
  @IsEnum(['FREE', 'CREATOR', 'PRO'])
  plan?: 'FREE' | 'CREATOR' | 'PRO';
}
