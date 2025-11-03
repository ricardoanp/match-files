import { AuthRequest, ApiResponse } from '../types.js';
import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { bookingService } from '../services/BookingService.js';
import { paymentService } from '../services/PaymentService.js';
import { ValidationError } from '../utils/errors.js';

export class BookingController {
  createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { type, itemId, quantity, unitPriceBRL } = req.body;

    if (!type || !itemId || !quantity || unitPriceBRL === undefined) {
      throw new ValidationError('Missing required fields');
    }

    const booking = await bookingService.createBooking(
      req.user.userId,
      type,
      itemId,
      quantity,
      unitPriceBRL
    );

    // Create payment for the booking
    const payment = await paymentService.createPayment(req.user.userId, booking.id, booking.totalBRL);

    const response: ApiResponse<any> = {
      success: true,
      data: { booking, payment },
    };

    res.status(201).json(response);
  });

  getBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const booking = await bookingService.getBooking(id);

    const response: ApiResponse<any> = {
      success: true,
      data: booking,
    };

    res.json(response);
  });

  capturePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { paymentId } = req.params;
    const { method, provider, card, pix } = req.body;

    if (!method || !provider) {
      throw new ValidationError('Missing required fields: method, provider');
    }

    const payment = await paymentService.capturePayment(
      paymentId,
      method,
      provider,
      card,
      pix,
      req.idempotencyKey
    );

    const response: ApiResponse<any> = {
      success: true,
      data: payment,
    };

    res.json(response);
  });

  cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const refundInfo = await bookingService.cancelBooking(id);

    const response: ApiResponse<any> = {
      success: true,
      data: refundInfo,
    };

    res.json(response);
  });

  checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const booking = await bookingService.checkIn(id);

    const response: ApiResponse<any> = {
      success: true,
      data: booking,
    };

    res.json(response);
  });
}

export const bookingController = new BookingController();
