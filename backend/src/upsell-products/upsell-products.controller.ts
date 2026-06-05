import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import {
  imageFileFilter,
  imageStorage,
  MAX_IMAGE_SIZE,
  uploadImage,
} from '../common/upload';
import { UpsellProductsService } from './upsell-products.service';
import { CreateUpsellProductDto } from './dto/create-upsell-product.dto';
import { UpdateUpsellProductDto } from './dto/update-upsell-product.dto';

const photoInterceptor = FileInterceptor('photo', {
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

@Controller('upsell-products')
@UseGuards(JwtAuthGuard)
export class UpsellProductsController {
  constructor(private readonly service: UpsellProductsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('activeOnly') activeOnly?: string) {
    return this.service.list(user.userId, activeOnly === 'true');
  }

  @Post()
  @UseInterceptors(photoInterceptor)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateUpsellProductDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const photoPath = photo ? await uploadImage(photo) : null;
    return this.service.create(user.userId, dto, photoPath);
  }

  @Patch(':id')
  @UseInterceptors(photoInterceptor)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUpsellProductDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const photoPath = photo ? await uploadImage(photo) : null;
    return this.service.update(user.userId, id, dto, photoPath);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
