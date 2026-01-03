import { SuccessResponseDto } from '../../../response/dtos/success-response.dto';
import { DismissibleItemResponseDto } from '../../dismissible-item-response.dto';

/**
 * Response DTO for the restore operation.
 */
export class RestoreResponseDto extends SuccessResponseDto(DismissibleItemResponseDto) {}
