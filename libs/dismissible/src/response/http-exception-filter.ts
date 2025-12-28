import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { IErrorResponseDto } from './dtos';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();

    const errorResponse: IErrorResponseDto = {
      error: {
        message: exception.message,
        code: status,
      },
    };

    response.status(status).send(errorResponse);
  }
}
