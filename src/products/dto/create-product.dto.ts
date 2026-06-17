// No class-validator decorators on purpose — request validation is delegated
// entirely to the Mongoose schema (Principle #3). Bad input falls through to
// the schema validators, which throw and are surfaced as 400s by
// MongooseValidationFilter.
export class CreateProductDto {
  name: string;
  price: number;
  stock?: number;
  supplierId: string;
}
