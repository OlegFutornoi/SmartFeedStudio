import { ApiClient } from '@/core/http/api-client';

export interface AuthLoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export class AuthClient extends ApiClient {
  async login(email: string, password: string): Promise<AuthLoginResponse> {
    const { response, data } = await this.post<AuthLoginResponse>('/auth/login', {
      email,
      password,
    });

    if (response.status() !== 200 && response.status() !== 201) {
      throw new Error(`Failed to login with ${email}: status ${response.status()}`);
    }

    if (data?.accessToken) {
      this.setAuthToken(data.accessToken);
    }

    return data;
  }
}
