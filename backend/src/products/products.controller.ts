import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }
}