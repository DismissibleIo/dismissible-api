import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ServerConfig {
  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;
}
