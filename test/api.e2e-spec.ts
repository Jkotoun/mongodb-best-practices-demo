import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  Product,
  ProductDocument,
} from '../src/products/schemas/product.schema';
import { Review, ReviewDocument } from '../src/products/schemas/review.schema';
import { Order, OrderDocument } from '../src/orders/schemas/order.schema';
import {
  Supplier,
  SupplierDocument,
} from '../src/suppliers/schemas/supplier.schema';

interface SupplierResponse {
  _id: string;
  name: string;
}

interface ProductResponse {
  _id: string;
  name: string;
  supplierId: string | { _id: string; name: string };
  topReviews: Array<{ comment: string }>;
  reviewCount: number;
  ratingAverage: number;
}

interface ReviewListResponse {
  total: number;
  items: unknown[];
}

interface OrderResponse {
  _id: string;
  total: number;
  items: Array<{
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
}

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let supplierModel: Model<SupplierDocument>;
  let productModel: Model<ProductDocument>;
  let reviewModel: Model<ReviewDocument>;
  let orderModel: Model<OrderDocument>;

  const createdSupplierIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    supplierModel = moduleFixture.get<Model<SupplierDocument>>(
      getModelToken(Supplier.name),
    );
    productModel = moduleFixture.get<Model<ProductDocument>>(
      getModelToken(Product.name),
    );
    reviewModel = moduleFixture.get<Model<ReviewDocument>>(
      getModelToken(Review.name),
    );
    orderModel = moduleFixture.get<Model<OrderDocument>>(
      getModelToken(Order.name),
    );
  }, 20000);

  afterAll(async () => {
    await Promise.all([
      orderModel.deleteMany({ _id: { $in: createdOrderIds } }),
      reviewModel.deleteMany({
        productId: {
          $in: createdProductIds.map((id) => new Types.ObjectId(id)),
        },
      }),
      productModel.deleteMany({ _id: { $in: createdProductIds } }),
      supplierModel.deleteMany({ _id: { $in: createdSupplierIds } }),
    ]);
    await app.close();
  });

  async function createSupplier(): Promise<SupplierResponse> {
    const res = await request(server)
      .post('/suppliers')
      .send({
        name: 'E2E Supplier',
        contactEmail: 'e2e@example.com',
        country: 'CZ',
      })
      .expect(201);
    const supplier = res.body as SupplierResponse;
    createdSupplierIds.push(supplier._id);
    return supplier;
  }

  async function createProduct(
    supplierId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<ProductResponse> {
    const res = await request(server)
      .post('/products')
      .send({
        name: 'E2E Product',
        price: 10,
        stock: 50,
        supplierId,
        ...overrides,
      })
      .expect(201);
    const product = res.body as ProductResponse;
    createdProductIds.push(product._id);
    return product;
  }

  describe('/suppliers', () => {
    it('creates a supplier and fetches it by id', async () => {
      const supplier = await createSupplier();

      const res = await request(server)
        .get(`/suppliers/${supplier._id}`)
        .expect(200);

      expect((res.body as SupplierResponse).name).toBe('E2E Supplier');
    });

    it('returns 404 for an unknown supplier id', async () => {
      const unknownId = new Types.ObjectId().toString();
      await request(server).get(`/suppliers/${unknownId}`).expect(404);
    });
  });

  describe('/products', () => {
    it('creates a product and fetches it by id', async () => {
      const supplier = await createSupplier();
      const product = await createProduct(supplier._id);

      const res = await request(server)
        .get(`/products/${product._id}`)
        .expect(200);

      const found = res.body as ProductResponse;
      expect(found.name).toBe('E2E Product');
      expect(found.supplierId).toBe(supplier._id);
    });

    it('populates the supplier when withSupplier=true', async () => {
      const supplier = await createSupplier();
      const product = await createProduct(supplier._id);

      const res = await request(server)
        .get(`/products/${product._id}`)
        .query({ withSupplier: 'true' })
        .expect(200);

      expect((res.body as ProductResponse).supplierId).toMatchObject({
        _id: supplier._id,
        name: 'E2E Supplier',
      });
    });
  });

  describe('/products/:id/reviews', () => {
    it('adding a review updates reviewCount, ratingAverage and the embedded top-5 cache', async () => {
      const supplier = await createSupplier();
      const product = await createProduct(supplier._id);

      let latest: ProductResponse = product;
      for (let i = 1; i <= 7; i++) {
        const res = await request(server)
          .post(`/products/${product._id}/reviews`)
          .send({
            userId: new Types.ObjectId().toString(),
            rating: i % 5 === 0 ? 5 : 3,
            comment: `review number ${i}`,
          })
          .expect(201);
        latest = res.body as ProductResponse;
      }

      expect(latest.reviewCount).toBe(7);
      expect(latest.topReviews).toHaveLength(5);
      expect(latest.topReviews[0].comment).toBe('review number 7');
      expect(latest.ratingAverage).toBeGreaterThan(0);
      expect(latest.ratingAverage).toBeLessThanOrEqual(5);
    });

    it('lists reviews with pagination', async () => {
      const supplier = await createSupplier();
      const product = await createProduct(supplier._id);

      for (let i = 1; i <= 3; i++) {
        await request(server)
          .post(`/products/${product._id}/reviews`)
          .send({
            userId: new Types.ObjectId().toString(),
            rating: 4,
            comment: `paged review ${i}`,
          })
          .expect(201);
      }

      const res = await request(server)
        .get(`/products/${product._id}/reviews`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      const body = res.body as ReviewListResponse;
      expect(body.total).toBe(3);
      expect(body.items).toHaveLength(2);
    });
  });

  describe('/orders', () => {
    it('creates an order and snapshots product name/price at purchase time', async () => {
      const supplier = await createSupplier();
      const product = await createProduct(supplier._id, { price: 25 });
      const userId = new Types.ObjectId().toString();

      const res = await request(server)
        .post('/orders')
        .send({
          userId,
          items: [{ productId: product._id, quantity: 3 }],
        })
        .expect(201);
      const order = res.body as OrderResponse;
      createdOrderIds.push(order._id);

      expect(order.total).toBe(75);
      expect(order.items[0]).toMatchObject({
        productName: 'E2E Product',
        unitPrice: 25,
        quantity: 3,
        lineTotal: 75,
      });
    });

    it('rejects an order referencing an unknown product', async () => {
      const userId = new Types.ObjectId().toString();
      const unknownProductId = new Types.ObjectId().toString();

      await request(server)
        .post('/orders')
        .send({
          userId,
          items: [{ productId: unknownProductId, quantity: 1 }],
        })
        .expect(400);
    });

    it('fetches an order by id and finds it by userId/productName search', async () => {
      const supplier = await createSupplier();
      const product = await createProduct(supplier._id);
      const userId = new Types.ObjectId().toString();

      const createRes = await request(server)
        .post('/orders')
        .send({ userId, items: [{ productId: product._id, quantity: 1 }] })
        .expect(201);
      const created = createRes.body as OrderResponse;
      createdOrderIds.push(created._id);

      await request(server).get(`/orders/${created._id}`).expect(200);

      const searchRes = await request(server)
        .get('/orders')
        .query({ userId, productName: 'E2E Product' })
        .expect(200);

      const results = searchRes.body as OrderResponse[];
      expect(results).toHaveLength(1);
      expect(results[0]._id).toBe(created._id);
    });
  });
});
