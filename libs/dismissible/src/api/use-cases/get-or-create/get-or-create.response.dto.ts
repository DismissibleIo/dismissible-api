import { SuccessResponseDto } from '../../../response/dtos/success-response.dto';
import { DismissibleItemResponseDto } from '../../dismissible-item-response.dto';

/**
 * Response DTO for the getOrCreate operation.
 */
export class GetOrCreateResponseDto extends SuccessResponseDto(DismissibleItemResponseDto) {}
