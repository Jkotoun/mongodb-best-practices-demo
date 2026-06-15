import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

/**
 * Embedded copy of a review — Principle #2, Data duplication.
 *
 * `_id: false` because this is a value object embedded inside Product, not its
 * own document. It carries a `reviewId` pointing back to the canonical review
 * in the `reviews` collection. We keep the latest 5 here so the product page
 * shows reviews with zero extra queries.
 */
@Schema({ _id: false })
export class EmbeddedReview {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  reviewId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, maxlength: 500 })
  comment: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const EmbeddedReviewSchema =
  SchemaFactory.createForClass(EmbeddedReview);

@Schema({ timestamps: true })
export class Product {
  /**
   * Principle #3 — Schema validation.
   * Name must start alphanumeric and only contain a safe character set,
   * 2–80 chars total.
   */
  @Prop({
    required: true,
    trim: true,
    match: [
      /^[A-Za-z0-9][A-Za-z0-9 .,'&-]{1,79}$/,
      'name must be 2-80 chars and start with a letter or digit',
    ],
  })
  name: string;

  /** Principle #3 — price must be a positive number. */
  @Prop({ required: true, min: [0.01, 'price must be a positive number'] })
  price: number;

  @Prop({ default: 0, min: 0 })
  stock: number;

  /**
   * Principle #5 — Link related data.
   * Reference only; supplier details are never copied onto the product.
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  /** Principle #2 — duplicated subset: the latest 5 reviews. */
  @Prop({ type: [EmbeddedReviewSchema], default: [] })
  topReviews: EmbeddedReview[];

  /**
   * Principle #2 — duplicated aggregates so the product page never has to
   * touch the `reviews` collection to show counts/average.
   */
  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ default: 0, min: 0, max: 5 })
  ratingAverage: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Principle #4 — index a commonly-searched field (product catalog by name).
ProductSchema.index({ name: 1 });
