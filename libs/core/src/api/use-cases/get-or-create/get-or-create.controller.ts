import { Controller, Get, Inject, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  IDismissibleService,
  DISMISSIBLE_SERVICE,
} from '../../../core/dismissible.service.interface';
import {
  IDismissibleItemMapper,
  DISMISSIBLE_ITEM_MAPPER,
} from '../../dismissible-item.mapper.interface';
import { RequestContext, IRequestContext } from '@dismissible/nestjs-request';
import { GetOrCreateResponseDto } from './get-or-create.response.dto';
import {
  IResponseService,
  DISMISSIBLE_RESPONSE_SERVICE,
} from '../../../response/response.service.interface';
import { HttpExceptionFilter } from '../../../response/http-exception-filter';
import { API_TAG_DISMISSIBLE } from '../api-tags.constants';
import { DISMISSIBLE_DEFAULT_ROUTE } from '../../api.constants';
import { UserId, ItemId } from '../../validation';

/**
 * Controller for get-or-create dismissible item operations.
 */
@ApiTags(API_TAG_DISMISSIBLE)
@Controller(DISMISSIBLE_DEFAULT_ROUTE)
export class GetOrCreateController {
  constructor(
    @Inject(DISMISSIBLE_SERVICE)
    private readonly dismissibleService: IDismissibleService,
    @Inject(DISMISSIBLE_ITEM_MAPPER)
    private readonly mapper: IDismissibleItemMapper,
    @Inject(DISMISSIBLE_RESPONSE_SERVICE)
    private readonly responseService: IResponseService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get or create a dismissible item',
    description:
      'Retrieves an existing dismissible item by ID, or creates a new one if it does not exist.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User identifier (max length: 32 characters)',
    example: 'user-123',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Unique identifier for the dismissible item (max length: 32 characters)',
    example: 'welcome-banner-v2',
  })
  @ApiResponse({
    status: 200,
    description: 'The dismissible item (retrieved or created)',
    type: GetOrCreateResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Operation blocked by lifecycle hook',
  })
  @UseFilters(HttpExceptionFilter)
  async getOrCreate(
    @UserId() userId: string,
    @ItemId() itemId: string,
    @RequestContext() context: IRequestContext,
  ): Promise<GetOrCreateResponseDto> {
    const result = await this.dismissibleService.getOrCreate(itemId, userId, context);

    return this.responseService.success(this.mapper.toResponseDto(result.item));
  }
}
