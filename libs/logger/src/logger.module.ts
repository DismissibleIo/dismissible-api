import { DynamicModule, Module, Type } from '@nestjs/common';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from './logger.interface';
import { Logger } from './logger';

export type IDismissibleLoggerModuleOptions = {
  /** Custom logger provider implementation */
  logger?: Type<IDismissibleLogger>;
};

@Module({})
export class LoggerModule {
  static forRoot(options: IDismissibleLoggerModuleOptions): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: DISMISSIBLE_LOGGER,
          useClass: options.logger ?? Logger,
        },
      ],
      exports: [DISMISSIBLE_LOGGER],
      global: true,
    };
  }
}
