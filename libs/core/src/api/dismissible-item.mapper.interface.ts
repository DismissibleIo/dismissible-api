import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { DismissibleItemResponseDto } from './dismissible-item-response.dto';

/**
 * Injection token for the dismissible item mapper provider.
 */
export const DISMISSIBLE_ITEM_MAPPER = Symbol('DISMISSIBLE_ITEM_MAPPER');

/**
 * Interface for dismissible item mapper providers.
 * Mapper for converting domain objects to DTOs.
 */
export interface IDismissibleItemMapper {
  /**
   * Convert a dismissible item to a response DTO.
   * Converts Date objects to ISO 8601 strings.
   */
  toResponseDto(item: DismissibleItemDto): DismissibleItemResponseDto;
}
