export type UserRole = 'ADMIN' | 'GESTOR_QUADRA' | 'PROFESSOR' | 'JOGADOR';
export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'no_show';
export type DayUseStatus = 'scheduled' | 'ongoing' | 'finished' | 'cancelled';
export type JogosAulaSlotStatus = 'open' | 'full' | 'finished' | 'cancelled';
export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded';
export type MatchRequestStatus = 'open' | 'matched' | 'expired' | 'cancelled';
export type ProfessorEventLinkStatus = 'invited' | 'accepted' | 'declined' | 'cancelled';
export type NotificationChannel = 'push' | 'email' | 'sms';
export type BookingType = 'idle_slot' | 'day_use';
export type Sport = 'beach_tennis' | 'padel' | 'volei_praia';
export type PenaltyReason = 'late_cancel' | 'no_show';
export type ErrorCode =
  | 'MATCH_VALIDATION_ERROR'
  | 'MATCH_UNAUTHORIZED'
  | 'MATCH_FORBIDDEN'
  | 'MATCH_NOT_FOUND'
  | 'MATCH_CONFLICT'
  | 'MATCH_PAYMENT_FAILED'
  | 'MATCH_REFUND_NOT_ALLOWED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  roles: UserRole[];
  status: 'active' | 'suspended';
  location?: { lat: number; lon: number };
  consent: {
    marketing: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
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
  ownerUserId: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IdleSlot {
  id: string;
  courtId: string;
  sport: Sport;
  startTime: Date;
  endTime: Date;
  priceBRL: number;
  capacity: number;
  availableSpots: number;
  status: 'open' | 'full' | 'cancelled' | 'closed';
  visibility: 'public' | 'hidden';
  rules: {
    cancelWindowHours: number;
    refundPolicy: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface DayUseEvent {
  id: string;
  courtId: string;
  name: string;
  sport: Sport;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  pricePerPlayerBRL: number;
  maxParticipants: number;
  currentParticipants: number;
  jogosAulaEnabled: boolean;
  jogosAulaPriceMode?: 'per_person' | 'per_slot';
  jogosAulaPriceBRL?: number;
  status: DayUseStatus;
  rules: {
    cancelWindowHours: number;
    refundPolicy: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface JogosAulaSlot {
  id: string;
  eventId: string;
  courtId: string;
  professorId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  filled: number;
  status: JogosAulaSlotStatus;
  bufferMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Booking {
  id: string;
  userId: string;
  type: BookingType;
  itemId: string;
  quantity: number;
  unitPriceBRL: number;
  totalBRL: number;
  paymentId?: string;
  status: BookingStatus;
  checkInAt?: Date;
  checkOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface JogosAulaBooking {
  id: string;
  userId: string;
  slotId: string;
  unitPriceBRL: number;
  totalBRL: number;
  paymentId?: string;
  status: BookingStatus;
  checkInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Payment {
  id: string;
  bookingId?: string;
  jogosAulaBookingId?: string;
  userId: string;
  totalBRL: number;
  status: PaymentStatus;
  providerRef?: string;
  method?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Settlement {
  id: string;
  paymentId: string;
  distribution: {
    platformFeeBRL: number;
    courtShareBRL: number;
    professorShareBRL: number;
  };
  settled: boolean;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Professor {
  id: string;
  userId: string;
  bio?: string;
  sports: Sport[];
  verified: boolean;
  rateInfo: {
    hourlyBRL?: number;
    slotBRL?: number;
  };
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ProfessorEventLink {
  id: string;
  professorId: string;
  eventId: string;
  status: ProfessorEventLinkStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface MatchRequest {
  id: string;
  userId: string;
  sport: Sport;
  level: 'iniciante' | 'intermediario' | 'avancado';
  mode: 'solo' | 'dupla';
  preferredWindow: { start: string; end: string };
  radiusKm: number;
  status: MatchRequestStatus;
  matchedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PenaltyLog {
  id: string;
  userId: string;
  reason: PenaltyReason;
  source: BookingType | 'jogos_aula';
  itemId: string;
  scoreDelta: number;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationLog {
  id: string;
  userId: string;
  channel: NotificationChannel;
  templateId: string;
  payloadJSON: Record<string, any>;
  sentAt?: Date;
  status: 'queued' | 'sent' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
  idempotencyKey?: string;
}
