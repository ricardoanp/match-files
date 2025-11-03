import { v4 as uuidv4 } from 'uuid';
import { db } from '../database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { Court, Sport } from '../types.js';
import { auditLog } from '../utils/logger.js';

export class CourtService {
  async createCourt(
    name: string,
    partnerName: string,
    address: any,
    geo: { lat: number; lon: number },
    sports: Sport[],
    amenities: string[],
    timezone: string,
    contact: { phone: string; email: string },
    ownerUserId: string
  ): Promise<Court> {
    const courtId = uuidv4();
    const now = new Date().toISOString();

    const court = {
      id: courtId,
      name,
      partner_name: partnerName,
      address: JSON.stringify(address),
      geo: JSON.stringify(geo),
      sports,
      amenities: JSON.stringify(amenities),
      timezone,
      contact: JSON.stringify(contact),
      owner_user_id: ownerUserId,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    await db('courts').insert(court);

    auditLog('court_created', { courtId, ownerUserId, name });

    return this.formatCourt(court);
  }

  async getCourt(courtId: string): Promise<Court> {
    const court = await db('courts').where({ id: courtId }).first();

    if (!court) {
      throw new NotFoundError('Court not found');
    }

    return this.formatCourt(court);
  }

  async listCourts(filters: {
    city?: string;
    state?: string;
    sport?: Sport;
    lat?: number;
    lon?: number;
    radiusKm?: number;
  }): Promise<Court[]> {
    let query = db('courts').where({ status: 'active' });

    if (filters.city) {
      query = query.whereRaw('address->\'city\' = ?', [filters.city]);
    }

    if (filters.state) {
      query = query.whereRaw('address->\'state\' = ?', [filters.state]);
    }

    if (filters.sport) {
      query = query.whereRaw('? = ANY(sports)', [filters.sport]);
    }

    const courts = await query.limit(100);

    // Filter by distance if lat/lon provided
    if (filters.lat !== undefined && filters.lon !== undefined && filters.radiusKm) {
      return courts.filter((court) => {
        const courtGeo = court.geo;
        const distance = this.calculateDistance(
          filters.lat!,
          filters.lon!,
          courtGeo.lat,
          courtGeo.lon
        );
        return distance <= filters.radiusKm!;
      });
    }

    return courts.map((court) => this.formatCourt(court));
  }

  async updateCourt(
    courtId: string,
    ownerUserId: string,
    updates: Partial<Court>
  ): Promise<Court> {
    const court = await db('courts').where({ id: courtId }).first();

    if (!court) {
      throw new NotFoundError('Court not found');
    }

    // Only owner or ADMIN can update (ADMIN check handled in route)
    if (court.owner_user_id !== ownerUserId) {
      throw new ForbiddenError('Only court owner can update');
    }

    const now = new Date().toISOString();
    const updateData: any = { updated_at: now };

    if (updates.name) updateData.name = updates.name;
    if (updates.address) updateData.address = JSON.stringify(updates.address);
    if (updates.geo) updateData.geo = JSON.stringify(updates.geo);
    if (updates.sports) updateData.sports = updates.sports;
    if (updates.status) updateData.status = updates.status;

    await db('courts').where({ id: courtId }).update(updateData);

    auditLog('court_updated', { courtId, ownerUserId, updates });

    const updated = await db('courts').where({ id: courtId }).first();
    return this.formatCourt(updated);
  }

  private formatCourt(row: any): Court {
    return {
      id: row.id,
      name: row.name,
      partnerName: row.partner_name,
      address: row.address,
      geo: row.geo,
      sports: row.sports,
      amenities: row.amenities,
      timezone: row.timezone,
      contact: row.contact,
      ownerUserId: row.owner_user_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const courtService = new CourtService();
