import { ApiProperty } from '@nestjs/swagger';
import { ReviewDocument } from '../schemas/review.schema';

export class ReviewResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDocument(doc: ReviewDocument): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    dto._id = doc._id.toString();
    dto.productId = doc.productId.toString();
    dto.userId = doc.userId.toString();
    dto.rating = doc.rating;
    dto.comment = doc.comment;
    dto.createdAt = doc.get('createdAt') as Date;
    dto.updatedAt = doc.get('updatedAt') as Date;
    return dto;
  }
}

export class ReviewsPageResponseDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [ReviewResponseDto] })
  items: ReviewResponseDto[];
}
