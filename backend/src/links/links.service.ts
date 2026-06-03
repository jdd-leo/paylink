import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';

const generateCode = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz',
  10,
);

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLinkDto, photoPaths: string[]) {
    const pixKey = await this.prisma.pixKey.findFirst({
      where: { id: dto.pixKeyId, userId },
    });
    if (!pixKey) {
      throw new BadRequestException('Chave Pix inválida');
    }

    const hours = dto.expirationHours ?? 1;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    return this.prisma.paymentLink.create({
      data: {
        code: generateCode(),
        userId,
        pixKeyId: dto.pixKeyId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount ?? null,
        ctaPhrase: dto.ctaPhrase || undefined,
        expirationHours: hours,
        expiresAt,
        photos: {
          create: photoPaths.map((path, order) => ({ path, order })),
        },
      },
      include: { photos: { orderBy: { order: 'asc' } }, pixKey: true },
    });
  }

  async list(userId: string, { page = 1, limit = 10 }: ListLinksDto) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.paymentLink.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          photos: { orderBy: { order: 'asc' } },
          pixKey: { select: { id: true, label: true, key: true, type: true } },
        },
      }),
      this.prisma.paymentLink.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(userId: string, id: string) {
    const link = await this.prisma.paymentLink.findFirst({
      where: { id, userId },
      include: {
        photos: { orderBy: { order: 'asc' } },
        pixKey: true,
      },
    });
    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }
    return link;
  }
}
