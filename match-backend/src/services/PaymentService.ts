import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { db } from '../database.js';
import { config } from '../config.js';
import { NotFoundError, PaymentFailedError, ConflictError } from '../utils/errors.js';
import { Payment, PaymentStatus, Settlement } from '../types.js';
import { auditLog, eventLog } from '../utils/logger.js';

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createPayment(userId: string, bookingId: string, totalBRL: number): Promise<Payment> {
    const paymentId = uuidv4();
    const now = new Date().toISOString();

    const payment = {
      id: paymentId,
      booking_id: bookingId,
      user_id: userId,
      total_brl: totalBRL,
      status: 'pending' as PaymentStatus,
      created_at: now,
      updated_at: now,
    };

    await db('payments').insert(payment);

    eventLog('payment_created', { paymentId, bookingId, totalBRL });

    return this.formatPayment(payment);
  }

  async capturePayment(
    paymentId: string,
    method: 'card' | 'pix',
    provider: 'stripe' | 'adyen',
    cardData?: { number: string; exp_month: number; exp_year: number; cvc: string },
    pixKey?: string,
    idempotencyKey?: string
  ): Promise<Payment> {
    const payment = await db('payments').where({ id: paymentId }).first();
    if (!payment) throw new NotFoundError('Payment not found');

    if (payment.status !== 'pending') {
      throw new ConflictError('Payment already processed');
    }

    try {
      let providerRef = '';

      if (provider === 'stripe') {
        if (method === 'card' && cardData) {
          // Create payment intent
          const intent = await this.stripe.paymentIntents.create(
            {
              amount: Math.round(payment.total_brl * 100), // Convert to cents
              currency: 'brl',
              payment_method_data: {
                type: 'card',
                card: {
                  number: cardData.number,
                  exp_month: cardData.exp_month,
                  exp_year: cardData.exp_year,
                  cvc: cardData.cvc,
                },
              },
              confirm: true,
              automatic_payment_methods: { enabled: false },
            },
            idempotencyKey ? { idempotencyKey } : undefined
          );

          providerRef = intent.id;

          if (intent.status !== 'succeeded') {
            throw new Error(`Payment intent status: ${intent.status}`);
          }
        } else if (method === 'pix') {
          // PIX payment via Stripe
          const charge = await this.stripe.charges.create(
            {
              amount: Math.round(payment.total_brl * 100),
              currency: 'brl',
              source: 'tok_br', // Placeholder for PIX
              description: `Payment for booking`,
            },
            idempotencyKey ? { idempotencyKey } : undefined
          );
          providerRef = charge.id;
        }
      }

      // Update payment status
      const now = new Date().toISOString();
      await db('payments')
        .where({ id: paymentId })
        .update({
          status: 'captured',
          provider_ref: providerRef,
          method,
          updated_at: now,
        });

      // Update booking to paid
      if (payment.booking_id) {
        await db('bookings')
          .where({ id: payment.booking_id })
          .update({ status: 'paid', payment_id: paymentId, updated_at: now });
      }

      eventLog('payment_captured', { paymentId, providerRef, method });
      auditLog('payment_captured', { paymentId, userId: payment.user_id });

      const updated = await db('payments').where({ id: paymentId }).first();
      return this.formatPayment(updated);
    } catch (error: any) {
      const errorMsg = error.message || 'Payment capture failed';
      throw new PaymentFailedError(errorMsg, { originalError: error });
    }
  }

  async refundPayment(paymentId: string, refundPercentage: number = 1.0): Promise<Payment> {
    const payment = await db('payments').where({ id: paymentId }).first();
    if (!payment) throw new NotFoundError('Payment not found');

    try {
      if (payment.provider_ref) {
        const refundAmount = Math.round(payment.total_brl * refundPercentage * 100);

        if (payment.method === 'stripe') {
          await this.stripe.refunds.create({
            charge: payment.provider_ref,
            amount: refundAmount,
          });
        }
      }

      const now = new Date().toISOString();
      await db('payments')
        .where({ id: paymentId })
        .update({
          status: 'refunded',
          updated_at: now,
        });

      eventLog('payment_refunded', { paymentId, refundPercentage });
      auditLog('payment_refunded', { paymentId });

      const updated = await db('payments').where({ id: paymentId }).first();
      return this.formatPayment(updated);
    } catch (error: any) {
      throw new PaymentFailedError('Refund failed', { originalError: error });
    }
  }

  async calculateSplit(totalBRL: number, hasProfessor: boolean = false) {
    const platformFee = totalBRL * config.split.platformFeePct;
    const courtShare = totalBRL * config.split.courtSharePct;
    const professorShare = hasProfessor ? totalBRL * config.split.professorSharePct : 0;

    return {
      totalBRL,
      platformFeeBRL: platformFee,
      courtShareBRL: courtShare,
      professorShareBRL: professorShare,
    };
  }

  async createSettlement(paymentId: string, split: any): Promise<Settlement> {
    const settlementId = uuidv4();
    const now = new Date().toISOString();

    const settlement = {
      id: settlementId,
      payment_id: paymentId,
      distribution: JSON.stringify(split),
      settled: false,
      created_at: now,
      updated_at: now,
    };

    await db('settlements').insert(settlement);

    auditLog('settlement_created', { settlementId, paymentId });

    return this.formatSettlement(settlement);
  }

  async settlePayments(fromDate: Date, toDate: Date): Promise<Settlement[]> {
    const payments = await db('payments')
      .where({ status: 'captured' })
      .whereBetween('created_at', [fromDate.toISOString(), toDate.toISOString()]);

    const settlements = [];

    for (const payment of payments) {
      const settlement = await db('settlements').where({ payment_id: payment.id }).first();

      if (settlement && !settlement.settled) {
        await db('settlements')
          .where({ id: settlement.id })
          .update({
            settled: true,
            settled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        settlements.push(settlement);
        auditLog('payment_settled', { settlemendId: settlement.id, paymentId: payment.id });
      }
    }

    return settlements.map((s) => this.formatSettlement(s));
  }

  private formatPayment(row: any): Payment {
    return {
      id: row.id,
      bookingId: row.booking_id,
      jogosAulaBookingId: row.jogos_aula_booking_id,
      userId: row.user_id,
      totalBRL: row.total_brl,
      status: row.status,
      providerRef: row.provider_ref,
      method: row.method,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private formatSettlement(row: any): Settlement {
    return {
      id: row.id,
      paymentId: row.payment_id,
      distribution: row.distribution,
      settled: row.settled,
      settledAt: row.settled_at ? new Date(row.settled_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const paymentService = new PaymentService();
