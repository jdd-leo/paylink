import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RootGuard } from '../common/roles.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import {
  imageFileFilter,
  imageStorage,
  MAX_IMAGE_SIZE,
  uploadImage,
} from '../common/upload';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const logoInterceptor = FileInterceptor('logo', {
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const found = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        tradeName: true,
        email: true,
        logoPath: true,
        role: true,
        plan: true,
      },
    });
    if (!found) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return found;
  }

  @Get()
  @UseGuards(RootGuard)
  list() {
    return this.users.list();
  }

  @Post()
  @UseGuards(RootGuard)
  @UseInterceptors(logoInterceptor)
  async create(
    @Body() dto: CreateUserDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const logoPath = logo ? await uploadImage(logo) : null;
    return this.users.create(dto, logoPath);
  }

  @Patch(':id')
  @UseGuards(RootGuard)
  @UseInterceptors(logoInterceptor)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const logoPath = logo ? await uploadImage(logo) : null;
    return this.users.update(id, dto, logoPath);
  }

  @Delete(':id')
  @UseGuards(RootGuard)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    if (user.userId === id) {
      throw new BadRequestException(
        'Não é possível excluir o próprio usuário',
      );
    }
    return this.users.remove(id);
  }
}
