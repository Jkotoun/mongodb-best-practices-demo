import { ApiProperty } from '@nestjs/swagger';

export class OrderItemInput {
  @ApiProperty({ example: '6512f1a2b3c4d5e6f7890123' })
  productId: string;

  @ApiProperty({ minimum: 1, example: 1 })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: '6512f1a2b3c4d5e6f7890123' })
  userId: string;

  @ApiProperty({ type: [OrderItemInput] })
  items: OrderItemInput[];
}
