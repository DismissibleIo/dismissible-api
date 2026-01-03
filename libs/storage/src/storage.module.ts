import { DynamicModule, Module, Type } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from './storage.interface';
import { MemoryStorageModule } from './memory-storage.module';

export type IDismissibleStorageModuleOptions = {
  storage?: Type<any> | DynamicModule;
};

@Module({
  imports: [MemoryStorageModule.forRoot()],
  exports: [DISMISSIBLE_STORAGE_ADAPTER],
})
export class StorageModule {}
