import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types.js';
import { apiClient } from '../api/client.js';

interface AuthStore extends AuthState {
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  updateConsents: (marketing: boolean, sms: boolean, push: boolean) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  register: async (name: string, email: string, password: string, phone?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.register(name, email, password, phone);
      const { token, user } = response.data;

      await AsyncStorage.setItem('authToken', token);
      set({ token, user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password);
      const { token, user } = response.data;

      await AsyncStorage.setItem('authToken', token);
      set({ token, user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    set({ token: null, user: null });
  },

  getMe: async () => {
    try {
      const response = await apiClient.getMe();
      set({ user: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateConsents: async (marketing: boolean, sms: boolean, push: boolean) => {
    try {
      const response = await apiClient.updateConsents(marketing, sms, push);
      set((state) => ({
        user: state.user
          ? {
              ...state.user,
              consent: response.data.consents,
            }
          : null,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
