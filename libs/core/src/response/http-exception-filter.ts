import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { IErrorResponseDto } from './dtos';

/**
 * ValidationPipe reports each failed constraint in the exception's response, not its message.
 */
function getErrorMessage(exception: HttpException): string {
  const body = exception.getResponse();
  const messages = typeof body === 'object' && 'message' in body ? body.message : undefined;

  return Array.isArray(messages) ? messages.join(', ') : exception.message;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();

    const errorResponse: IErrorResponseDto = {
      error: {
        message: getErrorMessage(exception),
        code: status,
      },
    };

    response.status(status).send(errorResponse);
  }
}
