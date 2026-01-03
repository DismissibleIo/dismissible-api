import { mock, Mock } from 'ts-jest-mocker';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { HttpExceptionFilter } from './http-exception-filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: Mock<ArgumentsHost>;
  let mockHttpArgumentsHost: {
    getResponse: jest.Mock;
    getRequest: jest.Mock;
    getNext: jest.Mock;
  };
  let mockResponse: Mock<FastifyReply>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = mock<FastifyReply>({ failIfMockNotProvided: false });
    mockResponse.status = jest.fn().mockReturnThis();
    mockResponse.send = jest.fn().mockReturnThis();

    mockHttpArgumentsHost = {
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn(),
      getNext: jest.fn(),
    };

    mockArgumentsHost = mock<ArgumentsHost>({ failIfMockNotProvided: false });
    mockArgumentsHost.switchToHttp = jest.fn().mockReturnValue(mockHttpArgumentsHost);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException with 404 status', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
      expect(mockHttpArgumentsHost.getResponse).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: 'Not found',
          code: 404,
        },
      });
    });

    it('should handle HttpException with 400 status', () => {
      const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: 'Bad request',
          code: 400,
        },
      });
    });

    it('should handle HttpException with 401 status', () => {
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: 'Unauthorized',
          code: 401,
        },
      });
    });

    it('should handle HttpException with 403 status', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: 'Forbidden',
          code: 403,
        },
      });
    });

    it('should handle HttpException with 500 status', () => {
      const exception = new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: 'Internal server error',
          code: 500,
        },
      });
    });

    it('should handle HttpException with custom status code', () => {
      const exception = new HttpException('Custom error', 418);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(418);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: 'Custom error',
          code: 418,
        },
      });
    });

    it('should handle HttpException with empty message', () => {
      const exception = new HttpException('', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: '',
          code: 400,
        },
      });
    });

    it('should handle HttpException with long message', () => {
      const longMessage =
        'This is a very long error message that contains multiple words and should be handled correctly by the filter';
      const exception = new HttpException(longMessage, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        error: {
          message: longMessage,
          code: 400,
        },
      });
    });

    it('should chain status and send methods correctly', () => {
      const exception = new HttpException('Test error', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockResponse.status).toHaveReturnedWith(mockResponse);
      const statusCallOrder = (mockResponse.status as jest.Mock).mock.invocationCallOrder[0];
      const sendCallOrder = (mockResponse.send as jest.Mock).mock.invocationCallOrder[0];
      expect(statusCallOrder).toBeLessThan(sendCallOrder);
    });

    it('should extract response from HTTP context correctly', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalledTimes(1);
      expect(mockHttpArgumentsHost.getResponse).toHaveBeenCalledTimes(1);
    });
  });
});
