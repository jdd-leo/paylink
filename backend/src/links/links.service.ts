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

    const products = dto.products ?? [];
    const shipping = dto.shipping ?? 0;
    const productsTotal = products.reduce((sum, p) => sum + p.price, 0);
    const total = productsTotal + shipping;

    return this.prisma.paymentLink.create({
      data: {
        code: generateCode(),
        userId,
        pixKeyId: dto.pixKeyId,
        title: dto.title,
        description: dto.description || null,
        amount: total > 0 ? total : null,
        shipping: dto.shipping ?? null,
        ctaPhrase: dto.ctaPhrase || undefined,
        expirationHours: hours,
        expiresAt,
        photos: {
          create: photoPaths.map((path, order) => ({ path, order })),
        },
        products: {
          create: products.map((p, order) => ({
            name: p.name,
            price: p.price,
            order,
          })),
        },
      },
      include: {
        photos: { orderBy: { order: 'asc' } },
        products: { orderBy: { order: 'asc' } },
        pixKey: true,
      },
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
          products: { orderBy: { order: 'asc' } },
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

  async stats(userId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, active, last7, pixKeys, activeValue, ticket, recent] =
      await this.prisma.$transaction([
        this.prisma.paymentLink.count({ where: { userId } }),
        this.prisma.paymentLink.count({
          where: { userId, expiresAt: { gt: now } },
        }),
        this.prisma.paymentLink.count({
          where: { userId, createdAt: { gte: sevenDaysAgo } },
        }),
        this.prisma.pixKey.count({ where: { userId } }),
        this.prisma.paymentLink.aggregate({
          where: { userId, amount: { not: null }, expiresAt: { gt: now } },
          _sum: { amount: true },
        }),
        this.prisma.paymentLink.aggregate({
          where: { userId, amount: { not: null } },
          _avg: { amount: true },
        }),
        this.prisma.paymentLink.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            code: true,
            title: true,
            amount: true,
            expiresAt: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      totalLinks: total,
      activeLinks: active,
      expiredLinks: total - active,
      last7Days: last7,
      pixKeysCount: pixKeys,
      activeValue: activeValue._sum.amount ?? 0,
      avgTicket: ticket._avg.amount ?? 0,
      recent,
    };
  }

  async findOne(userId: string, id: string) {
    const link = await this.prisma.paymentLink.findFirst({
      where: { id, userId },
      include: {
        photos: { orderBy: { order: 'asc' } },
        products: { orderBy: { order: 'asc' } },
        pixKey: true,
      },
    });
    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }
    return link;
  }

  async remove(userId: string, id: string) {
    const link = await this.prisma.paymentLink.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }
    await this.prisma.paymentLink.delete({ where: { id } });
    return { success: true };
  }
}
