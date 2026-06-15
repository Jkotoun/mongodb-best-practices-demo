import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // GET /orders?userId=...&productName=...  (index-backed profile search)
  @Get()
  search(
    @Query('userId') userId: string,
    @Query('productName') productName?: string,
  ) {
    return this.ordersService.findByUserAndProductName(userId, productName);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }
}
