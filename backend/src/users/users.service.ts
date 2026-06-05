import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  tradeName: true,
  email: true,
  logoPath: true,
  role: true,
  plan: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateUserDto, logoPath: string | null) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        tradeName: dto.tradeName,
        email: dto.email,
        passwordHash,
        logoPath,
        role: dto.role ?? 'CREATOR',
        plan: dto.plan ?? 'FREE',
      },
      select: PUBLIC_FIELDS,
    });
  }

  async update(id: string, dto: UpdateUserDto, logoPath: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (dto.email && dto.email !== user.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (taken) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        tradeName: dto.tradeName ?? undefined,
        email: dto.email ?? undefined,
        role: dto.role ?? undefined,
        plan: dto.plan ?? undefined,
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, 10) }
          : {}),
        ...(logoPath ? { logoPath } : {}),
      },
      select: PUBLIC_FIELDS,
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
