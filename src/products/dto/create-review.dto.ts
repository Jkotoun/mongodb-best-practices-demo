// No class-validator decorators — validation is delegated to the Review schema
// (Principle #3). See MongooseValidationFilter for how the schema error becomes
// a 400 response.
export class CreateReviewDto {
  userId: string;
  rating: number;
  comment: string;
}
