import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUpsellProductDto } from './dto/create-upsell-product.dto';
import { UpdateUpsellProductDto } from './dto/update-upsell-product.dto';

@Injectable()
export class UpsellProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, activeOnly = false) {
    return this.prisma.upsellProduct.findMany({
      where: { userId, ...(activeOnly ? { active: true } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateUpsellProductDto, photoPath: string | null) {
    return this.prisma.upsellProduct.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        price: dto.price,
        active: dto.active ?? true,
        photoPath,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateUpsellProductDto,
    photoPath: string | null,
  ) {
    await this.ensureOwned(userId, id);
    return this.prisma.upsellProduct.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description || null }
          : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(photoPath ? { photoPath } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.upsellProduct.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureOwned(userId: string, id: string) {
    const product = await this.prisma.upsellProduct.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
  }
}
