import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

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
