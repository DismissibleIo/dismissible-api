import { Injectable } from '@nestjs/common';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { DismissibleItemResponseDto } from './dismissible-item-response.dto';

/**
 * Mapper for converting domain objects to DTOs.
 */
@Injectable()
export class DismissibleItemMapper {
  /**
   * Convert a dismissible item to a response DTO.
   * Converts Date objects to ISO 8601 strings.
   */
  toResponseDto(item: DismissibleItemDto): DismissibleItemResponseDto {
    const dto = new DismissibleItemResponseDto();

    dto.itemId = item.id;
    dto.userId = item.userId;
    dto.createdAt = item.createdAt.toISOString();

    if (item.dismissedAt) {
      dto.dismissedAt = item.dismissedAt.toISOString();
    }

    return dto;
  }
}
