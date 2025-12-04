'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, type Reservation } from '@/lib/api';
import { differenceInSeconds, formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

export default function ReservationTimer() {
  const queryClient = useQueryClient();
  const [timers, setTimers] = useState<Record<string, number>>({});

  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'active'],
    queryFn: apiService.getActiveReservations,
    refetchInterval: 1000,
  });

  const completeMutation = useMutation({
    mutationFn: apiService.completeReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reservations', 'active'] });
    },
  });

  // Helper function to format price
  const formatPrice = (price: any): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return priceNum.toFixed(2);
  };

  // Helper function to calculate total
  const calculateTotal = (price: any, quantity: number): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return (priceNum * quantity).toFixed(2);
  };

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (!reservations) return;
      
      const newTimers: Record<string, number> = {};
      (reservations as Reservation[]).forEach((reservation: Reservation) => {
        const remaining = Math.max(0, differenceInSeconds(
          new Date(reservation.expiresAt),
          new Date()
        ));
        newTimers[reservation.id] = remaining;
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reservationList: Reservation[] = reservations || [];

  if (reservationList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No active reservations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Active Reservations</h2>
      {reservationList.map((reservation) => (
        <div key={reservation.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{reservation.product.name}</h3>
              <p className="text-sm text-gray-600">
                Quantity: {reservation.quantity} × ${formatPrice(reservation.product.price)}
              </p>
              <p className="text-sm text-gray-600">
                Total: ${calculateTotal(reservation.product.price, reservation.quantity)}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(reservation.status)}`}>
                {reservation.status.toUpperCase()}
              </span>
              {reservation.status === 'active' && (
                <div className="mt-2">
                  <div className="text-lg font-mono font-bold">
                    {formatTime(timers[reservation.id] || 0)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Expires {formatDistanceToNow(new Date(reservation.expiresAt))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {reservation.status === 'active' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => completeMutation.mutate(reservation.id)}
                disabled={completeMutation.isPending}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {completeMutation.isPending ? 'Processing...' : 'Complete Purchase'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}