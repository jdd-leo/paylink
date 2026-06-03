import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { imageFileFilter, imageStorage, MAX_IMAGE_SIZE } from '../common/upload';

@Controller('links')
@UseGuards(JwtAuthGuard)
export class LinksController {
  constructor(private readonly service: LinksService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('photos', 5, {
      storage: imageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateLinkDto,
    @UploadedFiles() photos?: Express.Multer.File[],
  ) {
    const paths = (photos ?? []).map((f) => `/uploads/${f.filename}`);
    return this.service.create(user.userId, dto, paths);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListLinksDto) {
    return this.service.list(user.userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.userId, id);
  }
}
