import { Controller, Delete, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DismissibleService } from '../../../core/dismissible.service';
import { DismissibleItemMapper } from '../../dismissible-item.mapper';
import { RequestContext, IRequestContext } from '@dismissible/nestjs-dismissible-request';
import { DismissResponseDto } from './dismiss.response.dto';
import { ResponseService } from '../../../response/response.service';
import { HttpExceptionFilter } from '../../../response/http-exception-filter';
import { API_TAG_DISMISSIBLE } from '../api-tags.constants';
import { UserId, ItemId } from '../../validation';

/**
 * Controller for dismiss dismissible item operations.
 */
@ApiTags(API_TAG_DISMISSIBLE)
@Controller('v1/users/:userId/items')
export class DismissController {
  constructor(
    private readonly dismissibleService: DismissibleService,
    private readonly mapper: DismissibleItemMapper,
    private readonly responseService: ResponseService,
  ) {}

  @Delete(':itemId')
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
