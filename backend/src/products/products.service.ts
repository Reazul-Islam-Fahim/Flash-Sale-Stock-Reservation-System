import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    return this.productRepository.findOne({
      where: { id },
    });
  }

  async updateStock(
    productId: string,
    availableStock: number,
    reservedStock: number,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.availableStock = availableStock;
    product.reservedStock = reservedStock;

    return this.productRepository.save(product);
  }
}