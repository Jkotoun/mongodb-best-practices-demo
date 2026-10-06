import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '6512f1a2b3c4d5e6f7890123' })
  userId: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  rating: number;

  @ApiProperty({
    maxLength: 500,
    example: 'Excellent quality, highly recommend.',
  })
  comment: string;
}
