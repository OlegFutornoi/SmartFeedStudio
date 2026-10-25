import { APIRequestContext, APIResponse } from '@playwright/test';
import { z } from 'zod';

export interface RequestOptions {
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
}

export class ApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly baseUrl: string,
    protected defaultHeaders: Record<string, string> = {},
  ) {}

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  async get<T>(
    path: string,
    schema?: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<{ response: APIResponse; data: T }> {
    return this.sendWithSchema('get', path, schema, options);
  }

  async post<T>(
    path: string,
    data?: unknown,
    schema?: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<{ response: APIResponse; data: T }> {
    return this.sendWithSchema('post', path, schema, { ...options, data });
  }

  async patch<T>(
    path: string,
    data?: unknown,
    schema?: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<{ response: APIResponse; data: T }> {
    return this.sendWithSchema('patch', path, schema, { ...options, data });
  }

  async delete<T>(
    path: string,
    schema?: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<{ response: APIResponse; data: T }> {
    return this.sendWithSchema('delete', path, schema, options);
  }

  private async sendWithSchema<T>(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    schema?: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<{ response: APIResponse; data: T }> {
    const url = path.startsWith('http')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = { ...this.defaultHeaders, ...options?.headers };

    const response = await this.request[method](url, {
      headers,
      data: options?.data,
      params: options?.params,
    });

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (schema && json !== null) {
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new Error(
          `API Contract Mismatch at ${method.toUpperCase()} ${path}: ${parsed.error.message}`,
        );
      }
      return { response, data: parsed.data };
    }

    return { response, data: json as T };
  }
}
