import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for a dismissible item.
 */
export class DismissibleItemResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the item',
    example: 'welcome-banner-v2',
  })
  itemId!: string;

  @ApiProperty({
    description: 'User identifier who created the item',
    example: 'user-123',
  })
  userId!: string;

  @ApiProperty({
    description: 'When the item was created (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: string;

  @ApiPropertyOptional({
    description: 'When the item was dismissed (ISO 8601)',
    example: '2024-01-15T12:00:00.000Z',
  })
  dismissedAt?: string;
}
