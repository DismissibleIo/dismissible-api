import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Represents a dismissible item in the system.
 */
export class DismissibleItemDto {
  @ApiProperty({
    description: 'Unique identifier for the item',
    example: 'welcome-banner-v2',
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'User identifier who created the item',
    example: 'user-123',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'When the item was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'When the item was dismissed, if applicable',
    example: '2024-01-15T12:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dismissedAt?: Date;
}
