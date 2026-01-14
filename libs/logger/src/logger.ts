import { ConsoleLogger } from '@nestjs/common';
import { IDismissibleLogger } from './logger.interface';

export class Logger extends ConsoleLogger implements IDismissibleLogger {}
