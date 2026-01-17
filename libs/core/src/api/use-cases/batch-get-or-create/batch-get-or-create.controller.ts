import { Controller, Post, Body, Inject, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  IDismissibleService,
  DISMISSIBLE_SERVICE,
} from '../../../core/dismissible.service.interface';
import {
  IDismissibleItemMapper,
  DISMISSIBLE_ITEM_MAPPER,
} from '../../dismissible-item.mapper.interface';
import { RequestContext, IRequestContext } from '@dismissible/nestjs-request';
import { BatchGetOrCreateRequestDto } from './batch-get-or-create.request.dto';
import { BatchGetOrCreateResponseDto } from './batch-get-or-create.response.dto';
import {
  IResponseService,
  DISMISSIBLE_RESPONSE_SERVICE,
} from '../../../response/response.service.interface';
import { HttpExceptionFilter } from '../../../response/http-exception-filter';
import { API_TAG_DISMISSIBLE } from '../api-tags.constants';
import { UserId } from '../../validation';

/**
 * Route for batch operations (without itemId param).
 */
const BATCH_ROUTE = '/v1/users/:userId/items';

/**
 * Controller for batch get-or-create dismissible item operations.
 */
@ApiTags(API_TAG_DISMISSIBLE)
@Controller(BATCH_ROUTE)
export class BatchGetOrCreateController {
  constructor(
    @Inject(DISMISSIBLE_SERVICE)
    private readonly dismissibleService: IDismissibleService,
    @Inject(DISMISSIBLE_ITEM_MAPPER)
    private readonly mapper: IDismissibleItemMapper,
    @Inject(DISMISSIBLE_RESPONSE_SERVICE)
    private readonly responseService: IResponseService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Batch get or create dismissible items',
    description:
      'Retrieves existing dismissible items or creates new ones for the given item IDs. Returns all items in the order requested.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User identifier (max length: 64 characters)',
    example: 'user-123',
  })
  @ApiBody({
    type: BatchGetOrCreateRequestDto,
    description: 'Array of item IDs to get or create',
  })
  @ApiResponse({
    status: 200,
    description: 'The dismissible items (retrieved or created)',
    type: BatchGetOrCreateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (validation error)',
  })
  @ApiResponse({
    status: 403,
    description: 'Operation blocked by lifecycle hook',
  })
  @UseFilters(HttpExceptionFilter)
  async batchGetOrCreate(
    @UserId() userId: string,
    @Body() body: BatchGetOrCreateRequestDto,
    @RequestContext() context: IRequestContext,
  ): Promise<BatchGetOrCreateResponseDto> {
    const result = await this.dismissibleService.batchGetOrCreate(body.items, userId, context);

    const responseItems = result.items.map((item) => this.mapper.toResponseDto(item));

    return this.responseService.success(responseItems);
  }
}
