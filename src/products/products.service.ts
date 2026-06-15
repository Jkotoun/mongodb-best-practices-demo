import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  create(dto: CreateProductDto): Promise<ProductDocument> {
    return this.productModel.create(dto);
  }

  /**
   * Principles #1/#2 payoff: a single read returns the product together with
   * its embedded `topReviews` and the duplicated `reviewCount`/`ratingAverage`
   * — no join to the `reviews` collection.
   *
   * Principle #5: only when `withSupplier` is requested do we resolve the
   * supplier reference with `.populate()`. The link is paid for on demand,
   * never duplicated onto every product.
   */
  async findById(id: string, withSupplier = false): Promise<ProductDocument> {
    const query = this.productModel.findById(id);
    if (withSupplier) {
      query.populate('supplierId');
    }
    const product = await query.exec();
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }
}
