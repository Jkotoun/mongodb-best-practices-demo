import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // GET /products/:id?withSupplier=true
  @Get(':id')
  findById(
    @Param('id') id: string,
    @Query('withSupplier') withSupplier?: string,
  ) {
    return this.productsService.findById(id, withSupplier === 'true');
  }
}
