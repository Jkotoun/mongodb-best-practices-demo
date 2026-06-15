import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

/**
 * Principle #5 — Link related data.
 *
 * Supplier is its own collection. Products keep only a `supplierId` reference
 * to it (never a copy), because supplier details are evidence-level data that
 * is rarely needed on hot user-facing pages. When you do need it, resolve the
 * link on demand with `.populate('supplierId')`.
 */
@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, lowercase: true, match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ })
  contactEmail?: string;

  @Prop({ trim: true })
  country?: string;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
