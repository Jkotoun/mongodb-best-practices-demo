import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

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
  @Prop({
    required: true,
    trim: true,
    match: [
      /^[A-Za-z0-9][A-Za-z0-9 .,'&-]{1,79}$/,
      'name must be 2-80 chars and start with a letter or digit',
    ],
  })
  name: string;

  @Prop({ required: true, min: [0.01, 'price must be a positive number'] })
  price: number;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ type: [EmbeddedReviewSchema], default: [] })
  topReviews: EmbeddedReview[];

  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ default: 0, min: 0, max: 5 })
  ratingAverage: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 1 });
