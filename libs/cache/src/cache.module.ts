import { DynamicModule, Module, Type } from '@nestjs/common';
import { DISMISSIBLE_CACHE_ADAPTER, IDismissibleCache } from './cache.interface';
import { NullCacheAdapter } from './null-cache.adapter';

export type IDismissibleCacheModuleOptions = {
  cache?: Type<IDismissibleCache> | DynamicModule;
};

@Module({
  providers: [
    NullCacheAdapter,
    {
      provide: DISMISSIBLE_CACHE_ADAPTER,
      useExisting: NullCacheAdapter,
    },
  ],
  exports: [DISMISSIBLE_CACHE_ADAPTER],
})
export class CacheModule {}
