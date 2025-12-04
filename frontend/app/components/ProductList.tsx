'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, type Product } from '@/lib/api';
import { useState } from 'react';

export default function ProductList() {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Track which product is being reserved
  const [reservingProductId, setReservingProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: apiService.getProducts,
  });

  // Create a custom mutation hook that can be used per product
  const useCreateReservation = () => {
    return useMutation({
      mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
        apiService.createReservation(productId, quantity),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        setReservingProductId(null); // Clear reserving state
        setErrorMessage(''); // Clear any errors
      },
      onError: (error: any) => {
        console.error('Reservation error:', error);
        setErrorMessage(error?.response?.data?.message || error.message || 'Reservation failed');
        setReservingProductId(null); // Clear reserving state on error
      },
    });
  };

  // We'll create mutation instances inside the map function

  if (isLoading) return <div className="text-center py-8">Loading products...</div>;

  const productList: Product[] = products || [];

  const formatPrice = (price: any): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return priceNum.toFixed(2);
  };

  const handleReserve = async (productId: string, quantity: number) => {
    setReservingProductId(productId);
    setErrorMessage('');
    
    try {
      console.log('Creating reservation for:', productId, 'quantity:', quantity);
      await apiService.createReservation(productId, quantity);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
    } catch (error: any) {
      console.error('Reservation failed:', error);
      setErrorMessage(error?.response?.data?.message || error.message || 'Reservation failed');
    } finally {
      setReservingProductId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {errorMessage && (
        <div className="col-span-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      {productList.map((product) => (
        <div key={product.id} className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-black">{product.name}</h3>
          <p className="text-gray-600">Price: ${formatPrice(product.price)}</p>
          <div className="mt-2">
            <div className="flex justify-between items-center text-black">
              <span>Available: {product.availableStock}</span>
              <span className="text-orange-500">
                Reserved: {product.reservedStock}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2 text-black">
            <input
              type="number"
              min="1"
              max={product.availableStock}
              value={quantities[product.id] || 1}
              onChange={(e) => setQuantities(prev => ({
                ...prev,
                [product.id]: parseInt(e.target.value) || 1
              }))}
              className="border rounded px-2 py-1 w-20"
              disabled={product.availableStock === 0}
            />
            <button
              onClick={() => handleReserve(product.id, quantities[product.id] || 1)}
              disabled={product.availableStock === 0 || reservingProductId === product.id}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {reservingProductId === product.id ? 'Reserving...' : 'Reserve'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}