import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildPixPayload } from '../common/pix';

@Controller('public/links')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code')
  async getByCode(@Param('code') code: string) {
    const link = await this.prisma.paymentLink.findUnique({
      where: { code },
      include: {
        photos: { orderBy: { order: 'asc' } },
        products: { orderBy: { order: 'asc' } },
        upsells: {
          where: { product: { active: true } },
          include: { product: true },
          orderBy: { order: 'asc' },
        },
        pixKey: true,
        user: { select: { tradeName: true, logoPath: true } },
      },
    });
    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }

    const expired = link.expiresAt.getTime() <= Date.now();

    const pixPayload = buildPixPayload({
      key: link.pixKey.key,
      keyType: link.pixKey.type,
      merchantName: link.pixKey.holderName,
      merchantCity: link.pixKey.city,
      amount: link.amount ? link.amount.toFixed(2) : undefined,
      txid: link.code,
    });

    return {
      code: link.code,
      title: link.title,
      description: link.description,
      amount: link.amount ? Number(link.amount) : null,
      shipping: link.shipping ? Number(link.shipping) : null,
      products: link.products.map((p) => ({
        name: p.name,
        price: Number(p.price),
      })),
      upsells: link.upsells.map((u) => ({
        id: u.product.id,
        name: u.product.name,
        description: u.product.description,
        photoPath: u.product.photoPath,
        price: Number(u.product.price),
      })),
      ctaPhrase: link.ctaPhrase,
      expiresAt: link.expiresAt,
      expired,
      photos: link.photos.map((p) => p.path),
      merchant: {
        tradeName: link.user.tradeName,
        logoPath: link.user.logoPath,
      },
      pix: {
        payload: pixPayload,
        key: link.pixKey.key,
        type: link.pixKey.type,
        merchantName: link.pixKey.holderName,
        merchantCity: link.pixKey.city,
        txid: link.code,
      },
    };
  }
}
