import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Acme Components' })
  name: string;

  @ApiPropertyOptional({ example: 'sales@acme.example' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'US' })
  country?: string;
}
