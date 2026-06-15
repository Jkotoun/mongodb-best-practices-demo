import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

/**
 * Principle #2 — Data duplication (the overflow / source of truth).
 *
 * The full set of reviews lives here in its own collection, one document per
 * review. The product document duplicates only the latest 5 of these (see
 * `EmbeddedReview` on the Product schema) so the product page renders in a
 * single read. Everything beyond those 5 is paginated out of this collection.
 *
 * Principle #5 — `productId` is a foreign-key reference back to the product.
 */
@Schema({ timestamps: true })
export class Review {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  productId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, minlength: 1, maxlength: 500, trim: true })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
