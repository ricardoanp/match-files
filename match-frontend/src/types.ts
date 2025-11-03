// API Types (mirror of backend)
export type UserRole = 'ADMIN' | 'GESTOR_QUADRA' | 'PROFESSOR' | 'JOGADOR';
export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'no_show';
export type DayUseStatus = 'scheduled' | 'ongoing' | 'finished' | 'cancelled';
export type Sport = 'beach_tennis' | 'padel' | 'volei_praia';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  status: 'active' | 'suspended';
  location?: { lat: number; lon: number };
  consent: {
    marketing: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface Court {
  id: string;
  name: string;
  partnerName: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  geo: { lat: number; lon: number };
  sports: Sport[];
  amenities: string[];
  timezone: string;
  contact: { phone: string; email: string };
  status: 'active' | 'inactive' | 'blocked';
}

export interface IdleSlot {
  id: string;
  courtId: string;
  sport: Sport;
  startTime: string;
  endTime: string;
  priceBRL: number;
  capacity: number;
  availableSpots: number;
  status: 'open' | 'full' | 'cancelled';
  court?: Court;
}

export interface DayUseEvent {
  id: string;
  courtId: string;
  name: string;
  sport: Sport;
  date: string;
  startTime: string;
  endTime: string;
  pricePerPlayerBRL: number;
  maxParticipants: number;
  currentParticipants: number;
  jogosAulaEnabled: boolean;
  jogosAulaPriceMode?: 'per_person' | 'per_slot';
  jogosAulaPriceBRL?: number;
  status: DayUseStatus;
  court?: Court;
}

export interface Booking {
  id: string;
  userId: string;
  type: 'idle_slot' | 'day_use';
  itemId: string;
  quantity: number;
  totalBRL: number;
  status: BookingStatus;
  checkInAt?: string;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  courts: Court[];
  idleSlots: IdleSlot[];
  dayUseEvents: DayUseEvent[];
  bookings: Booking[];
  userLocation?: { lat: number; lon: number };
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
