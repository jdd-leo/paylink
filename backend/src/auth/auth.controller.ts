import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { imageFileFilter, imageStorage, MAX_IMAGE_SIZE } from '../common/upload';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: imageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  async register(
    @Headers('x-admin-secret') adminSecret: string,
    @Body() dto: RegisterDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const expected = this.config.get<string>('ADMIN_SECRET');
    if (!expected || adminSecret !== expected) {
      throw new UnauthorizedException('Token de administrador inválido');
    }
    if (!dto?.email) {
      throw new BadRequestException('Dados inválidos');
    }
    const logoPath = logo ? `/uploads/${logo.filename}` : null;
    return this.authService.register(dto, logoPath);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
