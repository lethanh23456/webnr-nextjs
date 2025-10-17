import { api } from '../api/client';
import { AxiosResponse, AxiosError } from 'axios';

interface BanUserParams {
  username: string;
  adminName: string;
}

interface UpdateRoleParams {
  username: string;
  newRole: 'USER' | 'ADMIN';
  adminName: string;
}

interface ApiErrorResponse {
  data?: string;
}

class AdminService {
  // Ban user
  async banUser(username: string, adminName: string): Promise<string> {
    try {
      const response: AxiosResponse<string> = await api.post('/banUser', null, {
        params: {
          username,
          adminName
        } as BanUserParams
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      throw axiosError.response?.data || 'Có lỗi xảy ra khi ban user';
    }
  }

  // Unban user
  async unbanUser(username: string, adminName: string): Promise<string> {
    try {
      const response: AxiosResponse<string> = await api.post('/unbanUser', null, {
        params: {
          username,
          adminName
        } as BanUserParams
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      throw axiosError.response?.data || 'Có lỗi xảy ra khi unban user';
    }
  }

  // Update role
  async updateRole(username: string, newRole: 'USER' | 'ADMIN', adminName: string): Promise<string> {
    try {
      const response: AxiosResponse<string> = await api.post('/updateRole', null, {
        params: {
          username,
          newRole,
          adminName
        } as UpdateRoleParams
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      throw axiosError.response?.data || 'Có lỗi xảy ra khi cập nhật role';
    }
  }
}

export default new AdminService();