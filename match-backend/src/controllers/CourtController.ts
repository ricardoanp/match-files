import { AuthRequest, ApiResponse } from '../types.js';
import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { courtService } from '../services/CourtService.js';
import { ValidationError, ForbiddenError } from '../utils/errors.js';
import { config } from '../config.js';

export class CourtController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { name, partnerName, address, geo, sports, amenities, timezone, contact } = req.body;

    if (!name || !address || !geo || !sports || !contact) {
      throw new ValidationError('Missing required fields');
    }

    const court = await courtService.createCourt(
      name,
      partnerName,
      address,
      geo,
      sports,
      amenities || [],
      timezone || 'America/Sao_Paulo',
      contact,
      req.user.userId
    );

    const response: ApiResponse<any> = {
      success: true,
      data: court,
    };

    res.status(201).json(response);
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const court = await courtService.getCourt(id);

    const response: ApiResponse<any> = {
      success: true,
      data: court,
    };

    res.json(response);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { city, state, sport, near, radiusKm } = req.query;

    let lat: number | undefined;
    let lon: number | undefined;
    let radius = config.geographic.defaultRadiusKm;

    if (near && typeof near === 'string') {
      const [latStr, lonStr] = near.split(',');
      lat = parseFloat(latStr);
      lon = parseFloat(lonStr);
    }

    if (radiusKm) {
      radius = parseInt(radiusKm as string, 10);
    }

    const courts = await courtService.listCourts({
      city: city as string,
      state: state as string,
      sport: sport as any,
      lat,
      lon,
      radiusKm: radius,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: { courts, count: courts.length },
    };

    res.json(response);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id } = req.params;
    const isAdmin = req.user.roles.includes('ADMIN');

    if (!isAdmin) {
      // Non-admin can only update their own courts
      const court = await courtService.getCourt(id);
      if (court.ownerUserId !== req.user.userId) {
        throw new ForbiddenError('Only court owner or admin can update');
      }
    }

    const updatedCourt = await courtService.updateCourt(id, req.user.userId, req.body);

    const response: ApiResponse<any> = {
      success: true,
      data: updatedCourt,
    };

    res.json(response);
  });
}

export const courtController = new CourtController();
