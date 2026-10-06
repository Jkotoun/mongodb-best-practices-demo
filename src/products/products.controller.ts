import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsService.create(dto);
    return ProductResponseDto.fromDocument(product);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id' })
  @ApiQuery({
    name: 'withSupplier',
    required: false,
    type: Boolean,
    description: 'Populate the full supplier document instead of just its id',
  })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async findById(
    @Param('id') id: string,
    @Query('withSupplier') withSupplier?: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findById(
      id,
      withSupplier === 'true',
    );
    return ProductResponseDto.fromDocument(product);
  }
}
