import { Module } from '@nestjs/common';
import { UpsellProductsService } from './upsell-products.service';
import { UpsellProductsController } from './upsell-products.controller';

@Module({
  controllers: [UpsellProductsController],
  providers: [UpsellProductsService],
})
export class UpsellProductsModule {}
