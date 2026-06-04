import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PixKeyType } from '@prisma/client';

export class CreatePixKeyDto {
  @IsEnum(PixKeyType)
  type!: PixKeyType;

  @IsString()
  @MinLength(1)
  @MaxLength(140)
  key!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  holderName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[A-Za-zÀ-ÿ\s]+$/, {
    message: 'A cidade não pode conter números ou caracteres especiais.',
  })
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}
