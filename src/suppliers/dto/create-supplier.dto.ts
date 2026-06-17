// No class-validator decorators — validation is delegated to the Supplier
// schema (Principle #3). Schema errors are surfaced as 400s by
// MongooseValidationFilter.
export class CreateSupplierDto {
  name: string;
  contactEmail?: string;
  country?: string;
}
