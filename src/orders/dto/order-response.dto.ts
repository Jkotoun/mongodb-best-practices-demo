import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUSES } from '../schemas/order.schema';
import type {
  OrderDocument,
  OrderItem,
  OrderStatus,
} from '../schemas/order.schema';

export class OrderItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  lineTotal: number;

  static fromEmbedded(item: OrderItem): OrderItemResponseDto {
    const dto = new OrderItemResponseDto();
    dto.productId = item.productId.toString();
    dto.productName = item.productName;
    dto.unitPrice = item.unitPrice;
    dto.quantity = item.quantity;
    dto.lineTotal = item.lineTotal;
    return dto;
  }
}

export class OrderResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ enum: ORDER_STATUSES })
  status: OrderStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDocument(doc: OrderDocument): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto._id = doc._id.toString();
    dto.userId = doc.userId.toString();
    dto.items = doc.items.map((item) =>
      OrderItemResponseDto.fromEmbedded(item),
    );
    dto.total = doc.total;
    dto.status = doc.status;
    dto.createdAt = doc.get('createdAt') as Date;
    dto.updatedAt = doc.get('updatedAt') as Date;
    return dto;
  }
}
