import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
})
export class AppModule {}
