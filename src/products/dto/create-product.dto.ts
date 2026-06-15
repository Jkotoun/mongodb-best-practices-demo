import {
  IsInt,
  IsMongoId,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Matches(/^[A-Za-z0-9][A-Za-z0-9 .,'&-]{1,79}$/, {
    message: 'name must be 2-80 chars and start with a letter or digit',
  })
  name: string;

  @IsPositive()
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  // Principle #5 — caller supplies the supplier reference, validated as an ObjectId.
  @IsMongoId()
  supplierId: string;
}
