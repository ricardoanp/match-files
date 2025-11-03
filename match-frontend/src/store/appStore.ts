import { create } from 'zustand';
import { AppState, Court, IdleSlot, DayUseEvent, Booking } from '../types.js';
import { apiClient } from '../api/client.js';

interface AppStoreState extends AppState {
  setCourts: (courts: Court[]) => void;
  setIdleSlots: (slots: IdleSlot[]) => void;
  setDayUseEvents: (events: DayUseEvent[]) => void;
  setBookings: (bookings: Booking[]) => void;
  setUserLocation: (location: { lat: number; lon: number }) => void;
  fetchCourts: (filters?: any) => Promise<void>;
  fetchCourt: (id: string) => Promise<Court | null>;
  createCourt: (courtData: any) => Promise<Court>;
  updateCourt: (id: string, courtData: any) => Promise<Court>;
  createBooking: (type: string, itemId: string, quantity: number, unitPrice: number) => Promise<any>;
  cancelBooking: (bookingId: string) => Promise<void>;
  checkInBooking: (bookingId: string) => Promise<void>;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  courts: [],
  idleSlots: [],
  dayUseEvents: [],
  bookings: [],
  isLoading: false,
  error: null,

  setCourts: (courts: Court[]) => set({ courts }),
  setIdleSlots: (slots: IdleSlot[]) => set({ idleSlots: slots }),
  setDayUseEvents: (events: DayUseEvent[]) => set({ dayUseEvents: events }),
  setBookings: (bookings: Booking[]) => set({ bookings }),
  setUserLocation: (location: { lat: number; lon: number }) => set({ userLocation: location }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  fetchCourts: async (filters?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getCourts(filters);
      set({ courts: response.data.courts || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchCourt: async (id: string) => {
    try {
      const response = await apiClient.getCourt(id);
      return response.data;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  createCourt: async (courtData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.createCourt(courtData);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateCourt: async (id: string, courtData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.updateCourt(id, courtData);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createBooking: async (type: string, itemId: string, quantity: number, unitPrice: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.createBooking(type, itemId, quantity, unitPrice);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelBooking: async (bookingId: string) => {
    try {
      await apiClient.cancelBooking(bookingId);
      // Update local state
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  checkInBooking: async (bookingId: string) => {
    try {
      await apiClient.checkInBooking(bookingId);
      // Update local state
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId
            ? { ...b, checkInAt: new Date().toISOString() }
            : b
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
