import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePixKeyDto } from './dto/create-pix-key.dto';
import { validateAndNormalizePixKey } from '../common/pix-key';

@Injectable()
export class PixKeysService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.pixKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreatePixKeyDto) {
    const result = validateAndNormalizePixKey(dto.key, dto.type);
    if (!result.ok) {
      throw new BadRequestException(result.error);
    }
    return this.prisma.pixKey.create({
      data: { ...dto, key: result.key, userId },
    });
  }

  async remove(userId: string, id: string) {
    const key = await this.prisma.pixKey.findFirst({ where: { id, userId } });
    if (!key) {
      throw new NotFoundException('Chave Pix não encontrada');
    }
    await this.prisma.pixKey.delete({ where: { id } });
    return { deleted: true };
  }
}
