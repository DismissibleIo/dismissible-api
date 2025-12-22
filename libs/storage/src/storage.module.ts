import { DynamicModule, Module, Type } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from './storage.interface';
import { MemoryStorageAdapter } from './memory-storage.adapter';

export type IDismissibleStorageModuleOptions = {
  storage?: Type<any> | DynamicModule;
};

@Module({
  providers: [
    {
      provide: DISMISSIBLE_STORAGE_ADAPTER,
      useClass: MemoryStorageAdapter,
    },
  ],
  exports: [DISMISSIBLE_STORAGE_ADAPTER],
})
export class StorageModule {}
