'use client';

import ProductList from '@/app/components/ProductList';
import ReservationTimer from '@/app/components/ReservationTimer';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">Flash Sale Reservation System</h1>
        <p className="text-center text-gray-600 mt-2">
          Reserve products for 2 minutes. Complete purchase before time expires!
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Available Products</h2>
          <ProductList />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Reservations</h2>
          <ReservationTimer />
        </div>
      </div>
    </div>
  );
}