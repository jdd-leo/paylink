import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { PixKeysService } from './pix-keys.service';
import { CreatePixKeyDto } from './dto/create-pix-key.dto';

@Controller('pix-keys')
@UseGuards(JwtAuthGuard)
export class PixKeysController {
  constructor(private readonly service: PixKeysService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePixKeyDto) {
    return this.service.create(user.userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
