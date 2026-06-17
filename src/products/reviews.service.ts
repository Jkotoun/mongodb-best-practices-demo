import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { Review, ReviewDocument } from './schemas/review.schema';

const TOP_REVIEWS_LIMIT = 5;

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async addReview(
    productId: string,
    dto: CreateReviewDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    await this.reviewModel.create({
      productId: new Types.ObjectId(productId),
      userId: new Types.ObjectId(dto.userId),
      rating: dto.rating,
      comment: dto.comment,
    });

    const [stats] = await this.reviewModel.aggregate<{
      count: number;
      average: number;
    }>([
      { $match: { productId: product._id } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          average: { $avg: '$rating' },
        },
      },
    ]);

    const latest = await this.reviewModel
      .find({ productId: product._id })
      .sort({ createdAt: -1 })
      .limit(TOP_REVIEWS_LIMIT)
      .exec();

    product.reviewCount = stats?.count ?? 1;
    product.ratingAverage =
      Math.round((stats?.average ?? dto.rating) * 100) / 100;
    product.topReviews = latest.map((r) => ({
      reviewId: r._id,
      userId: r.userId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.get('createdAt') as Date,
    }));
    await product.save();

    return product;
  }

  async findReviews(productId: string, page = 1, limit = 5) {
    const skip = (page - 1) * limit;
    const filter = { productId: new Types.ObjectId(productId) };
    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);
    return { page, limit, total, items };
  }
}
