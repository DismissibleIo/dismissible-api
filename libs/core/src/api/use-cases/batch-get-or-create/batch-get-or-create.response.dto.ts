import { ApiProperty } from '@nestjs/swagger';
import { DismissibleItemResponseDto } from '../../dismissible-item-response.dto';

/**
 * Response DTO for the batch getOrCreate operation.
 */
export class BatchGetOrCreateResponseDto {
  @ApiProperty({
    description: 'Array of dismissible items (retrieved or created)',
    type: [DismissibleItemResponseDto],
  })
  data!: DismissibleItemResponseDto[];
}
