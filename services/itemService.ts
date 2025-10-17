import { api } from '../api/client';
import { AxiosResponse, AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

class itemService {

    async addItemWeb(username: string, itemId: number): Promise<string> {
        try {
          const response: AxiosResponse<string> = await api.post('/addItemWeb', {
            username,
            itemId
          }); // Gửi body JSON như Postman
          return response.data;
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorMsg = axiosError.response?.data?.message || 
                          axiosError.response?.data?.error || 
                          'Có lỗi xảy ra';
          throw errorMsg;
        }
      }
  
}

export default new itemService();