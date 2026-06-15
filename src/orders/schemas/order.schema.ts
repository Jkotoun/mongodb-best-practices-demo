import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Principle #1 — Denormalization.
 *
 * A line item is embedded directly inside the order (`_id: false`), not stored
 * as a row in a separate join table. It also holds a point-in-time **snapshot**
 * of the product (`productName`, `unitPrice`): if the product's price or name
 * changes later, historical orders stay correct. We keep `productId` too, so
 * the live product is still reachable when genuinely needed.
 */
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, min: 0.01 })
  unitPrice: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  userId: Types.ObjectId;

  // Embedded line items — at least one required (Principle #3 validation).
  @Prop({
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: (items: OrderItem[]) =>
        Array.isArray(items) && items.length > 0,
      message: 'an order must contain at least one item',
    },
  })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  total: number;

  // Principle #3 — status constrained to an enum.
  @Prop({ required: true, enum: ORDER_STATUSES, default: 'pending' })
  status: OrderStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

/**
 * Principle #4 — Index commonly-queried fields.
 *
 * A compound, multikey index over the user and the embedded item names backs
 * the "what did this user order named X" profile lookup. Multikey because
 * `items.productName` indexes every embedded item's name.
 */
OrderSchema.index({ userId: 1, 'items.productName': 1 });
