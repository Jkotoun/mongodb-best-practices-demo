import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

// Reviews are a sub-resource of products: /products/:id/reviews
@Controller('products/:id/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Full, paginated list out of the dedicated `reviews` collection.
  @Get()
  findReviews(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.findReviews(id, page, limit);
  }

  // Adds a review and refreshes the product's duplicated top-5 + aggregates.
  @Post()
  addReview(@Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.addReview(id, dto);
  }
}
