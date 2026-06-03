import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePixKeyDto } from './dto/create-pix-key.dto';

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
    return this.prisma.pixKey.create({
      data: { ...dto, userId },
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
