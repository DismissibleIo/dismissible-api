import { Module, DynamicModule, Type, Provider } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GetOrCreateController } from './api/use-cases/get-or-create/get-or-create.controller';
import { DismissController } from './api/use-cases/dismiss/dismiss.controller';
import { RestoreController } from './api/use-cases/restore/restore.controller';
import { DismissibleService } from './core/dismissible.service';
import { DISMISSIBLE_SERVICE } from './core/dismissible.service.interface';
import { DismissibleCoreService } from './core/dismissible-core.service';
import { DISMISSIBLE_CORE_SERVICE } from './core/dismissible-core.service.interface';
import { HookRunner } from './core/hook-runner.service';
import { DISMISSIBLE_HOOK_RUNNER } from './core/hook-runner.interface';
import { DismissibleItemMapper } from './api/dismissible-item.mapper';
import { DISMISSIBLE_ITEM_MAPPER } from './api/dismissible-item.mapper.interface';
import { DateService } from './utils/date/date.service';
import { DISMISSIBLE_DATE_SERVICE } from './utils/date/date.service.interface';
import { DISMISSIBLE_HOOKS, IDismissibleLifecycleHook } from '@dismissible/nestjs-hooks';
import { LoggerModule, IDismissibleLoggerModuleOptions } from '@dismissible/nestjs-logger';
import { ResponseService, ResponseModule } from './response';
import { DISMISSIBLE_RESPONSE_SERVICE } from './response/response.service.interface';
import { ValidationModule } from '@dismissible/nestjs-validation';
import { IDismissibleStorageModuleOptions, StorageModule } from '@dismissible/nestjs-storage';
import { DismissibleHelper } from './utils/dismissible.helper';
import { DISMISSIBLE_HELPER } from './utils/dismissible.helper.interface';
import { DismissibleItemModule } from '@dismissible/nestjs-item';

/**
 * Module configuration options.
 */
export type IDismissibleModuleOptions = IDismissibleLoggerModuleOptions &
  IDismissibleStorageModuleOptions & {
    hooks?: Type<IDismissibleLifecycleHook>[];
    imports?: DynamicModule[];
    providers?: Provider[];
    controllers?: Type<any>[];
  };

const defaultControllers = [GetOrCreateController, DismissController, RestoreController];

@Module({})
export class DismissibleModule {
  static forRoot(options: IDismissibleModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      // Date service
      DateService,
      { provide: DISMISSIBLE_DATE_SERVICE, useExisting: DateService },
      // Response service
      ResponseService,
      { provide: DISMISSIBLE_RESPONSE_SERVICE, useExisting: ResponseService },
      // Dismissible helper
      DismissibleHelper,
      { provide: DISMISSIBLE_HELPER, useExisting: DismissibleHelper },
      // Core service
      DismissibleCoreService,
      { provide: DISMISSIBLE_CORE_SERVICE, useExisting: DismissibleCoreService },
      // Hook runner
      HookRunner,
      { provide: DISMISSIBLE_HOOK_RUNNER, useExisting: HookRunner },
      // Main service
      DismissibleService,
      { provide: DISMISSIBLE_SERVICE, useExisting: DismissibleService },
      // Item mapper
      DismissibleItemMapper,
      { provide: DISMISSIBLE_ITEM_MAPPER, useExisting: DismissibleItemMapper },
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

    if (options.providers && options.providers.length > 0) {
      for (const provider of options.providers) {
        providers.push(provider);
      }
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
        ...(options.imports ?? []),
      ],
      controllers: options.controllers ?? defaultControllers,
      providers,
      exports: [
        // Class exports (for backward compatibility)
        DismissibleService,
        DismissibleCoreService,
        DismissibleItemMapper,
        DateService,
        ResponseService,
        // Symbol exports (for clean DI overriding)
        DISMISSIBLE_SERVICE,
        DISMISSIBLE_CORE_SERVICE,
        DISMISSIBLE_ITEM_MAPPER,
        DISMISSIBLE_DATE_SERVICE,
        DISMISSIBLE_RESPONSE_SERVICE,
        DISMISSIBLE_HOOK_RUNNER,
        DISMISSIBLE_HELPER,
        DISMISSIBLE_HOOKS,
      ],
    };
  }
}
