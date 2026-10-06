import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { SupplierDocument } from '../../suppliers/schemas/supplier.schema';
import { SupplierResponseDto } from '../../suppliers/dto/supplier-response.dto';
import { EmbeddedReview, ProductDocument } from '../schemas/product.schema';

export class EmbeddedReviewResponseDto {
  @ApiProperty()
  reviewId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  createdAt: Date;

  static fromEmbedded(review: EmbeddedReview): EmbeddedReviewResponseDto {
    const dto = new EmbeddedReviewResponseDto();
    dto.reviewId = review.reviewId.toString();
    dto.userId = review.userId.toString();
    dto.rating = review.rating;
    dto.comment = review.comment;
    dto.createdAt = review.createdAt;
    return dto;
  }
}

@ApiExtraModels(SupplierResponseDto)
export class ProductResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty({
    description:
      'Supplier id, or the populated supplier document when fetched with ?withSupplier=true',
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(SupplierResponseDto) }],
  })
  supplierId: string | SupplierResponseDto;

  @ApiProperty({ type: [EmbeddedReviewResponseDto] })
  topReviews: EmbeddedReviewResponseDto[];

  @ApiProperty()
  reviewCount: number;

  @ApiProperty({ minimum: 0, maximum: 5 })
  ratingAverage: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDocument(doc: ProductDocument): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto._id = doc._id.toString();
    dto.name = doc.name;
    dto.price = doc.price;
    dto.stock = doc.stock;
    dto.supplierId =
      doc.supplierId instanceof Types.ObjectId
        ? doc.supplierId.toString()
        : SupplierResponseDto.fromDocument(
            doc.supplierId as unknown as SupplierDocument,
          );
    dto.topReviews = doc.topReviews.map((review) =>
      EmbeddedReviewResponseDto.fromEmbedded(review),
    );
    dto.reviewCount = doc.reviewCount;
    dto.ratingAverage = doc.ratingAverage;
    dto.createdAt = doc.get('createdAt') as Date;
    dto.updatedAt = doc.get('updatedAt') as Date;
    return dto;
  }
}
