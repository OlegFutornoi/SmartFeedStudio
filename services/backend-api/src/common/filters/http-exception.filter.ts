import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@/generated/prisma/client';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let code: string | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) || exception.message;
        error = (resObj.error as string) || exception.name;
        if (typeof resObj.code === 'string') {
          code = resObj.code;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const fields = (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `Unique constraint violation on ${fields}`;
          error = 'Conflict';
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = (exception.meta?.cause as string) || 'Record not found';
          error = 'Not Found';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed';
          error = 'Bad Request';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = `Database error code: ${exception.code}`;
          error = 'Database Error';
          break;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      const isProd = process.env.NODE_ENV === 'production';
      message = isProd ? 'Internal server error' : exception.message;
    } else {
      this.logger.error(`Unknown Exception on ${request.method} ${request.url}`, String(exception));
      message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      ...(code ? { code } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
