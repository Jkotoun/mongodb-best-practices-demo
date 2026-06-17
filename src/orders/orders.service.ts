import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderDocument> {
    const ids = dto.items.map((i) => new Types.ObjectId(i.productId));
    const products = await this.productModel.find({ _id: { $in: ids } }).exec();
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    const items = dto.items.map((input) => {
      const product = byId.get(input.productId);
      if (!product) {
        throw new BadRequestException(`Product ${input.productId} not found`);
      }
      const lineTotal = product.price * input.quantity;
      return {
        productId: product._id,
        productName: product.name,
        unitPrice: product.price,
        quantity: input.quantity,
        lineTotal,
      };
    });

    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);

    return this.orderModel.create({
      userId: new Types.ObjectId(dto.userId),
      items,
      total,
    });
  }

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  findByUserAndProductName(
    userId: string,
    productName?: string,
  ): Promise<OrderDocument[]> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };
    if (productName) {
      filter['items.productName'] = productName;
    }
    return this.orderModel.find(filter).sort({ createdAt: -1 }).exec();
  }
}
