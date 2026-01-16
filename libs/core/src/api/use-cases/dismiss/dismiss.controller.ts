import { Controller, Delete, Inject, UseFilters } from '@nestjs/common';
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
import { DismissResponseDto } from './dismiss.response.dto';
import {
  IResponseService,
  DISMISSIBLE_RESPONSE_SERVICE,
} from '../../../response/response.service.interface';
import { HttpExceptionFilter } from '../../../response/http-exception-filter';
import { API_TAG_DISMISSIBLE } from '../api-tags.constants';
import { DISMISSIBLE_DEFAULT_ROUTE } from '../../api.constants';
import { UserId, ItemId } from '../../validation';

/**
 * Controller for dismiss dismissible item operations.
 */
@ApiTags(API_TAG_DISMISSIBLE)
@Controller(DISMISSIBLE_DEFAULT_ROUTE)
export class DismissController {
  constructor(
    @Inject(DISMISSIBLE_SERVICE)
    private readonly dismissibleService: IDismissibleService,
    @Inject(DISMISSIBLE_ITEM_MAPPER)
    private readonly mapper: IDismissibleItemMapper,
    @Inject(DISMISSIBLE_RESPONSE_SERVICE)
    private readonly responseService: IResponseService,
  ) {}

  @Delete()
  @ApiOperation({
    summary: 'Dismiss an item',
    description: 'Marks a dismissible item as dismissed.',
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
    description: 'The dismissed item',
    type: DismissResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Item not found or already dismissed',
  })
  @ApiResponse({
    status: 403,
    description: 'Operation blocked by lifecycle hook',
  })
  @UseFilters(HttpExceptionFilter)
  async dismiss(
    @UserId() userId: string,
    @ItemId() itemId: string,
    @RequestContext() context: IRequestContext,
  ): Promise<DismissResponseDto> {
    const result = await this.dismissibleService.dismiss(itemId, userId, context);

    return this.responseService.success(this.mapper.toResponseDto(result.item));
  }
}
