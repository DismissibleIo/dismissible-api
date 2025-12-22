import { SuccessResponseDto } from '../../../response/dtos/success-response.dto';
import { DismissibleItemResponseDto } from '../../dismissible-item-response.dto';

/**
 * Response DTO for the dismiss operation.
 */
export class DismissResponseDto extends SuccessResponseDto(DismissibleItemResponseDto) {}
