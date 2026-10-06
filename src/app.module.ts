import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { GcpOidcGuard } from './common/guards/gcp-oidc.guard';
import { mongooseConfigFactory } from './config/mongoose.config';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: mongooseConfigFactory,
    }),
    SuppliersModule,
    ProductsModule,
    OrdersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: GcpOidcGuard }],
})
export class AppModule {}
