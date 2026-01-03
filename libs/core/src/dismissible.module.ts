import { Module, DynamicModule, Type, Provider } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GetOrCreateController } from './api/use-cases/get-or-create/get-or-create.controller';
import { DismissController } from './api/use-cases/dismiss/dismiss.controller';
import { RestoreController } from './api/use-cases/restore/restore.controller';
import { DismissibleService } from './core/dismissible.service';
import { DismissibleCoreService } from './core/dismissible-core.service';
import { HookRunner } from './core/hook-runner.service';
import { DismissibleItemMapper } from './api/dismissible-item.mapper';
import { DateService } from './utils/date/date.service';
import { DISMISSIBLE_HOOKS, IDismissibleLifecycleHook } from '@dismissible/nestjs-hooks';
import { LoggerModule, IDismissibleLoggerModuleOptions } from '@dismissible/nestjs-logger';
import { ResponseService, ResponseModule } from './response';
import { ValidationModule } from '@dismissible/nestjs-validation';
import { IDismissibleStorageModuleOptions, StorageModule } from '@dismissible/nestjs-storage';
import { DismissibleHelper } from './utils/dismissible.helper';
import { DismissibleItemModule } from '@dismissible/nestjs-item';

/**
 * Module configuration options.
 */
export type IDismissibleModuleOptions = IDismissibleLoggerModuleOptions &
  IDismissibleStorageModuleOptions & {
    hooks?: Type<IDismissibleLifecycleHook>[];
  };

@Module({})
export class DismissibleModule {
  static forRoot(options: IDismissibleModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      DateService,
      ResponseService,
      DismissibleCoreService,
      HookRunner,
      DismissibleService,
      DismissibleItemMapper,
      DismissibleHelper,
    ];

    if (options.hooks && options.hooks.length > 0) {
      for (const hook of options.hooks) {
        providers.push(hook);
      }

      providers.push({
        provide: DISMISSIBLE_HOOKS,
        useFactory: (...hooks: IDismissibleLifecycleHook[]) => hooks,
        inject: options.hooks,
      });
    } else {
      providers.push({
        provide: DISMISSIBLE_HOOKS,
        useValue: [],
      });
    }

    return {
      module: DismissibleModule,
      imports: [
        EventEmitterModule.forRoot(),
        LoggerModule.forRoot(options),
        ValidationModule,
        ResponseModule,
        options.storage ?? StorageModule,
        DismissibleItemModule,
      ],
      controllers: [GetOrCreateController, DismissController, RestoreController],
      providers,
      exports: [
        DismissibleService,
        DismissibleCoreService,
        DismissibleItemMapper,
        DateService,
        ResponseService,
        DISMISSIBLE_HOOKS,
      ],
    };
  }
}
