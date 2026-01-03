import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IRequestContext } from './request-context.interface';

export const RequestContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IRequestContext => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    return {
      requestId: headers['x-request-id'] ?? uuidv4(),
      headers,
      query: request.query,
      params: request.params,
      body: request.body,
      user: request.user,
      ip: request.ip,
      method: request.method,
      url: request.url,
      protocol: request.protocol,
      secure: request.secure,
      hostname: request.hostname,
      port: request.port,
      path: request.path,
      search: request.search,
      searchParams: request.searchParams,
      origin: request.origin,
      referer: request.referer,
      userAgent: request.userAgent,
    };
  },
);
