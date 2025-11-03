import { v4 as uuidv4 } from 'uuid';
import { db } from '../database.js';
import { NotFoundError, ConflictError, ValidationError, RefundNotAllowedError } from '../utils/errors.js';
import { Booking, BookingStatus, BookingType } from '../types.js';
import { auditLog, eventLog } from '../utils/logger.js';

export class BookingService {
  async createBooking(
    userId: string,
    type: BookingType,
    itemId: string,
    quantity: number,
    unitPriceBRL: number
  ): Promise<Booking> {
    const bookingId = uuidv4();
    const now = new Date().toISOString();
    const totalBRL = unitPriceBRL * quantity;

    // Lock on available spots
    if (type === 'idle_slot') {
      const slot = await db('idle_slots').where({ id: itemId }).first();
      if (!slot) throw new NotFoundError('Idle slot not found');
      if (slot.available_spots < quantity) {
        throw new ConflictError('Not enough spots available');
      }

      // Optimistic lock: decrement available_spots
      const updated = await db('idle_slots')
        .where({ id: itemId, available_spots: slot.available_spots })
        .update({
          available_spots: slot.available_spots - quantity,
          status: slot.available_spots - quantity === 0 ? 'full' : 'open',
          updated_at: now,
        });

      if (!updated) {
        throw new ConflictError('Slots sold out during checkout');
      }
    } else if (type === 'day_use') {
      const event = await db('day_use_events').where({ id: itemId }).first();
      if (!event) throw new NotFoundError('Day use event not found');

      const remainingSpots = event.max_participants - event.current_participants;
      if (remainingSpots < quantity) {
        throw new ConflictError('Not enough spots available');
      }

      await db('day_use_events')
        .where({ id: itemId })
        .update({
          current_participants: event.current_participants + quantity,
          updated_at: now,
        });
    }

    const booking = {
      id: bookingId,
      user_id: userId,
      type,
      item_id: itemId,
      quantity,
      unit_price_brl: unitPriceBRL,
      total_brl: totalBRL,
      status: 'pending' as BookingStatus,
      created_at: now,
      updated_at: now,
    };

    await db('bookings').insert(booking);

    eventLog('booking_created', {
      bookingId,
      userId,
      type,
      totalBRL,
    });

    return this.formatBooking(booking);
  }

  async getBooking(bookingId: string): Promise<Booking> {
    const booking = await db('bookings').where({ id: bookingId }).first();
    if (!booking) throw new NotFoundError('Booking not found');
    return this.formatBooking(booking);
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus, paymentId?: string): Promise<Booking> {
    const now = new Date().toISOString();

    const updateData: any = { status, updated_at: now };
    if (paymentId) updateData.payment_id = paymentId;

    await db('bookings').where({ id: bookingId }).update(updateData);

    const booking = await db('bookings').where({ id: bookingId }).first();

    eventLog(`booking_${status}`, { bookingId, status });
    auditLog(`booking_status_updated`, { bookingId, status });

    return this.formatBooking(booking);
  }

  async cancelBooking(bookingId: string): Promise<{ refundAllowed: boolean; refundPercentage: number }> {
    const booking = await db('bookings').where({ id: bookingId }).first();
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.status === 'cancelled') {
      throw new ValidationError('Booking already cancelled');
    }

    const now = new Date();

    // Determine refund policy based on type
    let refundPercentage = 0;
    if (booking.type === 'idle_slot') {
      const slot = await db('idle_slots').where({ id: booking.item_id }).first();
      const createdAt = new Date(booking.created_at);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed < (slot.rules.cancelWindowHours || 24)) {
        refundPercentage = 0.8; // 80%
      }
    } else if (booking.type === 'day_use') {
      const event = await db('day_use_events').where({ id: booking.item_id }).first();
      const createdAt = new Date(booking.created_at);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed < (event.rules.cancelWindowHours || 48)) {
        refundPercentage = 0.7; // 70%
      }
    }

    if (refundPercentage === 0) {
      throw new RefundNotAllowedError('Cancellation window expired');
    }

    // Update booking status
    await this.updateBookingStatus(bookingId, 'cancelled');

    // Restore available spots
    if (booking.type === 'idle_slot') {
      const slot = await db('idle_slots').where({ id: booking.item_id }).first();
      await db('idle_slots')
        .where({ id: booking.item_id })
        .update({
          available_spots: slot.available_spots + booking.quantity,
          status: 'open',
          updated_at: new Date().toISOString(),
        });
    }

    auditLog('booking_cancelled', { bookingId, refundPercentage });

    return {
      refundAllowed: true,
      refundPercentage,
    };
  }

  async checkIn(bookingId: string): Promise<Booking> {
    const booking = await db('bookings').where({ id: bookingId }).first();
    if (!booking) throw new NotFoundError('Booking not found');

    const now = new Date().toISOString();
    await db('bookings').where({ id: bookingId }).update({
      check_in_at: now,
      updated_at: now,
    });

    eventLog('booking_checked_in', { bookingId });

    const updated = await db('bookings').where({ id: bookingId }).first();
    return this.formatBooking(updated);
  }

  private formatBooking(row: any): Booking {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      itemId: row.item_id,
      quantity: row.quantity,
      unitPriceBRL: row.unit_price_brl,
      totalBRL: row.total_brl,
      paymentId: row.payment_id,
      status: row.status,
      checkInAt: row.check_in_at ? new Date(row.check_in_at) : undefined,
      checkOutAt: row.check_out_at ? new Date(row.check_out_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const bookingService = new BookingService();
