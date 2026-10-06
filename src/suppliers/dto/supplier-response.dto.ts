import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierDocument } from '../schemas/supplier.schema';

export class SupplierResponseDto {
  @ApiProperty({ example: '6512f1a2b3c4d5e6f7890123' })
  _id: string;

  @ApiProperty({ example: 'Acme Components' })
  name: string;

  @ApiPropertyOptional({ example: 'sales@acme.example' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'US' })
  country?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDocument(doc: SupplierDocument): SupplierResponseDto {
    const dto = new SupplierResponseDto();
    dto._id = doc._id.toString();
    dto.name = doc.name;
    dto.contactEmail = doc.contactEmail;
    dto.country = doc.country;
    dto.createdAt = doc.get('createdAt') as Date;
    dto.updatedAt = doc.get('updatedAt') as Date;
    return dto;
  }
}
