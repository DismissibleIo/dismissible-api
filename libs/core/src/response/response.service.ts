import { HttpException, Injectable } from '@nestjs/common';
import { IErrorResponseDto, ISuccessResponseDto } from './dtos';

@Injectable()
export class ResponseService {
  success<T>(data: T): ISuccessResponseDto<T> {
    return {
      data,
    };
  }

  error(error: HttpException): IErrorResponseDto {
    return {
      error: {
        message: error.message,
        code: error.getStatus(),
      },
    };
  }
}
