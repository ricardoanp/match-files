import { AuthRequest, ApiResponse } from '../types.js';
import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authService } from '../services/AuthService.js';
import { ValidationError } from '../utils/errors.js';

export class AuthController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      throw new ValidationError('Missing required fields: name, email, password');
    }

    const result = await authService.register(name, email, password, phone);

    const response: ApiResponse<any> = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Missing required fields: email, password');
    }

    const result = await authService.login(email, password);

    const response: ApiResponse<any> = {
      success: true,
      data: result,
    };

    res.json(response);
  });

  getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await authService.getUser(req.user.userId);

    const response: ApiResponse<any> = {
      success: true,
      data: user,
    };

    res.json(response);
  });

  updateConsents = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { marketing, sms, push } = req.body;

    const consents = await authService.updateConsents(req.user.userId, {
      marketing,
      sms,
      push,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: { consents },
    };

    res.json(response);
  });
}

export const authController = new AuthController();
