'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, type Reservation } from '@/lib/api';
import { differenceInSeconds, formatDistanceToNow, format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function ReservationTimer() {
  const queryClient = useQueryClient();
  const [timers, setTimers] = useState<Record<string, number>>({});

  // ✅ GET ALL RESERVATIONS (not just active) to show all statuses
  const { data: reservations } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => apiService.getAllReservations?.(),
    refetchInterval: 1000,
  });

  const completeMutation = useMutation({
    mutationFn: apiService.completeReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  // Format price helper
  const formatPrice = (price: any): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return priceNum.toFixed(2);
  };

  // Calculate total helper
  const calculateTotal = (price: any, quantity: number): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return (priceNum * quantity).toFixed(2);
  };

  // Update timers every second for active reservations
  useEffect(() => {
    const interval = setInterval(() => {
      if (!reservations) return;
      
      const newTimers: Record<string, number> = {};
      (reservations as Reservation[]).forEach((reservation: Reservation) => {
        if (reservation.status === 'active') {
          const remaining = Math.max(0, differenceInSeconds(
            new Date(reservation.expiresAt),
            new Date()
          ));
          newTimers[reservation.id] = remaining;
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservations]);

  // ✅ Status badge component with colors
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'active':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            text: 'ACTIVE',
            icon: '🟢'
          };
        case 'completed':
          return {
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            text: 'COMPLETED',
            icon: '✅'
          };
        case 'expired':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            text: 'EXPIRED',
            icon: '❌'
          };
        case 'cancelled':
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            text: 'CANCELLED',
            icon: '⚫'
          };
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            text: status.toUpperCase(),
            icon: '⚪'
          };
      }
    };

    const config = getStatusConfig(status);

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <span className="mr-2">{config.icon}</span>
        {config.text}
      </div>
    );
  };

  // ✅ Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Get status description
const getStatusDescription = (reservation: Reservation) => {
  switch (reservation.status) {
    case 'active':
      // Check if timer has reached 0
      const remainingSeconds = timers[reservation.id] || 0;
      if (remainingSeconds <= 0) {
        return 'Expired'; // Changed from "Expires"
      }
      return `Expires ${formatDistanceToNow(new Date(reservation.expiresAt))}`;
    case 'completed':
      return `Completed at ${format(new Date(reservation.completedAt!), 'HH:mm:ss')}`;
    case 'expired':
      return `Expired at ${format(new Date(reservation.expiresAt), 'HH:mm:ss')}`;
    default:
      return '';
  }
};

  const reservationList: Reservation[] = reservations || [];

  if (reservationList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-2xl mb-2">📭</div>
        <p className="text-lg font-medium">No reservations yet</p>
        <p className="text-sm mt-1">Reserve a product to see it here</p>
      </div>
    );
  }

  // ✅ Group reservations by status
  const groupedReservations: Record<string, Reservation[]> = {
    active: [],
    completed: [],
    expired: [],
    other: []
  };

  reservationList.forEach(reservation => {
    if (['active', 'completed', 'expired'].includes(reservation.status)) {
      groupedReservations[reservation.status].push(reservation);
    } else {
      groupedReservations.other.push(reservation);
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-2 text-black">Your Reservations</h2>
      
      {/* ✅ Active Reservations */}
      {groupedReservations.active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <span className="mr-2">⏳</span> Active ({groupedReservations.active.length})
          </h3>
          {groupedReservations.active.map((reservation) => (
            <div key={reservation.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-black">{reservation.product.name}</h3>
                    <StatusBadge status={reservation.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">
                        Quantity: <span className="font-medium">{reservation.quantity}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: <span className="font-medium">${formatPrice(reservation.product.price)} each</span>
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        Total: ${calculateTotal(reservation.product.price, reservation.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-1">
                        <div className="text-2xl font-mono font-bold text-green-600">
                          {formatTime(timers[reservation.id] || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getStatusDescription(reservation)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => completeMutation.mutate(reservation.id)}
                      disabled={completeMutation.isPending}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition"
                    >
                      {completeMutation.isPending ? 'Processing...' : 'Complete Purchase'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Completed Reservations */}
      {groupedReservations.completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <span className="mr-2">✅</span> Completed ({groupedReservations.completed.length})
          </h3>
          {groupedReservations.completed.map((reservation) => (
            <div key={reservation.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-black">{reservation.product.name}</h3>
                    <StatusBadge status={reservation.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Quantity: <span className="font-medium">{reservation.quantity}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: <span className="font-medium">${formatPrice(reservation.product.price)} each</span>
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        Total: ${calculateTotal(reservation.product.price, reservation.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {getStatusDescription(reservation)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Reserved: {new Date(reservation.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Expired Reservations */}
      {groupedReservations.expired.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <span className="mr-2">⌛</span> Expired ({groupedReservations.expired.length})
          </h3>
          {groupedReservations.expired.map((reservation) => (
            <div key={reservation.id} className="border border-red-200 rounded-lg p-4 bg-red-50 opacity-75">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-black">{reservation.product.name}</h3>
                    <StatusBadge status={reservation.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Quantity: <span className="font-medium">{reservation.quantity}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: <span className="font-medium">${formatPrice(reservation.product.price)} each</span>
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        Total: ${calculateTotal(reservation.product.price, reservation.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {getStatusDescription(reservation)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Expired: {new Date(reservation.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}