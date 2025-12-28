import apiClient from './apiClient';
import type { ApiResponse } from '../types/api.types';

export interface MapLocation {
  MapLocationID: string;
  PrinterID: string;
  X: number;
  Y: number;
  Floor: number;
  Building: string;
  Room: string;
  Description?: string | null;
}

export interface PrinterWithLocation {
  PrinterID: string;
  Name: string;
  Status: string;
  MapLocationID?: string | null;
  X?: number | null;
  Y?: number | null;
  Floor?: number | null;
  Building?: string | null;
  Room?: string | null;
}

export interface CreateMapLocationDto {
  PrinterID: string;
  X: number;
  Y: number;
  Floor?: number;
  Building?: string;
  Room?: string;
  Description?: string;
}

export interface UpdateMapLocationDto {
  X?: number;
  Y?: number;
  Floor?: number;
  Building?: string;
  Room?: string;
  Description?: string;
}

class MapAPI {
  /**
   * Get all printers with their map locations (Admin)
   */
  async getPrintersWithLocations(building?: string, floor?: number): Promise<PrinterWithLocation[]> {
    const params = new URLSearchParams();
    if (building) params.append('building', building);
    if (floor !== undefined) params.append('floor', floor.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/map/printers?${queryString}` : '/admin/map/printers';
    
    const response = await apiClient.get<ApiResponse<PrinterWithLocation[]>>(endpoint);
    return response.data.data!;
  }

  /**
   * Get map location for a specific printer (Admin)
   */
  async getMapLocation(printerId: string): Promise<MapLocation | null> {
    try {
      const response = await apiClient.get<ApiResponse<MapLocation>>(
        `/admin/map/printers/${printerId}`
      );
      return response.data.data!;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update map location for a printer (Admin)
   */
  async upsertMapLocation(printerId: string, data: CreateMapLocationDto | UpdateMapLocationDto): Promise<MapLocation> {
    const response = await apiClient.put<ApiResponse<MapLocation>>(
      `/admin/map/printers/${printerId}`,
      data
    );
    return response.data.data!;
  }

  /**
   * Delete map location for a printer (Admin)
   */
  async deleteMapLocation(printerId: string): Promise<void> {
    await apiClient.delete(`/admin/map/printers/${printerId}`);
  }

  /**
   * Get printers with locations (Public - for students)
   */
  async getPublicPrintersWithLocations(building?: string, floor?: number): Promise<PrinterWithLocation[]> {
    const params = new URLSearchParams();
    if (building) params.append('building', building);
    if (floor !== undefined) params.append('floor', floor.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/printers/map?${queryString}` : '/printers/map';
    
    const response = await apiClient.get<ApiResponse<PrinterWithLocation[]>>(endpoint);
    return response.data.data!;
  }
}

export const mapAPI = new MapAPI();

