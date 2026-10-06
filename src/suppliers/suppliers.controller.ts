import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a supplier' })
  @ApiResponse({ status: 201, type: SupplierResponseDto })
  async create(@Body() dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.create(dto);
    return SupplierResponseDto.fromDocument(supplier);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: SupplierResponseDto })
  async findById(@Param('id') id: string): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.findById(id);
    return SupplierResponseDto.fromDocument(supplier);
  }
}
