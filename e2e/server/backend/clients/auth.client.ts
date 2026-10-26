import { ApiClient, RequestOptions } from '@/core/http/api-client';
import type { components } from '@/core/contracts/api.generated';
import type { AuthResponseDto } from '@smartfeed/shared';

export type RegisterRequest = Omit<components['schemas']['RegisterDto'], 'role'> & {
  role?: components['schemas']['RegisterDto']['role'];
};
export type LoginRequest = components['schemas']['LoginDto'];

export class AuthClient extends ApiClient {
  async register(data: RegisterRequest, options?: RequestOptions) {
    const result = await this.post<AuthResponseDto>('/auth/register', data, undefined, options);
    if (result.data?.tokens?.accessToken) {
      this.setAuthToken(result.data.tokens.accessToken);
    }
    return result;
  }

  async rawRegister(data: unknown, options?: RequestOptions) {
    return this.post<unknown>('/auth/register', data, undefined, options);
  }

  async login(emailOrPayload: string | LoginRequest, password?: string, options?: RequestOptions) {
    const payload: LoginRequest =
      typeof emailOrPayload === 'string'
        ? { email: emailOrPayload, password: password || '' }
        : emailOrPayload;

    const result = await this.post<AuthResponseDto>('/auth/login', payload, undefined, options);
    if (result.data?.tokens?.accessToken) {
      this.setAuthToken(result.data.tokens.accessToken);
    }
    return result;
  }

  async rawLogin(data: unknown, options?: RequestOptions) {
    return this.post<unknown>('/auth/login', data, undefined, options);
  }

  async getMe(options?: RequestOptions) {
    return this.get<unknown>('/auth/me', undefined, options);
  }

  async getBootstrap(app?: string, options?: RequestOptions) {
    return this.get<unknown>('/auth/bootstrap', undefined, {
      ...options,
      params: app ? { app } : options?.params,
    });
  }
}
