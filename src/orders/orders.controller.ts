import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an order; snapshots product name/price at purchase time',
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(dto);
    return OrderResponseDto.fromDocument(order);
  }

  @Get()
  @ApiOperation({ summary: 'Search orders by user and optional product name' })
  @ApiQuery({ name: 'userId' })
  @ApiQuery({ name: 'productName', required: false })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async search(
    @Query('userId') userId: string,
    @Query('productName') productName?: string,
  ): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findByUserAndProductName(
      userId,
      productName,
    );
    return orders.map((order) => OrderResponseDto.fromDocument(order));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async findById(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.findById(id);
    return OrderResponseDto.fromDocument(order);
  }
}
