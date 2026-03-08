import apiClient from './apiClient';
import type { ApiResponse } from '../types/api.types';
import { API_ENDPOINTS } from '../api-config';

/**
 * User API
 */

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  balancePages?: number; // Số trang còn lại (từ Backend)
}

/**
 * DTO để tạo mới user
 */
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role: string;
  isActive?: boolean;
}

/**
 * DTO để cập nhật user
 */
export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

/**
 * Lấy danh sách tất cả users
 */
export async function getAllUsers(): Promise<UserDTO[]> {
  const response = await apiClient.get<ApiResponse<UserDTO[]>>(
    API_ENDPOINTS.users.list
  );
  return response.data.data || [];
}

/**
 * Tạo mới user
 */
export async function createUser(userData: CreateUserDTO): Promise<UserDTO> {
  const response = await apiClient.post<ApiResponse<UserDTO>>(
    API_ENDPOINTS.users.create,
    userData
  );
  return response.data.data!;
}

/**
 * Cập nhật user
 */
export async function updateUser(id: string, userData: UpdateUserDTO): Promise<UserDTO> {
  const response = await apiClient.put<ApiResponse<UserDTO>>(
    API_ENDPOINTS.users.update(id),
    userData
  );
  return response.data.data!;
}

/**
 * Xóa user
 */
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(
    API_ENDPOINTS.users.delete(id)
  );
}

