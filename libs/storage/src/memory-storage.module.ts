import { DynamicModule } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from './storage.interface';
import { MemoryStorageAdapter } from './memory-storage.adapter';

export class MemoryStorageModule {
  static forRoot(): DynamicModule {
    return {
      module: MemoryStorageModule,
      providers: [
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useClass: MemoryStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER],
    };
  }
}
