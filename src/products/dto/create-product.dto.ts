import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Mechanical Keyboard' })
  name: string;

  @ApiProperty({ example: 89.99 })
  price: number;

  @ApiPropertyOptional({ example: 100 })
  stock?: number;

  @ApiProperty({ example: '6512f1a2b3c4d5e6f7890123' })
  supplierId: string;
}
