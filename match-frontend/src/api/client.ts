import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types.js';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle responses
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<ApiResponse<null>>) => {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(errorMessage);
      }
    );
  }

  // Auth
  async register(name: string, email: string, password: string, phone?: string) {
    return this.client.post<ApiResponse<any>>('/auth/register', {
      name,
      email,
      password,
      phone,
    });
  }

  async login(email: string, password: string) {
    return this.client.post<ApiResponse<any>>('/auth/login', {
      email,
      password,
    });
  }

  async getMe() {
    return this.client.get<ApiResponse<any>>('/auth/me');
  }

  async updateConsents(marketing: boolean, sms: boolean, push: boolean) {
    return this.client.patch<ApiResponse<any>>('/auth/me/consents', {
      marketing,
      sms,
      push,
    });
  }

  // Courts
  async getCourts(filters?: {
    city?: string;
    state?: string;
    sport?: string;
    near?: string;
    radiusKm?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.state) params.append('state', filters.state);
    if (filters?.sport) params.append('sport', filters.sport);
    if (filters?.near) params.append('near', filters.near);
    if (filters?.radiusKm) params.append('radiusKm', String(filters.radiusKm));

    return this.client.get<ApiResponse<any>>(`/courts?${params.toString()}`);
  }

  async getCourt(id: string) {
    return this.client.get<ApiResponse<any>>(`/courts/${id}`);
  }

  async createCourt(courtData: any) {
    return this.client.post<ApiResponse<any>>('/courts', courtData);
  }

  async updateCourt(id: string, courtData: any) {
    return this.client.patch<ApiResponse<any>>(`/courts/${id}`, courtData);
  }

  // Bookings
  async createBooking(type: string, itemId: string, quantity: number, unitPriceBRL: number) {
    return this.client.post<ApiResponse<any>>('/bookings', {
      type,
      itemId,
      quantity,
      unitPriceBRL,
    });
  }

  async getBooking(id: string) {
    return this.client.get<ApiResponse<any>>(`/bookings/${id}`);
  }

  async capturePayment(
    paymentId: string,
    method: 'card' | 'pix',
    provider: 'stripe' | 'adyen',
    cardData?: any,
    pix?: any
  ) {
    return this.client.post<ApiResponse<any>>(`/bookings/${paymentId}/pay`, {
      method,
      provider,
      card: cardData,
      pix,
    });
  }

  async cancelBooking(id: string) {
    return this.client.post<ApiResponse<any>>(`/bookings/${id}/cancel`, {});
  }

  async checkInBooking(id: string) {
    return this.client.post<ApiResponse<any>>(`/bookings/${id}/check-in`, {});
  }
}

export const apiClient = new ApiClient();
