import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { OrdersService } from './orders/orders.service';
import { Order, OrderDocument } from './orders/schemas/order.schema';
import { ProductsService } from './products/products.service';
import { ReviewsService } from './products/reviews.service';
import { Product, ProductDocument } from './products/schemas/product.schema';
import { Review, ReviewDocument } from './products/schemas/review.schema';
import {
  Supplier,
  SupplierDocument,
} from './suppliers/schemas/supplier.schema';

const DEMO_USER_ID = '5f9d7a3b2c1e4f0012345678';

const reviewerId = (i: number) =>
  '1111111111111111111111' + String(i).padStart(2, '0');

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const supplierModel = app.get<Model<SupplierDocument>>(
    getModelToken(Supplier.name),
  );
  const productModel = app.get<Model<ProductDocument>>(
    getModelToken(Product.name),
  );
  const reviewModel = app.get<Model<ReviewDocument>>(
    getModelToken(Review.name),
  );
  const orderModel = app.get<Model<OrderDocument>>(getModelToken(Order.name));
  const productsService = app.get(ProductsService);
  const reviewsService = app.get(ReviewsService);
  const ordersService = app.get(OrdersService);

  await Promise.all([
    supplierModel.deleteMany({}),
    productModel.deleteMany({}),
    reviewModel.deleteMany({}),
    orderModel.deleteMany({}),
  ]);

  const acme = await supplierModel.create({
    name: 'Acme Components',
    contactEmail: 'sales@acme.example',
    country: 'US',
  });
  const globex = await supplierModel.create({
    name: 'Globex Trading',
    contactEmail: 'orders@globex.example',
    country: 'DE',
  });

  const seedProducts = [
    {
      name: 'Mechanical Keyboard',
      price: 89.99,
      stock: 120,
      supplierId: acme._id.toString(),
    },
    {
      name: 'USB-C Cable',
      price: 12.5,
      stock: 500,
      supplierId: acme._id.toString(),
    },
    {
      name: 'Wireless Mouse',
      price: 34.0,
      stock: 200,
      supplierId: globex._id.toString(),
    },
  ];

  const products: ProductDocument[] = [];
  for (const p of seedProducts) {
    products.push(await productsService.create(p));
  }

  const comments = [
    'Excellent quality, highly recommend.',
    'Works as described.',
    'Good value for the price.',
    'Decent but could be better.',
    'Exactly what I needed.',
    'Shipping was fast.',
    'Would buy again.',
    'Solid build quality.',
  ];
  for (const product of products) {
    for (let i = 0; i < comments.length; i++) {
      await reviewsService.addReview(product._id.toString(), {
        userId: reviewerId(i),
        rating: (i % 5) + 1,
        comment: comments[i],
      });
    }
  }

  await ordersService.create({
    userId: DEMO_USER_ID,
    items: [
      { productId: products[0]._id.toString(), quantity: 1 },
      { productId: products[1]._id.toString(), quantity: 3 },
    ],
  });
  await ordersService.create({
    userId: DEMO_USER_ID,
    items: [{ productId: products[2]._id.toString(), quantity: 2 }],
  });

  console.log('Seed complete.');

  console.log({
    demoUserId: DEMO_USER_ID,
    suppliers: [acme._id.toString(), globex._id.toString()],
    products: products.map((p) => ({ id: p._id.toString(), name: p.name })),
    tryItOut: [
      `GET /products/${products[0]._id.toString()}`,
      `GET /products/${products[0]._id.toString()}?withSupplier=true`,
      `GET /products/${products[0]._id.toString()}/reviews?page=2&limit=5`,
      `GET /orders?userId=${DEMO_USER_ID}&productName=Mechanical%20Keyboard`,
    ],
  });

  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
