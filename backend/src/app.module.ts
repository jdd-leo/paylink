import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UPLOAD_DIR } from './common/upload';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PixKeysModule } from './pix-keys/pix-keys.module';
import { LinksModule } from './links/links.module';
import { UpsellProductsModule } from './upsell-products/upsell-products.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: UPLOAD_DIR,
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PixKeysModule,
    LinksModule,
    UpsellProductsModule,
    PublicModule,
  ],
})
export class AppModule {}
