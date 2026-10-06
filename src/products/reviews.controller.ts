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
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import {
  ReviewResponseDto,
  ReviewsPageResponseDto,
} from './dto/review-response.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('products/:id/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List paginated reviews for a product' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: ReviewsPageResponseDto })
  async findReviews(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<ReviewsPageResponseDto> {
    const result = await this.reviewsService.findReviews(id, page, limit);
    return {
      page: result.page,
      limit: result.limit,
      total: result.total,
      items: result.items.map((review) =>
        ReviewResponseDto.fromDocument(review),
      ),
    };
  }

  @Post()
  @ApiOperation({
    summary: "Add a review and refresh the product's cached rating/top reviews",
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async addReview(
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ProductResponseDto> {
    const product = await this.reviewsService.addReview(id, dto);
    return ProductResponseDto.fromDocument(product);
  }
}
