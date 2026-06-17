// No class-validator decorators — validation is delegated to the Order schema
// (Principle #3), including the embedded-item mins and the "at least one item"
// rule. Schema errors are surfaced as 400s by MongooseValidationFilter.
export class OrderItemInput {
  productId: string;
  quantity: number;
}

export class CreateOrderDto {
  userId: string;
  items: OrderItemInput[];
}
