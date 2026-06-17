export class OrderItemInput {
  productId: string;
  quantity: number;
}

export class CreateOrderDto {
  userId: string;
  items: OrderItemInput[];
}
