import { DataSource } from 'typeorm';
import { Product } from '../src/entities/product.entity';
import { Reservation } from '../src/entities/reservation.entity';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

async function seed() {
  console.log('Starting database seeding...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'flash_sale',
    entities: [Product, Reservation],
    synchronize: true, // Use migrations in production
  });

  try {
    await dataSource.initialize();
    console.log('Database connected successfully');

    const productRepository = dataSource.getRepository(Product);
    const reservationRepository = dataSource.getRepository(Reservation);

    // Clear existing data (optional - comment out if you want to keep existing data)
    await reservationRepository.delete({});
    await productRepository.delete({});
    console.log('Cleared existing data');

    const products = [
      { name: 'iPhone 15 Pro', price: 999.99, availableStock: 10, reservedStock: 0 },
      { name: 'MacBook Air M3', price: 1299.99, availableStock: 5, reservedStock: 0 },
      { name: 'AirPods Pro', price: 249.99, availableStock: 20, reservedStock: 0 },
      { name: 'Apple Watch Series 9', price: 399.99, availableStock: 8, reservedStock: 0 },
      { name: 'iPad Air', price: 599.99, availableStock: 12, reservedStock: 0 },
      { name: 'PlayStation 5', price: 499.99, availableStock: 15, reservedStock: 0 },
      { name: 'Nintendo Switch OLED', price: 349.99, availableStock: 7, reservedStock: 0 },
      { name: 'Sony WH-1000XM5', price: 399.99, availableStock: 9, reservedStock: 0 },
    ];

    for (const productData of products) {
      const product = productRepository.create(productData);
      await productRepository.save(product);
      console.log(`Created product: ${product.name}`);
    }

    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run the seed function
seed();