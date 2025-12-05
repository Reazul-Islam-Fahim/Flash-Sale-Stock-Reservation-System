import axios from 'axios';

const API_URL =
  typeof window === 'undefined'
    ? 'http://backend:3000' // SSR inside Docker
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Browser/client-side

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Product {
  id: string;
  name: string;
  price: number;
  availableStock: number;
  reservedStock: number;
}

export interface Reservation {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
}

export const apiService = {
  getProducts: () => api.get<Product[]>('/products').then(res => res.data),
  createReservation: (productId: string, quantity: number) =>
    api.post<Reservation>('/reservations', { productId, quantity }).then(res => res.data),
  completeReservation: (reservationId: string) =>
    api.post<Reservation>(`/reservations/${reservationId}/complete`).then(res => res.data),
  getActiveReservations: () =>
    api.get<Reservation[]>('/reservations/active').then(res => res.data),
  getAllReservations: () =>
    api.get<Reservation[]>('/reservations').then(res => res.data),
};
