import { HttpException, Injectable } from '@nestjs/common';
import { IErrorResponseDto, ISuccessResponseDto } from './dtos';
import { IResponseService } from './response.service.interface';

@Injectable()
export class ResponseService implements IResponseService {
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
