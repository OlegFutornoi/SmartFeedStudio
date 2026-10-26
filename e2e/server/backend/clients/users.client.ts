import { ApiClient, RequestOptions } from '@/core/http/api-client';
import type { components, operations } from '@/core/contracts/api.generated';

export type UserQueryParameters = operations['UsersController_getUsers']['parameters']['query'];
export type UpdateUserStatusPayload = components['schemas']['UpdateUserStatusRequestDto'];
export type CreateUserByAdminPayload = components['schemas']['CreateUserByAdminRequestDto'];

export class UsersClient extends ApiClient {
  async getUsers(params?: UserQueryParameters, options?: RequestOptions) {
    return this.get<unknown>('/users', undefined, {
      ...options,
      params: params as Record<string, string | number | boolean> | undefined,
    });
  }

  async getUserStats(options?: RequestOptions) {
    return this.get<unknown>('/users/stats', undefined, options);
  }

  async getDashboardOverview(options?: RequestOptions) {
    return this.get<unknown>('/users/dashboard-overview', undefined, options);
  }

  async getUserById(id: string, options?: RequestOptions) {
    return this.get<unknown>(`/users/${id}`, undefined, options);
  }

  async updateUserStatus(id: string, payload: UpdateUserStatusPayload, options?: RequestOptions) {
    return this.patch<unknown>(`/users/${id}/status`, payload, undefined, options);
  }

  async deleteUser(id: string, options?: RequestOptions) {
    return this.delete<unknown>(`/users/${id}`, undefined, options);
  }

  async createUser(payload: CreateUserByAdminPayload, options?: RequestOptions) {
    return this.post<unknown>('/users', payload, undefined, options);
  }
}
